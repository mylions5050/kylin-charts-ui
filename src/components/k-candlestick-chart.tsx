import { computed, defineComponent, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { PropType } from 'vue'
import { CandlestickChart, computeMA, resolveMaColor } from '@/core/chart/candlestick-chart'
import type { CandlestickChartOption } from '@/core/chart/candlestick-chart'
import { defaultTheme } from '@/core/theme'
import { createBem } from '@/utils/create-bem'
import { useResizeObserver } from '@/composables/use-resize-observer'
import { useTheme } from '@/composables/use-theme'
import type { HoverInfo, Padding, KCandleDatum } from '@/core/types'

const bem = createBem('k-chart')

interface TooltipRow {
  name: string
  color: string
  value: string
}

/**
 * KCandlestickChart K 线（蜡烛）图组件
 *
 * 职责仅三件事：响应式 props 桥接核心图表实例、title/legend DOM 结构、tooltip。
 * 蜡烛绘制、阴阳配色、均线叠加、悬停高亮带等图表逻辑全部在 core 层，组件层保持薄。
 * 悬停索引 = 类目序号（与核心层 hitTest 同源）。
 */
export default defineComponent({
  name: 'KCandlestickChart',
  props: {
    /** x 轴类目标签（交易日等，与 data 一一对应） */
    labels: { type: Array as PropType<string[]>, required: true },
    /** K 线数据：[开盘价, 收盘价, 最低价, 最高价] */
    data: { type: Array as PropType<KCandleDatum[]>, required: true },
    /** 图表高度 px；不传时填满父容器（需父容器有确定高度） */
    height: { type: Number, default: undefined },
    /** 阳线颜色（收盘 ≥ 开盘），默认红涨 */
    bullColor: { type: String, default: '#F5455C' },
    /** 阴线颜色（收盘 < 开盘），默认绿跌 */
    bearColor: { type: String, default: '#00B578' },
    /** 叠加均线周期列表，如 [5, 10, 20]；传空数组不绘制 */
    ma: { type: Array as PropType<number[]>, default: () => [5, 10] },
    /** 是否显示均线图例（点击切换显隐） */
    /** 是否显示图例（MA 均线点击可切换显隐）：true 头部图例；对象可指定 position（top 缺省头部 / bottom 图表下方） */
    legend: { type: [Boolean, Object] as PropType<boolean | { position?: 'top' | 'bottom' }>, default: false },
    /** 图表标题（图上方左对齐） */
    title: { type: String, default: '' },
    /** 空数据提示文案 */
    emptyText: { type: String, default: '暂无数据' },
    /** 画布内边距覆盖（对齐 ECharts grid 职责）：对象形态 Partial<Padding>，缺省用图表默认内边距 */
    padding: { type: Object as PropType<Partial<Padding>>, default: undefined },
  },
  setup(props) {
    const wrapRef = ref<HTMLDivElement | null>(null)
    const chartRef = ref<CandlestickChart | null>(null)
    const { chartTheme } = useTheme()

    // ---- 均线图例显隐（点击切换；被隐藏的均线不传给核心层） ----
    const hiddenMas = ref<string[]>([])
    const visibleMa = computed(() => props.ma.filter((w) => !hiddenMas.value.includes(`MA${w}`)))

    const buildOption = (): CandlestickChartOption => ({
      labels: props.labels,
      data: props.data,
      bullColor: props.bullColor,
      bearColor: props.bearColor,
      ma: visibleMa.value,
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
      const chart = new CandlestickChart(wrapRef.value, buildOption())
      chart.setEvents({ onHover: handleHover })
      chartRef.value = chart
      updateChart()
    })

    useResizeObserver(wrapRef, (width, height) => {
      chartRef.value?.resize(width, height)
    })

    watch(
      () => [props.labels, props.data, props.bullColor, props.bearColor, visibleMa.value, chartTheme],
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
      const datum = props.data[info.index]
      if (!datum) {
        tipVisible.value = false
        return
      }
      const [open, close, low, high] = datum
      const isBull = close >= open
      const candleColor = isBull ? props.bullColor : props.bearColor
      const rows: TooltipRow[] = [
        { name: '开盘', color: candleColor, value: String(open) },
        { name: '收盘', color: candleColor, value: String(close) },
        { name: '最低', color: candleColor, value: String(low) },
        { name: '最高', color: candleColor, value: String(high) },
      ]
      // 涨跌额 + 涨跌幅（开盘为 0 时不计算百分比）
      const diff = Number((close - open).toFixed(2))
      const sign = diff > 0 ? '+' : ''
      const pct = open !== 0 ? ` (${sign}${Number(((diff / open) * 100).toFixed(2))}%)` : ''
      rows.push({ name: '涨跌', color: candleColor, value: `${sign}${diff}${pct}` })
      // 均线值（样本不足显示 —）
      for (const w of props.ma) {
        const v = computeMA(props.data, w)[info.index]
        rows.push({
          name: `MA${w}`,
          color: resolveMaColor(w, props.ma.indexOf(w), defaultTheme.colors),
          value: v === null ? '—' : String(v),
        })
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

    const toggleMa = (name: string): void => {
      hiddenMas.value = hiddenMas.value.includes(name)
        ? hiddenMas.value.filter((n) => n !== name)
        : [...hiddenMas.value, name]
    }

    return () => {
      // legend 位置（对齐 ECharts legend.top/bottom）：top 在头部（缺省）/ bottom 在图表下方
      const legendPos = props.legend && typeof props.legend === 'object' ? props.legend.position ?? 'top' : 'top'
      const legendItems = props.legend ? props.ma : []
      const legendNode = legendItems.length > 0 ? (
        <div class={legendPos === 'bottom' ? [bem.e('legend'), bem.em('legend', 'bottom')] : bem.e('legend')}>
          {legendItems.map((w) => {
            const name = `MA${w}`
            const hidden = hiddenMas.value.includes(name)
            const color = resolveMaColor(w, props.ma.indexOf(w), defaultTheme.colors)
            return (
              <span
                key={name}
                class={[bem.e('legend-item'), hidden ? bem.em('legend-item', 'hidden') : '']}
                onClick={() => toggleMa(name)}
              >
                <span
                  class={bem.e('legend-dot')}
                  style={{ background: hidden ? defaultTheme.emptyColor : color }}
                />
                <span>{name}</span>
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
