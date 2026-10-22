import { defineComponent, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { PropType } from 'vue'
import { GaugeChart } from '@/core/chart/gauge-chart'
import type { GaugeChartOption } from '@/core/chart/gauge-chart'
import { createBem } from '@/utils/create-bem'
import { useResizeObserver } from '@/composables/use-resize-observer'
import { useTheme } from '@/composables/use-theme'
import type { HoverInfo, Padding, KGaugeDatum, KGaugeStop } from '@/core/types'

const bem = createBem('k-chart')

interface TooltipRow {
  name: string
  color: string
  value: string
}

/**
 * KGaugeChart 仪表盘组件
 *
 * 职责仅三件事：响应式 props 桥接核心图表实例、title DOM 结构、tooltip。
 * 弧线绘制、指针、刻度、命中检测等图表逻辑全部在 core 层，组件层保持薄。
 * 悬停索引恒为 0（单仪表单值）。
 */
export default defineComponent({
  name: 'KGaugeChart',
  props: {
    /** 仪表数据（单值） */
    data: { type: Object as PropType<KGaugeDatum>, required: true },
    /** 阈值色标（value 0~1 + color，缺省用主题主色渐变） */
    stops: { type: Array as PropType<KGaugeStop[]>, default: undefined },
    /** 起始角（数学角，度） */
    startAngle: { type: Number, default: undefined },
    /** 结束角（数学角，度） */
    endAngle: { type: Number, default: undefined },
    /** 半径占绘图区比例 0~1 */
    radiusRatio: { type: Number, default: undefined },
    /** 轴带宽度 px */
    axisWidth: { type: Number, default: undefined },
    /** 刻度数量 */
    tickCount: { type: Number, default: undefined },
    /** 图表高度 px；不传时填满父容器（需父容器有确定高度） */
    height: { type: Number, default: undefined },
    /** 图表标题（图上方左对齐） */
    title: { type: String, default: '' },
    /** 空数据提示文案 */
    emptyText: { type: String, default: '暂无数据' },
    /** 完整配置透传（显式字段优先于同名散 props） */
    option: { type: Object as PropType<Partial<GaugeChartOption>>, default: undefined },
    /** 画布内边距覆盖（对齐 ECharts grid 职责）：对象形态 Partial<Padding>，缺省用图表默认内边距 */
    padding: { type: Object as PropType<Partial<Padding>>, default: undefined },
  },
  setup(props) {
    const wrapRef = ref<HTMLDivElement | null>(null)
    const chartRef = ref<GaugeChart | null>(null)
    const { chartTheme } = useTheme()

    const buildOption = (): GaugeChartOption => {
      const base: GaugeChartOption = {
        data: props.data,
        stops: props.stops,
        startAngle: props.startAngle,
        endAngle: props.endAngle,
        radiusRatio: props.radiusRatio,
        axisWidth: props.axisWidth,
        tickCount: props.tickCount,
        emptyText: props.emptyText,
        padding: props.padding,
        theme: chartTheme.value,
      }
      // option 透传：显式字段（非 undefined）覆盖同名散 props
      if (props.option) {
        for (const [k, v] of Object.entries(props.option)) {
          if (v !== undefined) (base as unknown as Record<string, unknown>)[k] = v
        }
      }
      return base
    }

    const updateChart = (): void => {
      if (!chartRef.value || !wrapRef.value) return
      chartRef.value.setOption(buildOption())
      chartRef.value.resize(wrapRef.value.clientWidth, wrapRef.value.clientHeight)
    }

    onMounted(() => {
      if (!wrapRef.value) return
      const chart = new GaugeChart(wrapRef.value, buildOption())
      chart.setEvents({ onHover: handleHover })
      chartRef.value = chart
      updateChart()
    })

    useResizeObserver(wrapRef, (width, height) => {
      chartRef.value?.resize(width, height)
    })

    watch(
      () => [props.data, props.stops, props.startAngle, props.endAngle, props.radiusRatio, props.axisWidth, props.tickCount, props.option, chartTheme],
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
      if (!info) {
        tipVisible.value = false
        return
      }
      const d = props.data
      const min = d.min ?? 0
      const max = d.max ?? 100
      const span = Math.max(max - min, 1e-9)
      const pct = ((d.value - min) / span) * 100
      const color = chartTheme.value.colors?.[0] ?? '#7C5CFC'
      const rows: TooltipRow[] = [
        { name: '当前值', color, value: `${d.value}${d.unit ?? ''}` },
        { name: '占量程', color, value: `${Number(pct.toFixed(1))}%` },
        { name: '量程', color, value: `${min} ~ ${max}` },
      ]
      tipLabel.value = d.name ?? '仪表盘'
      tipRows.value = rows

      // tooltip 定位：指针左下角（先左后下），越界时向右/向上翻转防出界
      const wrapW = wrapRef.value?.clientWidth ?? 0
      const wrapH = wrapRef.value?.clientHeight ?? 0
      const tipW = 176
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
