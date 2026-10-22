import { defineComponent, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { PropType } from 'vue'
import { TreeChart } from '@/core/chart/tree-chart'
import type { TreeChartOption, TreeOrient } from '@/core/chart/tree-chart'
import { buildSunburstTree, flattenSunburstTree } from '@/core/chart/sunburst-chart'
import { defaultTheme } from '@/core/theme'
import { createBem } from '@/utils/create-bem'
import { useResizeObserver } from '@/composables/use-resize-observer'
import { useTheme } from '@/composables/use-theme'
import type { HoverInfo, Padding, KTreeDatum } from '@/core/types'

const bem = createBem('k-chart')

interface TooltipRow {
  name: string
  color: string
  value: string
}

/**
 * KTreeChart 树图组件
 *
 * 职责仅三件事：响应式 props 桥接核心图表实例、title DOM 结构、tooltip。
 * 三种布局、连线、标签定位、悬停命中等图表逻辑全部在 core 层，组件层保持薄。
 * 悬停索引 = 树先序遍历序号（核心层 buildSunburstTree 保证同源）。
 */
export default defineComponent({
  name: 'KTreeChart',
  props: {
    /** 树数据（顶层多项时作为多棵并排的森林） */
    data: { type: Array as PropType<KTreeDatum[]>, required: true },
    /** 布局方向：横向 / 纵向 / 径向 */
    orient: { type: String as PropType<TreeOrient>, default: 'horizontal' },
    /** 层间距 px（径向布局忽略）；缺省自动填满绘图区 */
    levelGap: { type: Number, default: undefined },
    /** 叶节点间距上限 px，空间不足自动压缩 */
    nodeGap: { type: Number, default: 20 },
    /** 节点半径 px */
    nodeRadius: { type: Number, default: 6 },
    /** 是否显示节点标签 */
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
    const chartRef = ref<TreeChart | null>(null)
    const { chartTheme } = useTheme()

    const buildOption = (): TreeChartOption => ({
      data: props.data,
      orient: props.orient,
      levelGap: props.levelGap,
      nodeGap: props.nodeGap,
      nodeRadius: props.nodeRadius,
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
      const chart = new TreeChart(wrapRef.value, buildOption())
      chart.setEvents({ onHover: handleHover })
      chartRef.value = chart
      updateChart()
    })

    useResizeObserver(wrapRef, (width, height) => {
      chartRef.value?.resize(width, height)
    })

    watch(
      () => [props.data, props.orient, props.levelGap, props.nodeGap, props.nodeRadius, props.label, chartTheme],
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
      // 与核心层同源解码：先序序号 → 树节点
      const nodes = flattenSunburstTree(buildSunburstTree(props.data, defaultTheme.colors))
      const node = nodes[info.index]
      if (!node) {
        tipVisible.value = false
        return
      }
      const rows: TooltipRow[] = [{ name: '数值', color: node.color, value: String(node.value) }]
      if (node.parent) {
        rows.push({
          name: `占「${node.parent.name}」`,
          color: node.color,
          value: `${Number(((node.value / node.parent.value) * 100).toFixed(1))}%`,
        })
      }
      if (node.children.length > 0) {
        rows.push({ name: '子级数', color: node.color, value: String(node.children.length) })
      }
      tipLabel.value = node.name
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
