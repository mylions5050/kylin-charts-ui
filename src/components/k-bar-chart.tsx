import { defineComponent, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { PropType } from 'vue'
import { BarChart } from '@/core/chart/bar-chart'
import type { BarChartOption } from '@/core/chart/bar-chart'
import { defaultTheme, getSeriesColor } from '@/core/theme'
import { normalizeData } from '@/core/utils/series-data'
import { createBem } from '@/utils/create-bem'
import { colorToCss } from '@/core/utils/gradient'
import { useResizeObserver } from '@/composables/use-resize-observer'
import { useTheme } from '@/composables/use-theme'
import type { HoverInfo, Padding, KBarSeries, KColor, KDataZoomOption } from '@/core/types'
import type { KAxisOption } from '@/core/chart/line-chart'

const bem = createBem('k-chart')

interface TooltipRow {
  name: string
  color: string
  value: string
}

/**
 * KBarChart 柱形图组件
 *
 * 职责仅三件事：响应式 props 桥接核心图表实例、title/legend DOM 结构、tooltip。
 * 图表逻辑全部在 core 层，组件层保持薄。
 */
export default defineComponent({
  name: 'KBarChart',
  props: {
    /** x 轴类目标签 */
    labels: { type: Array as PropType<string[]>, required: true },
    /** 数据系列 */
    series: { type: Array as PropType<KBarSeries[]>, required: true },
    /** 图表高度 px（宽度随容器自适应） */
    height: { type: Number, default: 320 },
    /** 是否横向条形图（类目轴在 y、数值轴在 x） */
    horizontal: { type: Boolean, default: false },
    /** x 轴配置（show / name） */
    xAxis: { type: Object as PropType<KAxisOption>, default: undefined },
    /** y 轴配置（show / name） */
    yAxis: { type: Object as PropType<KAxisOption>, default: undefined },
    /** 次数值轴（右侧，折柱混合线系列用） */
    yAxis2: { type: Object as PropType<KAxisOption>, default: undefined },
    /** 柱形浅灰背景带（每个类目一根全高背景柱） */
    showBackground: { type: Boolean, default: false },
    /** 背景带颜色（纯色或渐变配置对象） */
    backgroundColor: { type: [String, Object] as PropType<KColor>, default: undefined },
    /** hover 高亮带：默认开启（缺省主题色淡带），传颜色自定义，false 关闭 */
    hoverHighlight: { type: [Boolean, Object, String] as PropType<boolean | KColor>, default: true },
    /** 堆叠模式：'value' 原始值 / 'percent' 归一化百分比堆叠 */
    stackMode: { type: String as PropType<'value' | 'percent'>, default: undefined },
    /** x 轴类目标签交错两行显示 */
    staggerLabels: { type: Boolean, default: false },
    /** 瀑布图模式（取第一个系列按累计浮动柱绘制） */
    waterfall: { type: Boolean, default: false },
    /** 柱宽（px，对齐 ECharts barWidth）：不传按槽位自适应 */
    barWidth: { type: Number, default: undefined },
    /** 同类目内系列柱间空隙占柱宽比例（对齐 ECharts barGap），缺省 0.25 */
    barGap: { type: Number, default: undefined },
    /** 柱体圆角半径（px，仅生长方向前端两角圆角） */
    barRadius: { type: Number, default: undefined },
    /** dataZoom 缩放（对齐 ECharts dataZoom）：true 全域窗口；对象可指定 start/end 百分比，slider / inside 可分别开关 */
    dataZoom: { type: [Boolean, Object] as PropType<boolean | KDataZoomOption>, default: undefined },
    /** 入场逐柱延迟 ms（对齐 ECharts animationDelay）：每根柱依次错峰生长，传函数可按类目下标自定义 */
    animationDelay: { type: [Number, Function] as PropType<number | ((index: number) => number)>, default: undefined },
    /** 完整配置透传（显式字段优先于同名散 props） */
    option: { type: Object as PropType<Partial<BarChartOption>>, default: undefined },
    /** 图表标题（图上方左对齐） */
    title: { type: String, default: '' },
    /** 是否显示图例（点击可切换系列显隐）：true 头部图例；对象可指定 position（top 缺省头部 / bottom 图表下方） */
    legend: { type: [Boolean, Object] as PropType<boolean | { position?: 'top' | 'bottom' }>, default: false },
    /** tooltip 数值自定义格式化（对齐 ECharts tooltip.valueFormatter）：返回字符串替换默认数值展示 */
    valueFormatter: { type: Function as PropType<(value: number, seriesName?: string) => string>, default: undefined },
    /** 空数据提示文案 */
    emptyText: { type: String, default: '暂无数据' },
    /** 画布内边距覆盖（对齐 ECharts grid 职责）：对象形态 Partial<Padding>，缺省用图表默认内边距 */
    padding: { type: Object as PropType<Partial<Padding>>, default: undefined },
  },
  setup(props) {
    const wrapRef = ref<HTMLDivElement | null>(null)
    const chartRef = ref<BarChart | null>(null)
    const { chartTheme } = useTheme()

    // ---- 图例切换状态（隐藏的系列名） ----
    const hiddenNames = ref<string[]>([])

    /** 系列色在完整系列列表中按索引固定分配，再过滤隐藏项（保证与图例同源） */
    const buildOption = (): BarChartOption => {
      const base: BarChartOption = {
        labels: props.labels,
        series: props.series
          .map((s, i) => ({
            ...s,
            color: s.color ?? getSeriesColor(defaultTheme.colors, i),
          }))
          .filter((s) => !hiddenNames.value.includes(s.name)),
        horizontal: props.horizontal,
        showBackground: props.showBackground,
        backgroundColor: props.backgroundColor,
        hoverHighlight: props.hoverHighlight,
        stackMode: props.stackMode,
        staggerLabels: props.staggerLabels,
        waterfall: props.waterfall,
        barWidth: props.barWidth,
        barGap: props.barGap,
        barRadius: props.barRadius,
        dataZoom: props.dataZoom,
        animationDelay: props.animationDelay,
        emptyText: props.emptyText,
        xAxis: props.xAxis,
        yAxis: props.yAxis,
        yAxis2: props.yAxis2,
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
      const chart = new BarChart(wrapRef.value, buildOption())
      chart.setEvents({ onHover: handleHover })
      chartRef.value = chart
      updateChart()
    })

    useResizeObserver(wrapRef, (width, height) => {
      chartRef.value?.resize(width, height)
    })

    watch(
      () => [props.labels, props.series, props.height, props.horizontal, props.xAxis, props.yAxis, props.yAxis2, props.showBackground, props.backgroundColor, props.hoverHighlight, props.stackMode, props.staggerLabels, props.waterfall, props.barWidth, props.barGap, props.barRadius, props.dataZoom, props.animationDelay, props.option, chartTheme],
      () => {
        // props 变化时同步清理已不存在的隐藏项
        hiddenNames.value = hiddenNames.value.filter((name) => props.series.some((s) => s.name === name))
        updateChart()
      },
      { deep: true }
    )

    onBeforeUnmount(() => {
      chartRef.value?.destroy()
      chartRef.value = null
    })

    const toggleSeries = (name: string): void => {
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
      // dataZoom 开启时命中索引是窗口内相对下标，需换算回全局下标
      const offset = chartRef.value.getVisibleStart?.() ?? 0
      const gi = info.index + offset
      tipLabel.value = option.labels[gi] ?? ''
      tipRows.value = option.series.map((s) => {
        const datum = normalizeData(s.data)[gi]
        return {
          name: s.name,
          color: colorToCss(datum?.color ?? s.color, ''),
          value: datum?.value === null || datum?.value === undefined ? '-' : props.valueFormatter ? props.valueFormatter(datum.value, s.name) : String(datum.value),
        }
      })

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

    return () => {
      // legend 位置（对齐 ECharts legend.top/bottom）：top 在头部（缺省）/ bottom 在图表下方
      const legendPos = props.legend && typeof props.legend === 'object' ? props.legend.position ?? 'top' : 'top'
      const legendNode = props.legend ? (
        <div class={legendPos === 'bottom' ? [bem.e('legend'), bem.em('legend', 'bottom')] : bem.e('legend')}>
          {props.series.map((s, i) => {
            const hidden = hiddenNames.value.includes(s.name)
            const color = colorToCss(s.color, getSeriesColor(defaultTheme.colors, i))
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
        <div class={bem()} style={{ height: `${props.height}px` }}>
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
