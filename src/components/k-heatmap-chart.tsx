import { defineComponent, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { PropType } from 'vue'
import { HeatmapChart, sampleHeatColor } from '@/core/chart/heatmap-chart'
import type { HeatmapChartOption } from '@/core/chart/heatmap-chart'
import { defaultTheme } from '@/core/theme'
import { createBem } from '@/utils/create-bem'
import { useResizeObserver } from '@/composables/use-resize-observer'
import { useTheme } from '@/composables/use-theme'
import type { HoverInfo, Padding, KHeatmapDatum } from '@/core/types'

const bem = createBem('k-chart')

interface TooltipRow {
  name: string
  color: string
  value: string
}

/**
 * KHeatmapChart 热力图组件
 *
 * 职责仅三件事：响应式 props 桥接核心图表实例、title DOM 结构、tooltip。
 * 网格布局、渐变色标、数值标签、悬停高亮等图表逻辑全部在 core 层，组件层保持薄。
 * 悬停索引 = 行优先全网格序号（核心层 hitTest 保证同源）。
 */
export default defineComponent({
  name: 'KHeatmapChart',
  props: {
    /** 行类目（第一行绘制在顶部） */
    rows: { type: Array as PropType<string[]>, required: true },
    /** 列类目（自左向右） */
    columns: { type: Array as PropType<string[]>, required: true },
    /** 热力数据：[列索引, 行索引, 数值]，缺失组合不绘制 */
    data: { type: Array as PropType<KHeatmapDatum[]>, required: true },
    /** 渐变色标（>=2 个，按值域线性插值）；缺省品牌蓝浅→深 */
    colorStops: { type: Array as PropType<string[]>, default: undefined },
    /** 是否显示单元格数值标签（空间不足自动跳过） */
    label: { type: Boolean, default: true },
    /** 单元格间距 px */
    cellGap: { type: Number, default: 2 },
    /** 值域下界覆盖（缺省取数据最小值，固定值域可让色标中点对准特定值） */
    min: { type: Number, default: undefined },
    /** 值域上界覆盖（缺省取数据最大值） */
    max: { type: Number, default: undefined },
    /** 图表高度 px；不传时填满父容器（需父容器有确定高度） */
    height: { type: Number, default: undefined },
    /** 图表标题（图上方左对齐） */
    title: { type: String, default: '' },
    /** 空数据提示文案 */
    emptyText: { type: String, default: '暂无数据' },
    /** 画布内边距覆盖（对齐 ECharts grid 职责）：对象形态 Partial<Padding>，缺省用图表默认内边距 */
    padding: { type: Object as PropType<Partial<Padding>>, default: undefined },
  },
  setup(props) {
    const wrapRef = ref<HTMLDivElement | null>(null)
    const chartRef = ref<HeatmapChart | null>(null)
    const { chartTheme } = useTheme()

    const buildOption = (): HeatmapChartOption => ({
      rows: props.rows,
      columns: props.columns,
      data: props.data,
      colorStops: props.colorStops,
      label: { show: props.label },
      cellGap: props.cellGap,
      min: props.min,
      max: props.max,
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
      const chart = new HeatmapChart(wrapRef.value, buildOption())
      chart.setEvents({ onHover: handleHover })
      chartRef.value = chart
      updateChart()
    })

    useResizeObserver(wrapRef, (width, height) => {
      chartRef.value?.resize(width, height)
    })

    watch(
      () => [props.rows, props.columns, props.data, props.colorStops, props.label, props.cellGap, props.min, props.max, chartTheme],
      () => updateChart(),
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
      // 与核心层同源解码：全网格序号 → 行列 → 数值
      const r = Math.floor(info.index / props.columns.length)
      const c = info.index % props.columns.length
      const datum = props.data.find((d) => d[0] === c && d[1] === r)
      if (!datum) {
        tipVisible.value = false
        return
      }
      const value = datum[2]
      // 单元格颜色与核心层同源：值域比例 → 色标插值
      let min = Infinity
      let max = -Infinity
      for (const d of props.data) {
        min = Math.min(min, d[2])
        max = Math.max(max, d[2])
      }
      const stops = props.colorStops && props.colorStops.length >= 2 ? props.colorStops : ['#EAF1FF', '#8FB3FF', '#2B6FFF']
      const domainMin = props.min ?? min
      const domainMax = props.max ?? max
      const color = sampleHeatColor(stops, (value - domainMin) / Math.max(1e-6, domainMax - domainMin))
      tipLabel.value = `${props.rows[r]} · ${props.columns[c]}`
      tipRows.value = [{ name: '数值', color, value: String(value) }]

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

    return () => (
      <div class={bem()} style={props.height != null ? { height: `${props.height}px` } : { height: '100%' }}>
        {props.title && (
          <div class={bem.e('header')}>
            <span class={bem.e('title')}>{props.title}</span>
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
      </div>
    )
  },
})
