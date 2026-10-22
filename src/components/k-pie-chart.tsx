import { defineComponent, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { PropType } from 'vue'
import { PieChart } from '@/core/chart/pie-chart'
import type { PieChartOption } from '@/core/chart/pie-chart'
import { defaultTheme, getSeriesColor } from '@/core/theme'
import { createBem } from '@/utils/create-bem'
import { colorToCss } from '@/core/utils/gradient'
import { useResizeObserver } from '@/composables/use-resize-observer'
import { useTheme } from '@/composables/use-theme'
import type { HoverInfo, KPieDatum, Padding } from '@/core/types'

const bem = createBem('k-chart')

/**
 * 图例分页箭头图标：SVG chevron，几何上严格居中，不受字体基线影响。
 * deg：0 向左 / 180 向右 / 90 向上 / -90 向下
 */
const LegendNavIcon = (deg: number) => (
  <svg
    class={bem.e('legend-nav-icon')}
    viewBox="0 0 24 24"
    width={10}
    height={10}
    style={{ transform: `rotate(${deg}deg)` }}
    aria-hidden="true"
  >
    <path
      d="M14.5 5.5 8 12l6.5 6.5"
      fill="none"
      stroke="currentColor"
      stroke-width={2.4}
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
)

interface TooltipRow {
  name: string
  color: string
  value: string
}

/** 组件工厂默认形态 */
export interface PieComponentDefaults {
  /** 默认内半径比例（0~1，相对外半径），环形图用 */
  innerRadiusRatio?: number
  /** 默认玫瑰模式 */
  roseType?: 'radius' | 'area'
}

/**
 * 饼图类组件工厂：饼图 / 环形图 / 玫瑰图共用同一套组件逻辑，
 * 仅默认形态不同（内半径、玫瑰模式）。
 *
 * 职责仅三件事：响应式 props 桥接核心图表实例、title/legend DOM 结构、tooltip。
 */
export function definePieComponent(name: string, defaults: PieComponentDefaults = {}) {
  return defineComponent({
    name,
    props: {
      /** 数据项列表 */
      data: { type: Array as PropType<KPieDatum[]>, required: true },
      /** 图表高度 px（宽度随容器自适应） */
      height: { type: Number, default: 320 },
      /** 内半径比例 0~1（0 = 实心饼图） */
      innerRadius: { type: Number, default: defaults.innerRadiusRatio ?? 0 },
      /** 玫瑰模式：radius / area，缺省普通饼图 */
      roseType: { type: String as PropType<'radius' | 'area'>, default: defaults.roseType },
      /** 起始角度（度，0 = 12 点方向，顺时针） */
      startAngle: { type: Number, default: 0 },
      /** 总扫描角（度，≤360）：180 即半环形图，默认 360 整圆 */
      sweepAngle: { type: Number, default: 360 },
      /** 是否显示外部标签与引导线 */
      label: { type: Boolean, default: true },
      /** 标签布局：default 跟随扇区角度（默认）/ aligned 左右分侧对齐 + 纵向分布防重叠 */
      labelLayout: { type: String as PropType<'default' | 'aligned'>, default: 'default' },
      /** 环形中心主标题（innerRadius > 0 时生效） */
      centerTitle: { type: String, default: '' },
      /** 环形中心副标题 */
      centerSubtitle: { type: String, default: '' },
      /** 图表标题（图上方左对齐） */
      title: { type: String, default: '' },
      /** 是否显示图例（点击可切换数据项显隐） */
      legend: { type: Boolean, default: false },
      /** 图例类型：plain 常规换行 / scroll 超出宽度时横向滚动并显示分页箭头（对齐 ECharts legend.type） */
      legendType: { type: String as PropType<'plain' | 'scroll'>, default: 'plain' },
      /** 图例排布方向：horizontal 横排在图上方 / vertical 竖排在图右侧（配合 scroll 上下分页，对齐 ECharts legend.orient） */
      legendOrient: { type: String as PropType<'horizontal' | 'vertical'>, default: 'horizontal' },
      /** 空数据提示文案 */
      emptyText: { type: String, default: '暂无数据' },
      /** 选中模式（仅实心饼图支持拆开）：single / multiple，环形图与玫瑰图忽略 */
      selectedMode: { type: String as PropType<'single' | 'multiple'>, default: undefined },
      /** 选中扇区沿中角外移距离（px） */
      selectedOffset: { type: Number, default: 10 },
      /** 是否显示扇区白色描边（默认 true）；传 false 即无边框渲染 */
      itemBorder: { type: Boolean, default: true },
      /** 扇区圆角半径（px，默认 0 不倒角） */
      itemRadius: { type: Number, default: 0 },
      /** 相邻扇区间距（度，默认 0） */
      itemGap: { type: Number, default: 0 },
      /** 画布内边距覆盖（对齐 ECharts grid 职责）：对象形态 Partial<Padding>，缺省用图表默认内边距 */
      padding: { type: Object as PropType<Partial<Padding>>, default: undefined },
    },
    setup(props) {
      const wrapRef = ref<HTMLDivElement | null>(null)
      const chartRef = ref<PieChart | null>(null)
      const { chartTheme } = useTheme()

      // ---- 图例切换状态（隐藏的数据项名） ----
      const hiddenNames = ref<string[]>([])

      /** 系列色在完整数据列表中按索引固定分配，再过滤隐藏项（保证与图例同源） */
      const buildOption = (): PieChartOption => ({
        data: props.data
          .map((d, i) => ({
            ...d,
            color: d.color ?? getSeriesColor(defaultTheme.colors, i),
          }))
          .filter((d) => !hiddenNames.value.includes(d.name)),
        innerRadius: props.innerRadius > 0 ? props.innerRadius : undefined,
        roseType: props.roseType,
        startAngle: props.startAngle,
        sweepAngle: props.sweepAngle < 360 ? props.sweepAngle : undefined,
        label: { show: props.label },
        labelLayout: props.labelLayout === 'aligned' ? 'aligned' : undefined,
        centerTitle: props.centerTitle,
        centerSubtitle: props.centerSubtitle,
        emptyText: props.emptyText,
        selectedMode: props.selectedMode,
        selectedOffset: props.selectedOffset,
        itemBorder: props.itemBorder,
        itemRadius: props.itemRadius > 0 ? props.itemRadius : undefined,
        itemGap: props.itemGap > 0 ? props.itemGap : undefined,
        padding: props.padding,
        theme: chartTheme.value,
      })

      const updateChart = (): void => {
        if (!chartRef.value || !wrapRef.value) return
        chartRef.value.setOption(buildOption())
        chartRef.value.resize(wrapRef.value.clientWidth, wrapRef.value.clientHeight)
      }

      onMounted(() => {
        if (!wrapRef.value) return
        const chart = new PieChart(wrapRef.value, buildOption())
        chart.setEvents({ onHover: handleHover })
        chartRef.value = chart
        updateChart()
        nextTick(measureLegend)
      })

      useResizeObserver(wrapRef, (width, height) => {
        chartRef.value?.resize(width, height)
      })

      watch(
        () => [props.data, props.height, props.innerRadius, props.roseType, props.startAngle, props.sweepAngle, props.label, props.labelLayout, props.centerTitle, props.centerSubtitle, props.selectedMode, props.selectedOffset, props.itemBorder, props.itemRadius, props.itemGap, props.legendType, props.legendOrient, chartTheme],
        () => {
          // props 变化时同步清理已不存在的隐藏项
          hiddenNames.value = hiddenNames.value.filter((name) => props.data.some((d) => d.name === name))
          updateChart()
          nextTick(measureLegend)
        },
        { deep: true }
      )

      onBeforeUnmount(() => {
        chartRef.value?.destroy()
        chartRef.value = null
      })

      const toggleDatum = (name: string): void => {
        hiddenNames.value = hiddenNames.value.includes(name)
          ? hiddenNames.value.filter((n) => n !== name)
          : [...hiddenNames.value, name]
        updateChart()
      }

      // ---- 可滚动图例：横向滚动 + 左右分页箭头（对齐 ECharts legend.type='scroll'） ----
      const legendViewportRef = ref<HTMLDivElement | null>(null)
      const legendTrackRef = ref<HTMLDivElement | null>(null)
      const legendOffset = ref(0)
      const legendMaxOffset = ref(0)

      const measureLegend = (): void => {
        const vp = legendViewportRef.value
        const track = legendTrackRef.value
        if (!vp || !track) {
          legendMaxOffset.value = 0
          return
        }
        // 竖排图例按高度计量，横排按宽度计量
        const vertical = props.legendOrient === 'vertical'
        legendMaxOffset.value = Math.max(
          0,
          vertical ? track.scrollHeight - vp.clientHeight : track.scrollWidth - vp.clientWidth
        )
        legendOffset.value = Math.min(legendOffset.value, legendMaxOffset.value)
      }

      const scrollLegend = (dir: 1 | -1): void => {
        const stepPx = props.legendOrient === 'vertical' ? 100 : 120
        legendOffset.value = Math.min(
          Math.max(legendOffset.value + dir * stepPx, 0),
          legendMaxOffset.value
        )
      }

      useResizeObserver(legendViewportRef, () => measureLegend())

      // ---- tooltip 状态（定位锚点跟随鼠标，显示在指针左下角，对齐 ECharts 交互风格） ----
      const tipVisible = ref(false)
      const tipLabel = ref('')
      const tipRows = ref<TooltipRow[]>([])
      const tipStyle = ref<Record<string, string>>({})
      const mouseX = ref(0)
      const mouseY = ref(0)

      const trackPointer = (e: PointerEvent): void => {
        if (!wrapRef.value) return
        const rect = wrapRef.value.getBoundingClientRect()
        mouseX.value = e.clientX - rect.left
        mouseY.value = e.clientY - rect.top
      }

      const handleHover = (info: HoverInfo | null): void => {
        if (!info || !chartRef.value) {
          tipVisible.value = false
          return
        }
        const option = buildOption()
        const visible = option.data ?? []
        // 只展示悬停区域的单条数据（对齐 ECharts item 触发），占比按全部可见数据合计计算
        const total = visible.reduce((sum, d) => sum + d.value, 0)
        const hovered = visible[info.index]
        tipLabel.value = hovered?.name ?? ''
        if (hovered) {
          const pct = total > 0 ? (hovered.value / total) * 100 : 0
          tipRows.value = [
            {
              name: hovered.name,
              color: colorToCss(hovered.color, defaultTheme.colors[0]),
              value: `${hovered.value}（${Number(pct.toFixed(1))}%）`,
            },
          ]
        } else {
          tipRows.value = []
        }

        // tooltip 定位：指针左下角（先左后下），越界时向右/向上翻转防出界
        const wrapW = wrapRef.value?.clientWidth ?? 0
        const wrapH = wrapRef.value?.clientHeight ?? 0
        const tipW = 168
        const tipH = (tipRows.value.length > 1 ? 36 : 24) + tipRows.value.length * 22
        let left = mouseX.value - tipW - 12
        if (left < 8) left = mouseX.value + 12
        left = Math.min(left, Math.max(8, wrapW - tipW - 8))
        let top = mouseY.value + 14
        if (top + tipH > wrapH - 4) top = mouseY.value - tipH - 14
        top = Math.max(top, 4)
        tipStyle.value = { left: `${Math.round(left)}px`, top: `${Math.round(top)}px` }
        tipVisible.value = true
      }

      return () => {
        const verticalLegend = props.legend && props.legendType === 'scroll' && props.legendOrient === 'vertical'
        const hasHeader = Boolean(props.title) || (props.legend && !verticalLegend)
        const scrollable = props.legendType === 'scroll'
        const legendItems = props.data.map((d, i) => {
          const hidden = hiddenNames.value.includes(d.name)
          const color = colorToCss(d.color, getSeriesColor(defaultTheme.colors, i))
          return (
            <span
              key={d.name}
              class={[bem.e('legend-item'), hidden ? bem.em('legend-item', 'hidden') : '']}
              onClick={() => toggleDatum(d.name)}
            >
              <span
                class={bem.e('legend-dot')}
                style={{ background: hidden ? defaultTheme.emptyColor : color }}
              />
              <span>{d.name}</span>
            </span>
          )
        })
        return (
          <div class={bem()} style={{ height: `${props.height}px` }}>
            {hasHeader && (
              <div class={bem.e('header')}>
                {props.title && <span class={bem.e('title')}>{props.title}</span>}
                {props.legend && !verticalLegend &&
                  (scrollable ? (
                    <div class={[bem.e('legend'), bem.em('legend', 'scroll')]}>
                      {legendOffset.value > 0 && (
                        <span class={bem.e('legend-nav')} onClick={() => scrollLegend(-1)}>
                          {LegendNavIcon(0)}
                        </span>
                      )}
                      <div class={bem.e('legend-viewport')} ref={legendViewportRef}>
                        <div
                          class={bem.e('legend-track')}
                          ref={legendTrackRef}
                          style={{ transform: `translateX(-${legendOffset.value}px)` }}
                        >
                          {legendItems}
                        </div>
                      </div>
                      {legendOffset.value < legendMaxOffset.value && (
                        <span class={bem.e('legend-nav')} onClick={() => scrollLegend(1)}>
                          {LegendNavIcon(180)}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div class={bem.e('legend')}>{legendItems}</div>
                  ))}
              </div>
            )}
            {verticalLegend ? (
              <div class={bem.e('body')}>
                <div class={bem.e('canvas')} ref={wrapRef} onPointermove={trackPointer}>
                  <div class={[bem.e('tooltip'), tipVisible.value ? '' : bem.em('tooltip', 'hidden')]} style={tipStyle.value}>
                    {tipRows.value.length > 1 && <div class={bem.e('tooltip-label')}>{tipLabel.value}</div>}
                    <div class={bem.e('tooltip-rows')}>
                      {tipRows.value.map((row) => (
                        <div class={bem.e('tooltip-row')} key={row.name}>
                          <span class={bem.e('tooltip-dot')} style={{ background: row.color }} />
                          <span class={bem.e('tooltip-name')}>{row.name}</span>
                          <span class={bem.e('tooltip-value')}>{row.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div class={[bem.e('legend'), bem.em('legend', 'vscroll')]}>
                  <div class={[bem.e('legend-viewport'), bem.em('legend-viewport', 'v')]} ref={legendViewportRef}>
                    <div
                      class={[bem.e('legend-track'), bem.em('legend-track', 'v')]}
                      ref={legendTrackRef}
                      style={{ transform: `translateY(-${legendOffset.value}px)` }}
                    >
                      {legendItems}
                    </div>
                  </div>
                  {(() => {
                    const upDisabled = legendOffset.value <= 0
                    const downDisabled = legendOffset.value >= legendMaxOffset.value
                    return (
                      <div class={bem.e('legend-nav-group')}>
                        <span
                          class={[bem.e('legend-nav'), upDisabled ? bem.em('legend-nav', 'disabled') : '']}
                          onClick={() => {
                            if (!upDisabled) scrollLegend(-1)
                          }}
                        >
                          {LegendNavIcon(90)}
                        </span>
                        <span
                          class={[bem.e('legend-nav'), downDisabled ? bem.em('legend-nav', 'disabled') : '']}
                          onClick={() => {
                            if (!downDisabled) scrollLegend(1)
                          }}
                        >
                          {LegendNavIcon(-90)}
                        </span>
                      </div>
                    )
                  })()}
                </div>
              </div>
            ) : (
              <div class={bem.e('canvas')} ref={wrapRef} onPointermove={trackPointer}>
                <div class={[bem.e('tooltip'), tipVisible.value ? '' : bem.em('tooltip', 'hidden')]} style={tipStyle.value}>
                  {tipRows.value.length > 1 && <div class={bem.e('tooltip-label')}>{tipLabel.value}</div>}
                  <div class={bem.e('tooltip-rows')}>
                    {tipRows.value.map((row) => (
                      <div class={bem.e('tooltip-row')} key={row.name}>
                        <span class={bem.e('tooltip-dot')} style={{ background: row.color }} />
                        <span class={bem.e('tooltip-name')}>{row.name}</span>
                        <span class={bem.e('tooltip-value')}>{row.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      }
    },
  })
}

/** KPieChart 饼图 */
export default definePieComponent('KPieChart')
