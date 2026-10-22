import { defineComponent, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { PropType } from 'vue'
import { LineChart } from '@/core/chart/line-chart'
import type { LineChartOption } from '@/core/chart/line-chart'
import { defaultTheme, getSeriesColor } from '@/core/theme'
import { normalizeData } from '@/core/utils/series-data'
import { createBem } from '@/utils/create-bem'
import { colorToCss } from '@/core/utils/gradient'
import { useResizeObserver } from '@/composables/use-resize-observer'
import { useTheme } from '@/composables/use-theme'
import type { HoverInfo, Padding, KDataZoomOption, KLineSeries, StepPosition } from '@/core/types'
import type { KAxisOption, KValueBand } from '@/core/chart/line-chart'

const bem = createBem('k-chart')

interface TooltipRow {
  name: string
  color: string
  value: string
}

/**
 * KLineChart 折线图组件
 *
 * 职责仅三件事：响应式 props 桥接核心图表实例、title/legend DOM 结构、tooltip。
 * 图表逻辑全部在 core 层，组件层保持薄。
 */
export default defineComponent({
  name: 'KLineChart',
  props: {
    /** x 轴类目标签 */
    labels: { type: Array as PropType<string[]>, required: true },
    /** 数据系列 */
    series: { type: Array as PropType<KLineSeries[]>, required: true },
    /** 图表高度 px（宽度随容器自适应） */
    height: { type: Number, default: 320 },
    /** 全局平滑开关（系列级 smooth 优先级更高） */
    smooth: { type: Boolean, default: false },
    /** 全局面积开关（系列级 area 优先级更高） */
    area: { type: Boolean, default: false },
    /** 全局阶梯开关（系列级 step 优先级更高；true 等价 'middle'） */
    step: { type: [Boolean, String] as PropType<boolean | StepPosition>, default: undefined },
    /** x 轴配置（show / name） */
    xAxis: { type: Object as PropType<KAxisOption>, default: undefined },
    /** y 轴配置（show / name） */
    yAxis: { type: Object as PropType<KAxisOption>, default: undefined },
    /** x 轴两端对齐：false（缺省）首尾点贴齐轴两端；true 点落在类目带中心、两端留半步空白 */
    boundaryGap: { type: Boolean, default: false },
    /** 次数值轴（右侧）：配合系列 yAxisIndex=1 使用 */
    yAxis2: { type: Object as PropType<KAxisOption>, default: undefined },
    /** 次类目轴（顶部）：展示与 x 轴相同的类目 */
    xAxis2: { type: Object as PropType<KAxisOption>, default: undefined },
    /** 凹凸图：按类目把系列值转成名次（1 = 最高） */
    bump: { type: Boolean, default: false },
    /** 数值参考带（AQI 可视化等场景） */
    valueBands: { type: Array as PropType<KValueBand[]>, default: undefined },
    /** 分段着色（对齐 ECharts visualMap-piecewise）：按数值区间给折线分段着色并绘制右侧图例 */
    visualPieces: { type: Array as PropType<KValueBand[]>, default: undefined },
    /** 数值 x 轴：labels 为数值字符串（函数绘图 / 双数值轴） */
    numericX: { type: Boolean, default: false },
    /** 垂直折线图：类目轴在 y（自下而上）、数值轴在 x */
    vertical: { type: Boolean, default: false },
    /** dataZoom 缩放（对齐 ECharts dataZoom）：true 全域窗口；对象可指定 start/end 百分比，slider / inside 可分别开关（inside 为绘图区滚轮缩放 + 拖拽平移） */
    dataZoom: { type: [Boolean, Object] as PropType<boolean | KDataZoomOption>, default: undefined },
    /** 默认符号点（ECharts 同款 emptyCircle）；false 时不常驻展示，悬停仍出现强调点 */
    showSymbol: { type: Boolean, default: true },
    /** 完整配置透传（显式字段优先于同名散 props） */
    option: { type: Object as PropType<Partial<LineChartOption>>, default: undefined },
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
    const chartRef = ref<LineChart | null>(null)
    const { chartTheme } = useTheme()

    // ---- 图例切换状态（隐藏的系列名） ----
    const hiddenNames = ref<string[]>([])

    const buildOption = (): LineChartOption => {
      const base: LineChartOption = {
        labels: props.labels,
        // 系列色在完整系列列表中按索引固定分配，再过滤隐藏项，
        // 保证图例、图表、tooltip 三处颜色同源，隐藏系列后不会漂移换色
        series: props.series
          .map((s, i) => ({
            ...s,
            color: s.color ?? getSeriesColor(defaultTheme.colors, i),
            smooth: s.smooth ?? props.smooth,
            area: s.area ?? props.area,
            step: s.step ?? props.step,
          }))
          .filter((s) => !hiddenNames.value.includes(s.name)),
        emptyText: props.emptyText,
        xAxis: props.xAxis,
        yAxis: props.yAxis,
        yAxis2: props.yAxis2,
        xAxis2: props.xAxis2,
        boundaryGap: props.boundaryGap,
        bump: props.bump,
        valueBands: props.valueBands,
        visualPieces: props.visualPieces,
        numericX: props.numericX,
        vertical: props.vertical,
        dataZoom: props.dataZoom,
        showSymbol: props.showSymbol,
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
      const chart = new LineChart(wrapRef.value, buildOption())
      chart.setEvents({ onHover: handleHover })
      chartRef.value = chart
      updateChart()
    })

    useResizeObserver(wrapRef, (width, height) => {
      chartRef.value?.resize(width, height)
    })

    watch(
      () => [props.labels, props.series, props.smooth, props.area, props.step, props.height, props.xAxis, props.yAxis, props.yAxis2, props.xAxis2, props.boundaryGap, props.bump, props.valueBands, props.visualPieces, props.numericX, props.vertical, props.dataZoom, props.showSymbol, props.option, chartTheme],
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
      // dataZoom 切片后 hover 索引为窗口内局部下标，换算回全量数据下标
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
