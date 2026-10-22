import { defineComponent, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { PropType } from 'vue'
import { ProgressRingChart } from '@/core/chart/progress-ring-chart'
import type { ProgressRingChartOption } from '@/core/chart/progress-ring-chart'
import { createBem } from '@/utils/create-bem'
import { useResizeObserver } from '@/composables/use-resize-observer'
import { useTheme } from '@/composables/use-theme'
import type { HoverInfo, Padding, KColor, KProgressDatum } from '@/core/types'
import { colorToCss } from '@/core/utils/gradient'

const bem = createBem('k-chart')

interface TooltipRow {
  name: string
  color: string
  value: string
}

/**
 * KProgressRingChart 进度环组件
 *
 * 职责仅三件事：响应式 props 桥接核心图表实例、title DOM 结构、tooltip。
 * 环带绘制、百分比扫弧、命中检测等图表逻辑全部在 core 层，组件层保持薄。
 * 悬停索引恒为 0（单环单值）。
 */
export default defineComponent({
  name: 'KProgressRingChart',
  props: {
    /** 进度数据（单值） */
    data: { type: Object as PropType<KProgressDatum>, required: true },
    /** 进度弧颜色（纯色或渐变），缺省主题主色 */
    color: { type: [String, Object] as PropType<KColor>, default: undefined },
    /** 进度弧径向渐变（沿环带半径方向内缘色 → 外缘色）：设置后优先于 color */
    bandGradient: { type: Object as PropType<{ from: string; to: string }>, default: undefined },
    /** 环带端点样式：'round' 两端圆头，缺省平头 */
    lineCap: { type: String as PropType<'butt' | 'round'>, default: undefined },
    /** 扫描方向：true 顺时针（缺省），false 逆时针 */
    clockwise: { type: Boolean, default: true },
    /** 环带宽度 px */
    trackWidth: { type: Number, default: undefined },
    /** 半径比例 0~1 */
    radiusRatio: { type: Number, default: undefined },
    /** 是否显示底环 */
    showTrack: { type: Boolean, default: true },
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
    const chartRef = ref<ProgressRingChart | null>(null)
    const { chartTheme } = useTheme()

    const buildOption = (): ProgressRingChartOption => ({
      data: props.data,
      color: props.color,
      bandGradient: props.bandGradient,
      lineCap: props.lineCap,
      clockwise: props.clockwise,
      trackWidth: props.trackWidth,
      radiusRatio: props.radiusRatio,
      showTrack: props.showTrack,
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
      const chart = new ProgressRingChart(wrapRef.value, buildOption())
      chart.setEvents({ onHover: handleHover })
      chartRef.value = chart
      updateChart()
    })

    useResizeObserver(wrapRef, (width, height) => {
      chartRef.value?.resize(width, height)
    })

    watch(
      () => [props.data, props.color, props.bandGradient, props.lineCap, props.clockwise, props.trackWidth, props.radiusRatio, props.showTrack, chartTheme],
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
      const max = d.max ?? 100
      const pct = Math.min(100, Math.max(0, (d.value / max) * 100))
      const color = colorToCss(props.color ?? props.data.color ?? chartTheme.value.colors?.[0] ?? '#7C5CFC')
      const rows: TooltipRow[] = [
        { name: '当前值', color, value: `${d.value}${d.unit ?? ''}` },
        { name: '进度', color, value: `${Math.round(pct * 10) / 10}%` },
        { name: '量程', color, value: `0 ~ ${max}` },
      ]
      tipLabel.value = d.name ?? '进度'
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
