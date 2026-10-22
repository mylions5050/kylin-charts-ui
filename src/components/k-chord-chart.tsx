import { defineComponent, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { PropType } from 'vue'
import { ChordChart } from '@/core/chart/chord-chart'
import type { ChordChartOption } from '@/core/chart/chord-chart'
import { defaultTheme, getSeriesColor } from '@/core/theme'
import { createBem } from '@/utils/create-bem'
import { useResizeObserver } from '@/composables/use-resize-observer'
import { useTheme } from '@/composables/use-theme'
import type { HoverInfo, Padding, KChordLink, KChordNode } from '@/core/types'

const bem = createBem('k-chart')

interface TooltipRow {
  name: string
  color: string
  value: string
}

/**
 * KChordChart 和弦图组件
 *
 * 职责仅三件事：响应式 props 桥接核心图表实例、title DOM 结构、tooltip。
 * 弧段分配、缎带弦绘制、悬停高亮等图表逻辑全部在 core 层，组件层保持薄。
 * 悬停索引编码与核心层同源：节点在前 [0, n)、链路在后 [n, n + m)。
 */
export default defineComponent({
  name: 'KChordChart',
  props: {
    /** 节点列表（圆上弧段） */
    nodes: { type: Array as PropType<KChordNode[]>, required: true },
    /** 链路列表（source / target 为节点 name） */
    links: { type: Array as PropType<KChordLink[]>, required: true },
    /** 节点弧之间的间隙角（度） */
    padAngle: { type: Number, default: 3 },
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
    const chartRef = ref<ChordChart | null>(null)
    const { chartTheme } = useTheme()

    const buildOption = (): ChordChartOption => ({
      nodes: props.nodes,
      links: props.links,
      padAngle: props.padAngle,
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
      const chart = new ChordChart(wrapRef.value, buildOption())
      chart.setEvents({ onHover: handleHover })
      chartRef.value = chart
      updateChart()
    })

    useResizeObserver(wrapRef, (width, height) => {
      chartRef.value?.resize(width, height)
    })

    watch(
      () => [props.nodes, props.links, props.padAngle, props.label, chartTheme],
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

    /** 节点流量总额（入 + 出），缺失返回 0 */
    const nodeTotal = (name: string): number =>
      props.links
        .filter((l) => l.source === name || l.target === name)
        .reduce((sum, l) => sum + (l.value || 0), 0)

    /** 节点色：显式 color 优先，否则按 nodes 序号取主题色板（与核心层同源） */
    const nodeColor = (name: string): string => {
      const idx = props.nodes.findIndex((n) => n.name === name)
      return props.nodes[idx]?.color ?? getSeriesColor(defaultTheme.colors, idx)
    }

    const handleHover = (info: HoverInfo | null): void => {
      if (!info || !chartRef.value) {
        tipVisible.value = false
        return
      }
      if (info.index < props.nodes.length) {
        // 节点：总流量 + 连接数
        const node = props.nodes[info.index]
        if (!node) {
          tipVisible.value = false
          return
        }
        const total = nodeTotal(node.name)
        const count = props.links.filter((l) => l.source === node.name || l.target === node.name).length
        tipLabel.value = node.name
        tipRows.value = [
          { name: '总流量', color: nodeColor(node.name), value: String(total) },
          { name: '连接数', color: nodeColor(node.name), value: `${count} 条` },
        ]
      } else {
        // 链路：数值 + 占源端总量比例
        const link = props.links[info.index - props.nodes.length]
        if (!link) {
          tipVisible.value = false
          return
        }
        const srcTotal = nodeTotal(link.source)
        const pct = srcTotal > 0 ? Number(((link.value / srcTotal) * 100).toFixed(1)) : 0
        tipLabel.value = `${link.source} → ${link.target}`
        tipRows.value = [
          { name: '流量', color: nodeColor(link.source), value: String(link.value) },
          { name: `占「${link.source}」`, color: nodeColor(link.source), value: `${pct}%` },
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
