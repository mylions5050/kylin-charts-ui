import { defineComponent, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { PropType } from 'vue'
import { SankeyChart, sankeyNodeFlows, sankeyValidLinks } from '@/core/chart/sankey-chart'
import type { SankeyChartOption } from '@/core/chart/sankey-chart'
import { defaultTheme, getSeriesColor } from '@/core/theme'
import { createBem } from '@/utils/create-bem'
import { useResizeObserver } from '@/composables/use-resize-observer'
import { useTheme } from '@/composables/use-theme'
import type { HoverInfo, Padding, KSankeyLink, KSankeyNode } from '@/core/types'

const bem = createBem('k-chart')

interface TooltipRow {
  name: string
  color: string
  value: string
}

/**
 * KSankeyChart 桑基图组件
 *
 * 职责仅三件事：响应式 props 桥接核心图表实例、title DOM 结构、tooltip。
 * 分层布局、链路色带、悬停高亮等图表逻辑全部在 core 层，组件层保持薄。
 * 悬停索引编码：[0, n) 为节点，[n, n + m) 为链路（与核心层 layout 一致）。
 */
export default defineComponent({
  name: 'KSankeyChart',
  props: {
    /** 节点列表（name 需唯一） */
    nodes: { type: Array as PropType<KSankeyNode[]>, required: true },
    /** 链路列表（source / target 按节点 name 关联） */
    links: { type: Array as PropType<KSankeyLink[]>, required: true },
    /** 图表高度 px（宽度随容器自适应） */
    height: { type: Number, default: 400 },
    /** 节点矩形宽度 px */
    nodeWidth: { type: Number, default: 16 },
    /** 布局方向：horizontal 横向（默认）/ vertical 纵向（层从上到下展开，适合高瘦容器） */
    orient: { type: String as PropType<'horizontal' | 'vertical'>, default: 'horizontal' },
    /** 是否允许拖拽节点（拖拽后链路实时跟随，位置持久保留） */
    draggable: { type: Boolean, default: false },
    /** 同层节点最小间距 px */
    nodeGap: { type: Number, default: 12 },
    /** 链路弯曲度 0 ~ 1 */
    curvature: { type: Number, default: 0.5 },
    /** 是否显示节点名称标签 */
    label: { type: Boolean, default: true },
    /** 图表标题（图上方左对齐） */
    title: { type: String, default: '' },
    /** 空数据提示文案 */
    emptyText: { type: String, default: '暂无数据' },
    /** 画布内边距覆盖（对齐 ECharts grid 职责）：对象形态 Partial<Padding>，缺省用图表默认内边距 */
    padding: { type: Object as PropType<Partial<Padding>>, default: undefined },
  },
  setup(props) {
    const wrapRef = ref<HTMLDivElement | null>(null)
    const chartRef = ref<SankeyChart | null>(null)
    const { chartTheme } = useTheme()

    /** 与核心层同规则预过滤端点缺失的链路，保证悬停索引解码一致 */
    const validLinks = (): KSankeyLink[] => sankeyValidLinks(props.nodes, props.links)

    const buildOption = (): SankeyChartOption => ({
      nodes: props.nodes.map((nd, i) => ({
        ...nd,
        color: nd.color ?? getSeriesColor(defaultTheme.colors, i),
      })),
      links: validLinks(),
      nodeWidth: props.nodeWidth,
      orient: props.orient,
      draggable: props.draggable,
      nodeGap: props.nodeGap,
      curvature: props.curvature,
      label: { show: props.label },
      emptyText: props.emptyText,
      padding: props.padding,
      theme: chartTheme.value,
    })

    /** 节点颜色（与 buildOption 同源：显式色优先，否则按索引取色板） */
    const nodeColor = (name: string): string => {
      const i = props.nodes.findIndex((nd) => nd.name === name)
      const nd = props.nodes[i]
      return nd?.color ?? getSeriesColor(defaultTheme.colors, i)
    }

    const updateChart = (): void => {
      if (!chartRef.value || !wrapRef.value) return
      chartRef.value.setOption(buildOption())
      chartRef.value.resize(wrapRef.value.clientWidth, wrapRef.value.clientHeight)
    }

    onMounted(() => {
      if (!wrapRef.value) return
      const chart = new SankeyChart(wrapRef.value, buildOption())
      chart.setEvents({ onHover: handleHover })
      chartRef.value = chart
      updateChart()
    })

    useResizeObserver(wrapRef, (width, height) => {
      chartRef.value?.resize(width, height)
    })

    watch(
      () => [props.nodes, props.links, props.height, props.nodeWidth, props.orient, props.draggable, props.nodeGap, props.curvature, props.label, chartTheme],
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
      const n = props.nodes.length
      const flows = sankeyNodeFlows(props.nodes, props.links)
      if (info.index < n) {
        // 节点悬停：展示节点总流量
        const nd = props.nodes[info.index]
        tipLabel.value = nd?.name ?? ''
        tipRows.value = [
          {
            name: '总流量',
            color: nodeColor(nd?.name ?? ''),
            value: String(flows[nd?.name ?? ''] ?? 0),
          },
        ]
      } else {
        // 链路悬停：展示 source → target 及两端流量
        const link = validLinks()[info.index - n]
        if (!link) {
          tipVisible.value = false
          return
        }
        tipLabel.value = `${link.source} → ${link.target}`
        tipRows.value = [
          { name: link.source, color: nodeColor(link.source), value: String(link.value) },
          { name: link.target, color: nodeColor(link.target), value: String(link.value) },
        ]
      }

      // tooltip 定位：指针左下角（先左后下），越界时向右/向上翻转防出界
      const wrapW = wrapRef.value?.clientWidth ?? 0
      const wrapH = wrapRef.value?.clientHeight ?? 0
      const tipW = 190
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
      <div class={bem()} style={{ height: `${props.height}px` }}>
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
