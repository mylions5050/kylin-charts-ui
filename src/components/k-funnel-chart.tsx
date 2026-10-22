import { defineComponent, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { PropType } from 'vue'
import { FunnelChart, sortFunnelIndexes } from '@/core/chart/funnel-chart'
import type { FunnelChartOption } from '@/core/chart/funnel-chart'
import { defaultTheme, getSeriesColor } from '@/core/theme'
import { createBem } from '@/utils/create-bem'
import { useResizeObserver } from '@/composables/use-resize-observer'
import { useTheme } from '@/composables/use-theme'
import type { HoverInfo, Padding, KFunnelDatum } from '@/core/types'

const bem = createBem('k-chart')

interface TooltipRow {
  name: string
  color: string
  value: string
}

/**
 * KFunnelChart 漏斗图组件
 *
 * 职责仅三件事：响应式 props 桥接核心图表实例、title/legend DOM 结构、tooltip。
 * 图表逻辑全部在 core 层，组件层保持薄。
 */
export default defineComponent({
  name: 'KFunnelChart',
  props: {
    /** 数据项列表（展示顺序由 sort 决定） */
    data: { type: Array as PropType<KFunnelDatum[]>, required: true },
    /** 图表高度 px（宽度随容器自适应） */
    height: { type: Number, default: 400 },
    /** 排序：desc / asc / none */
    sort: { type: String as PropType<'desc' | 'asc' | 'none'>, default: 'desc' },
    /** 水平对齐：center / left / right */
    align: { type: String as PropType<'center' | 'left' | 'right'>, default: 'center' },
    /** 形态：funnel 梯形漏斗（默认）/ triangle 倒三角 / pyramid 正金字塔 / square 方形 / circle 圆泡漏斗 */
    shape: { type: String as PropType<'funnel' | 'triangle' | 'pyramid' | 'square' | 'circle'>, default: 'funnel' },
    /** 层间距 px */
    gap: { type: Number, default: 6 },
    /** 是否显示标签（层内名称 + 层外数值引导线） */
    label: { type: Boolean, default: true },
    /** 图表标题（图上方左对齐） */
    title: { type: String, default: '' },
    /** 是否显示图例（点击可切换层级显隐） */
    /** 是否显示图例（点击可切换数据项显隐）：true 头部图例；对象可指定 position（top 缺省头部 / bottom 图表下方） */
    legend: { type: [Boolean, Object] as PropType<boolean | { position?: 'top' | 'bottom' }>, default: false },
    /** 空数据提示文案 */
    emptyText: { type: String, default: '暂无数据' },
    /** 画布内边距覆盖（对齐 ECharts grid 职责）：对象形态 Partial<Padding>，缺省用图表默认内边距 */
    padding: { type: Object as PropType<Partial<Padding>>, default: undefined },
  },
  setup(props) {
    const wrapRef = ref<HTMLDivElement | null>(null)
    const chartRef = ref<FunnelChart | null>(null)
    const { chartTheme } = useTheme()

    // ---- 图例切换状态（隐藏的层级名） ----
    const hiddenNames = ref<string[]>([])

    /** 系列色在完整数据列表中按索引固定分配，再过滤隐藏项（保证与图例同源） */
    const buildOption = (): FunnelChartOption => ({
      data: props.data
        .map((d, i) => ({
          ...d,
          color: d.color ?? getSeriesColor(defaultTheme.colors, i),
        }))
        .filter((d) => !hiddenNames.value.includes(d.name)),
      sort: props.sort,
      align: props.align,
      shape: props.shape,
      gap: props.gap,
      label: { show: props.label },
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
      const chart = new FunnelChart(wrapRef.value, buildOption())
      chart.setEvents({ onHover: handleHover })
      chartRef.value = chart
      updateChart()
    })

    useResizeObserver(wrapRef, (width, height) => {
      chartRef.value?.resize(width, height)
    })

    watch(
      () => [props.data, props.height, props.sort, props.align, props.shape, props.gap, props.label, chartTheme],
      () => {
        // props 变化时同步清理已不存在的隐藏项
        hiddenNames.value = hiddenNames.value.filter((name) => props.data.some((d) => d.name === name))
        updateChart()
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
      // 行序与图内展示顺序一致（复用核心层排序），悬停索引即展示顺序索引
      const ordered = sortFunnelIndexes(option.data ?? [], props.sort).map((i) => (option.data ?? [])[i])
      const total = ordered.reduce((sum, d) => sum + d.value, 0)
      // 只展示悬停层级的单条数据（与饼图 item 触发一致），占比按全部可见数据合计计算
      const hovered = ordered[info.index]
      tipLabel.value = hovered?.name ?? ''
      if (hovered) {
        const pct = total > 0 ? (hovered.value / total) * 100 : 0
        tipRows.value = [
          {
            name: hovered.name,
            color: hovered.color ?? defaultTheme.colors[0],
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
      // legend 位置（对齐 ECharts legend.top/bottom）：top 在头部（缺省）/ bottom 在图表下方
      const legendPos = props.legend && typeof props.legend === 'object' ? props.legend.position ?? 'top' : 'top'
      const legendNode = props.legend ? (
        <div class={legendPos === 'bottom' ? [bem.e('legend'), bem.em('legend', 'bottom')] : bem.e('legend')}>
          {props.data.map((d, i) => {
            const hidden = hiddenNames.value.includes(d.name)
            const color = d.color ?? getSeriesColor(defaultTheme.colors, i)
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
          {legendPos === 'bottom' && legendNode}
        </div>
      )
    }
  },
})
