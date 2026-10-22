import { defineComponent, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { PropType } from 'vue'
import { GraphChart, prepareGraph } from '@/core/chart/graph-chart'
import type { GraphChartOption, GraphForceOption, KGraphLayout } from '@/core/chart/graph-chart'
import { defaultTheme } from '@/core/theme'
import { createBem } from '@/utils/create-bem'
import { useResizeObserver } from '@/composables/use-resize-observer'
import { useTheme } from '@/composables/use-theme'
import type { HoverInfo, Padding, KGraphCategory, KGraphLink, KGraphNode } from '@/core/types'

const bem = createBem('k-chart')

interface TooltipRow {
  name: string
  color: string
  value: string
}

/**
 * KGraphChart 关系图组件
 *
 * 职责仅三件事：响应式 props 桥接核心图表实例、title DOM 结构、tooltip。
 * 三种布局、力导向模拟、邻接高亮、悬停命中等图表逻辑全部在 core 层，组件层保持薄。
 * 悬停索引 = 节点下标（核心层 prepareGraph 保证同源解码）。
 */
export default defineComponent({
  name: 'KGraphChart',
  props: {
    /** 节点列表 */
    nodes: { type: Array as PropType<KGraphNode[]>, required: true },
    /** 链路列表（source / target 支持节点 name 或下标） */
    links: { type: Array as PropType<KGraphLink[]>, required: true },
    /** 类目列表（节点配色分组） */
    categories: { type: Array as PropType<KGraphCategory[]>, default: undefined },
    /** 布局方式：力导向 / 环形 / 固定坐标 */
    layout: { type: String as PropType<KGraphLayout>, default: 'force' },
    /** 力导向参数（仅 force 布局生效） */
    force: { type: Object as PropType<GraphForceOption>, default: undefined },
    /** 节点最小半径 px */
    nodeMin: { type: Number, default: undefined },
    /** 节点最大半径 px */
    nodeMax: { type: Number, default: undefined },
    /** 是否显示节点名称标签 */
    label: { type: Boolean, default: true },
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
    const chartRef = ref<GraphChart | null>(null)
    const { chartTheme } = useTheme()

    const buildOption = (): GraphChartOption => ({
      nodes: props.nodes,
      links: props.links,
      categories: props.categories,
      layout: props.layout,
      force: props.force,
      nodeSize: { min: props.nodeMin, max: props.nodeMax },
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
      const chart = new GraphChart(wrapRef.value, buildOption())
      chart.setEvents({ onHover: handleHover })
      chartRef.value = chart
      updateChart()
    })

    useResizeObserver(wrapRef, (width, height) => {
      chartRef.value?.resize(width, height)
    })

    watch(
      () => [props.nodes, props.links, props.categories, props.layout, props.force, props.nodeMin, props.nodeMax, props.label, chartTheme],
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
      if (!info || !chartRef.value || !wrapRef.value) {
        tipVisible.value = false
        return
      }
      // 与核心层同源解码：节点下标 → 预处理节点
      const theme = defaultTheme
      const { nodes } = prepareGraph(props.nodes, props.links, props.categories, theme.colors)
      const node = nodes[info.index]
      if (!node) {
        tipVisible.value = false
        return
      }
      const rows: TooltipRow[] = []
      if (node.categoryName) {
        rows.push({ name: '类目', color: node.color, value: node.categoryName })
      }
      if (node.hasValue) {
        rows.push({ name: '数值', color: node.color, value: String(node.value) })
      }
      rows.push({ name: '关系数', color: node.color, value: String(node.degree) })
      tipLabel.value = node.name
      tipRows.value = rows

      // tooltip 定位：指针左下角（先左后下），越界时向右/向上翻转防出界
      const wrapW = wrapRef.value.clientWidth
      const wrapH = wrapRef.value.clientHeight
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
