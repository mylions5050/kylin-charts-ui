import { defineComponent, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { PropType } from 'vue'
import { ScatterChart, flattenScatterData } from '@/core/chart/scatter-chart'
import type { ScatterChartOption } from '@/core/chart/scatter-chart'
import { defaultTheme, getSeriesColor } from '@/core/theme'
import { createBem } from '@/utils/create-bem'
import { useResizeObserver } from '@/composables/use-resize-observer'
import { useTheme } from '@/composables/use-theme'
import type { HoverInfo, Padding, KAxisOption, KScatterSeries } from '@/core/types'

const bem = createBem('k-chart')

interface TooltipRow {
  name: string
  color: string
  value: string
}

/**
 * KScatterChart 散点图组件
 *
 * 职责仅三件事：响应式 props 桥接核心图表实例、title/legend DOM 结构、tooltip。
 * 双数值轴、多系列、气泡第三维、最近点命中等图表逻辑全部在 core 层，组件层保持薄。
 * 悬停索引 = 各系列散点展平后的全局序号（核心层 flattenScatterData 保证同源）。
 */
export default defineComponent({
  name: 'KScatterChart',
  props: {
    /** 系列列表（每系列一组散点） */
    series: { type: Array as PropType<KScatterSeries[]>, required: true },
    /** 图表高度 px；不传时填满父容器（需父容器有确定高度） */
    height: { type: Number, default: undefined },
    /** 是否显示图例（点击切换系列显隐） */
    /** 是否显示图例（点击可切换系列显隐）：true 头部图例；对象可指定 position（top 缺省头部 / bottom 图表下方） */
    legend: { type: [Boolean, Object] as PropType<boolean | { position?: 'top' | 'bottom' }>, default: false },
    /** tooltip 数值自定义格式化（对齐 ECharts tooltip.valueFormatter）：入参为数值与行名（x/y/size/系列名），返回字符串替换默认数值展示 */
    valueFormatter: { type: Function as PropType<(value: number, name?: string) => string>, default: undefined },
    /** x 轴配置（数值轴，name 展示轴名称） */
    xAxis: { type: Object as PropType<KAxisOption>, default: undefined },
    /** y 轴配置（数值轴，name 展示轴名称） */
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
    const chartRef = ref<ScatterChart | null>(null)
    const { chartTheme } = useTheme()

    // ---- 图例显隐（被隐藏的系列不传给核心层） ----
    const hiddenNames = ref<string[]>([])
    const visibleSeries = ref<KScatterSeries[]>([])

    const buildOption = (): ScatterChartOption => ({
      series: visibleSeries.value,
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
      const chart = new ScatterChart(wrapRef.value, buildOption())
      chart.setEvents({ onHover: handleHover })
      chartRef.value = chart
      updateChart()
    })

    useResizeObserver(wrapRef, (width, height) => {
      chartRef.value?.resize(width, height)
    })

    watch(
      () => [props.series, props.xAxis, props.yAxis, hiddenNames.value, chartTheme],
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
      // 与核心层同源解码：展平序号 → 系列 + 数据点
      const flat = flattenScatterData(visibleSeries.value)
      const item = flat[info.index]
      if (!item) {
        tipVisible.value = false
        return
      }
      const [x, y, size] = item.datum
      const si = item.si
      const seriesName = visibleSeries.value[si]?.name ?? ''
      const color = visibleSeries.value[si]?.color ?? getSeriesColor(defaultTheme.colors, si)
      const fmt = (v: number, name: string): string => (props.valueFormatter ? props.valueFormatter(v, name) : String(v))
      const rows: TooltipRow[] = [
        { name: 'x', color, value: fmt(x, 'x') },
        { name: 'y', color, value: fmt(y, 'y') },
      ]
      if (size !== undefined) {
        rows.push({ name: 'size', color, value: fmt(size, 'size') })
      }
      tipLabel.value = seriesName
      tipRows.value = rows

      // tooltip 定位：指针左下角（先左后下），越界时向右/向上翻转防出界
      const wrapW = wrapRef.value?.clientWidth ?? 0
      const wrapH = wrapRef.value?.clientHeight ?? 0
      const tipW = 168
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
