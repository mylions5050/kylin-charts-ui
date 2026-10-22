import { defineComponent, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { PropType } from 'vue'
import { RadarChart } from '@/core/chart/radar-chart'
import type { RadarChartOption } from '@/core/chart/radar-chart'
import { defaultTheme, getSeriesColor } from '@/core/theme'
import { createBem } from '@/utils/create-bem'
import { colorToCss } from '@/core/utils/gradient'
import { useResizeObserver } from '@/composables/use-resize-observer'
import { useTheme } from '@/composables/use-theme'
import type { HoverInfo, Padding, KRadarIndicator, KRadarSeries } from '@/core/types'

const bem = createBem('k-chart')

interface TooltipRow {
  name: string
  color: string
  value: string
}

/**
 * KRadarChart 雷达图组件
 *
 * 职责仅三件事：响应式 props 桥接核心图表实例、title/legend DOM 结构、tooltip。
 * 图表逻辑全部在 core 层，组件层保持薄。
 */
export default defineComponent({
  name: 'KRadarChart',
  props: {
    /** 维度指标列表（至少 3 个） */
    indicators: { type: Array as PropType<KRadarIndicator[]>, required: true },
    /** 数据系列 */
    series: { type: Array as PropType<KRadarSeries[]>, required: true },
    /** 图表高度 px（宽度随容器自适应） */
    height: { type: Number, default: 360 },
    /** 网格形状：polygon / circle */
    shape: { type: String as PropType<'polygon' | 'circle'>, default: 'polygon' },
    /** 网格圈数 */
    splitNumber: { type: Number, default: 5 },
    /** 起始角度（度，0 = 12 点方向，顺时针） */
    startAngle: { type: Number, default: 0 },
    /** 是否显示维度名称 */
    axisName: { type: Boolean, default: true },
    /** 全局面积开关（系列级 area 优先级更高） */
    area: { type: Boolean, default: true },
    /** 图表标题（图上方左对齐） */
    title: { type: String, default: '' },
    /** 是否显示图例（点击可切换系列显隐） */
    /** 是否显示图例（点击可切换系列显隐）：true 头部图例；对象可指定 position（top 缺省头部 / bottom 图表下方） */
    legend: { type: [Boolean, Object] as PropType<boolean | { position?: 'top' | 'bottom' }>, default: false },
    /** 空数据提示文案 */
    emptyText: { type: String, default: '暂无数据' },
    /** 画布内边距覆盖（对齐 ECharts grid 职责）：对象形态 Partial<Padding>，缺省用图表默认内边距 */
    padding: { type: Object as PropType<Partial<Padding>>, default: undefined },
  },
  setup(props) {
    const wrapRef = ref<HTMLDivElement | null>(null)
    const chartRef = ref<RadarChart | null>(null)
    const { chartTheme } = useTheme()

    // ---- 图例切换状态（隐藏的系列名） ----
    const hiddenNames = ref<string[]>([])

    /** 系列色在完整系列列表中按索引固定分配，再过滤隐藏项（保证与图例同源） */
    const buildOption = (): RadarChartOption => ({
      indicators: props.indicators,
      series: props.series
        .map((s, i) => ({
          ...s,
          color: s.color ?? getSeriesColor(defaultTheme.colors, i),
          area: s.area ?? props.area,
        }))
        .filter((s) => !hiddenNames.value.includes(s.name)),
      shape: props.shape,
      splitNumber: props.splitNumber,
      startAngle: props.startAngle,
      axisName: props.axisName,
      emptyText: props.emptyText,
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
      const chart = new RadarChart(wrapRef.value, buildOption())
      chart.setEvents({ onHover: handleHover })
      chartRef.value = chart
      updateChart()
    })

    useResizeObserver(wrapRef, (width, height) => {
      chartRef.value?.resize(width, height)
    })

    watch(
      () => [props.indicators, props.series, props.height, props.shape, props.splitNumber, props.startAngle, props.axisName, props.area, chartTheme],
      () => {
        // props 变化时同步清理已不存在的隐藏项
        hiddenNames.value = hiddenNames.value.filter((name) => props.series.some((s) => s.name === name))
        updateChart()
      },
      { deep: true }
    )

    onBeforeUnmount(() => {
      chartRef.value?.destroy()
      chartRef.value = null
    })

    const toggleSeries = (name: string): void => {
      hiddenNames.value = hiddenNames.value.includes(name)
        ? hiddenNames.value.filter((n) => n !== name)
        : [...hiddenNames.value, name]
      updateChart()
    }

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
      tipLabel.value = option.indicators[info.index]?.name ?? ''
      tipRows.value = option.series.map((s) => ({
        name: s.name,
        color: colorToCss(s.color, defaultTheme.colors[0]),
        value: String(s.data[info.index] ?? 0),
      }))

      // tooltip 定位：指针左下角（先左后下），越界时向右/向上翻转防出界
      const wrapW = wrapRef.value?.clientWidth ?? 0
      const wrapH = wrapRef.value?.clientHeight ?? 0
      const tipW = 168
      const tipH = 36 + tipRows.value.length * 22
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
      // legend 位置（对齐 ECharts legend.top/bottom）：top 在头部（缺省）/ bottom 在图表下方
      const legendPos = props.legend && typeof props.legend === 'object' ? props.legend.position ?? 'top' : 'top'
      const legendNode = props.legend ? (
        <div class={legendPos === 'bottom' ? [bem.e('legend'), bem.em('legend', 'bottom')] : bem.e('legend')}>
          {props.series.map((s, i) => {
            const hidden = hiddenNames.value.includes(s.name)
            const color = colorToCss(s.color, getSeriesColor(defaultTheme.colors, i))
            return (
              <span
                key={s.name}
                class={[bem.e('legend-item'), hidden ? bem.em('legend-item', 'hidden') : '']}
                onClick={() => toggleSeries(s.name)}
              >
                <span
                  class={bem.e('legend-dot')}
                  style={{ background: hidden ? defaultTheme.emptyColor : color }}
                />
                <span>{s.name}</span>
              </span>
            )
          })}
        </div>
      ) : null
      const hasHeader = Boolean(props.title) || Boolean(legendNode)
      return (
        <div class={bem()} style={{ height: `${props.height}px` }}>
          {hasHeader && (
            <div class={bem.e('header')}>
              {props.title && <span class={bem.e('title')}>{props.title}</span>}
              {legendPos === 'top' && legendNode}
            </div>
          )}
          <div class={bem.e('canvas')} ref={wrapRef} onPointermove={trackPointer}>
          <div class={[bem.e('tooltip'), tipVisible.value ? '' : bem.em('tooltip', 'hidden')]} style={tipStyle.value}>
            <div class={bem.e('tooltip-label')}>{tipLabel.value}</div>
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
          {legendPos === 'bottom' && legendNode}
        </div>
      )
    }
  },
})
