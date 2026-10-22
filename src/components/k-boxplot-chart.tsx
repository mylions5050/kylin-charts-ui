import { defineComponent, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { PropType } from 'vue'
import { BoxplotChart, parseBoxDatum } from '@/core/chart/boxplot-chart'
import type { BoxplotChartOption } from '@/core/chart/boxplot-chart'
import { defaultTheme, getSeriesColor } from '@/core/theme'
import { createBem } from '@/utils/create-bem'
import { useResizeObserver } from '@/composables/use-resize-observer'
import { useTheme } from '@/composables/use-theme'
import type { HoverInfo, Padding, KAxisOption, KBoxplotSeries } from '@/core/types'

const bem = createBem('k-chart')

interface TooltipRow {
  name: string
  color: string
  value: string
}

/**
 * KBoxplotChart 盒须图组件
 *
 * 职责仅三件事：响应式 props 桥接核心图表实例、title/legend DOM 结构、tooltip。
 * 五数概括绘制、异常点、多系列并排、悬停高亮等图表逻辑全部在 core 层，组件层保持薄。
 * 悬停索引 = 类目序号（与核心层 hitTest 同源）。
 */
export default defineComponent({
  name: 'KBoxplotChart',
  props: {
    /** x 轴类目标签（与各系列 data 一一对应） */
    labels: { type: Array as PropType<string[]>, required: true },
    /** 系列列表（每个类目下一个盒，多系列并排） */
    series: { type: Array as PropType<KBoxplotSeries[]>, required: true },
    /** 盒宽占槽位比例 0 ~ 1 */
    boxWidth: { type: Number, default: 0.6 },
    /** 图表高度 px；不传时填满父容器（需父容器有确定高度） */
    height: { type: Number, default: undefined },
    /** 是否显示图例（点击切换系列显隐） */
    /** 是否显示图例（点击可切换系列显隐）：true 头部图例；对象可指定 position（top 缺省头部 / bottom 图表下方） */
    legend: { type: [Boolean, Object] as PropType<boolean | { position?: 'top' | 'bottom' }>, default: false },
    /** x 轴配置（name 展示轴名称） */
    xAxis: { type: Object as PropType<KAxisOption>, default: undefined },
    /** y 轴配置（name 展示轴名称） */
    yAxis: { type: Object as PropType<KAxisOption>, default: undefined },
    /** 图表标题（图上方左对齐） */
    title: { type: String, default: '' },
    /** 空数据提示文案 */
    emptyText: { type: String, default: '暂无数据' },
    /** 画布内边距覆盖（对齐 ECharts grid 职责）：对象形态 Partial<Padding>，缺省用图表默认内边距 */
    padding: { type: Object as PropType<Partial<Padding>>, default: undefined },
  },
  setup(props) {
    const wrapRef = ref<HTMLDivElement | null>(null)
    const chartRef = ref<BoxplotChart | null>(null)
    const { chartTheme } = useTheme()

    // ---- 图例显隐（被隐藏的系列不传给核心层） ----
    const hiddenNames = ref<string[]>([])
    const visibleSeries = ref<KBoxplotSeries[]>([])

    const buildOption = (): BoxplotChartOption => ({
      labels: props.labels,
      series: visibleSeries.value,
      boxWidth: props.boxWidth,
      xAxis: props.xAxis,
      yAxis: props.yAxis,
      emptyText: props.emptyText,
      padding: props.padding,
      theme: chartTheme.value,
    })

    const syncVisibleSeries = (): void => {
      visibleSeries.value = props.series.filter((s) => !hiddenNames.value.includes(s.name))
    }

    const updateChart = (): void => {
      if (!chartRef.value || !wrapRef.value) return
      chartRef.value.setOption(buildOption())
      chartRef.value.resize(wrapRef.value.clientWidth, wrapRef.value.clientHeight)
    }

    onMounted(() => {
      if (!wrapRef.value) return
      syncVisibleSeries()
      const chart = new BoxplotChart(wrapRef.value, buildOption())
      chart.setEvents({ onHover: handleHover })
      chartRef.value = chart
      updateChart()
    })

    useResizeObserver(wrapRef, (width, height) => {
      chartRef.value?.resize(width, height)
    })

    watch(
      () => [props.labels, props.series, props.boxWidth, props.xAxis, props.yAxis, hiddenNames.value, chartTheme],
      () => {
        syncVisibleSeries()
        updateChart()
      },
      { deep: true }
    )

    onBeforeUnmount(() => {
      chartRef.value?.destroy()
      chartRef.value = null
    })

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
      const rows: TooltipRow[] = []
      let hasBox = false
      visibleSeries.value.forEach((s, si) => {
        const box = parseBoxDatum(s.data[info.index])
        if (!box) return
        hasBox = true
        const color = s.color ?? getSeriesColor(defaultTheme.colors, si)
        const prefix = visibleSeries.value.length > 1 ? `${s.name} · ` : ''
        rows.push({ name: `${prefix}中位数`, color, value: String(box.median) })
        rows.push({ name: `${prefix}四分位`, color, value: `${box.q1} ~ ${box.q3}` })
        rows.push({ name: `${prefix}须范围`, color, value: `${box.min} ~ ${box.max}` })
        if (box.outliers.length > 0) {
          rows.push({ name: `${prefix}异常点`, color, value: `${box.outliers.length} 个` })
        }
      })
      if (!hasBox) {
        tipVisible.value = false
        return
      }
      tipLabel.value = props.labels[info.index] ?? ''
      tipRows.value = rows

      // tooltip 定位：指针左下角（先左后下），越界时向右/向上翻转防出界
      const wrapW = wrapRef.value?.clientWidth ?? 0
      const wrapH = wrapRef.value?.clientHeight ?? 0
      const tipW = 190
      const tipH = 36 + rows.length * 22
      let left = mouseX.value - tipW - 12
      if (left < 8) left = mouseX.value + 12
      left = Math.min(left, Math.max(8, wrapW - tipW - 8))
      let top = mouseY.value + 14
      if (top + tipH > wrapH - 4) top = mouseY.value - tipH - 14
      top = Math.max(top, 4)
      tipStyle.value = { left: `${Math.round(left)}px`, top: `${Math.round(top)}px` }
      tipVisible.value = true
    }

    const toggleSeries = (name: string): void => {
      hiddenNames.value = hiddenNames.value.includes(name)
        ? hiddenNames.value.filter((n) => n !== name)
        : [...hiddenNames.value, name]
    }

    return () => {
      // legend 位置（对齐 ECharts legend.top/bottom）：top 在头部（缺省）/ bottom 在图表下方
      const legendPos = props.legend && typeof props.legend === 'object' ? props.legend.position ?? 'top' : 'top'
      const legendNode = props.legend ? (
        <div class={legendPos === 'bottom' ? [bem.e('legend'), bem.em('legend', 'bottom')] : bem.e('legend')}>
          {props.series.map((s, i) => {
            const hidden = hiddenNames.value.includes(s.name)
            const color = s.color ?? getSeriesColor(defaultTheme.colors, i)
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
        <div class={bem()} style={props.height != null ? { height: `${props.height}px` } : { height: '100%' }}>
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
