import { BaseChart } from './base-chart'
import { toPath } from './line-chart'
import type { CurveMode } from './line-chart'
import { BandScale, LinearScale } from '../scale'
import { niceTicks, clamp, clamp01 } from '../utils/math'
import { isDarkColor, withAlpha } from '../utils/color'
import { normalizeData } from '../utils/series-data'
import type { NormalizedDatum } from '../utils/series-data'
import { defaultTheme, getSeriesColor } from '../theme'
import type { KChartTheme } from '../theme'
import { circle, group, path, rect, text } from '../scene/nodes'
import type { GroupNode, SceneNode } from '../scene/nodes'
import type { HoverInfo, KAxisOption, KBarSeries, KColor, KDataZoomOption, KMarkAreaDatum, Padding, Point, RenderContext } from '../types'
import { DataZoomController, buildDataZoomSlider } from './data-zoom'
import type { ZoomGeom } from './data-zoom'
import { buildMarkLineNodes, resolveMarkLines } from './mark-line'
import { applyAxisRange, inverseDomain, labelColorOf, labelFontSizeOf, labelStepOf, nameColorOf, splitLineOf, splitStyleOf } from './axis-ext'
import { buildMarkPointNodes, resolveMarkPoints } from './mark-point'
import type { ResolvedMarkPoint } from './mark-point'
import { buildMarkAreaNodes } from './mark-area'
import type { ResolvedMarkArea } from './mark-area'
import type { ResolvedMarkLine } from './mark-line'

/** 柱形图配置（注册于 OptionMap['bar']） */
export interface BarChartOption {
  /** x 轴类目标签（横向模式下作为 y 轴类目） */
  labels: string[]
  /** 系列列表（data 支持裸值 / 携带配置对象双形态；type='line' 为折柱混合） */
  series: KBarSeries[]
  /** 是否横向条形图：类目轴在 y、数值轴在 x，柱子自左向右生长 */
  horizontal?: boolean
  /** 柱形浅灰背景带：每个类目一根全高背景柱（对齐 ECharts showBackground） */
  showBackground?: boolean
  /** 背景带颜色（纯色或渐变），缺省浅灰 rgba(148,152,166,0.14) */
  backgroundColor?: KColor
  /**
   * hover 高亮带：鼠标悬停时一根主题色淡色带平滑滑动到当前类目。默认开启，不依赖 showBackground。
   * 不传/true 用缺省色（主题首色 12% 透明度）；传颜色对象可自定义（纯色或渐变）；false 关闭。
   */
  hoverHighlight?: boolean | KColor
  /** 堆叠模式：'value' 原始值（缺省）/ 'percent' 按类目归一化为百分比堆叠 */
  stackMode?: 'value' | 'percent'
  /** x 轴类目标签交错两行显示（类目多 / 正负柱避让时开启，仅纵向模式） */
  staggerLabels?: boolean
  /** 瀑布图模式：取第一个系列数据按累计浮动柱绘制（正增绿 / 负减红，点级 color 可覆盖），带阶梯连接线 */
  waterfall?: boolean
  /** 滑条缩放（对齐 ECharts dataZoom）：true 全域窗口；对象可指定 start/end 百分比，slider / inside 可分别开关（inside 为绘图区滚轮缩放 + 拖拽平移，横向模式暂不支持） */
  dataZoom?: boolean | KDataZoomOption
  /** 入场逐柱延迟 ms（对齐 ECharts animationDelay）：每根柱依次错峰生长，传函数可按类目下标自定义；缺省 0 同时生长 */
  animationDelay?: number | ((index: number) => number)
  /** 次数值轴（右侧）：折柱混合时 type='line' 且 yAxisIndex=1 的系列使用 */
  yAxis2?: KAxisOption
  /** x 轴配置（纵向为类目轴，横向为数值轴） */
  xAxis?: KAxisOption
  /** y 轴配置（纵向为数值轴且 show 控制网格线，横向为类目轴） */
  yAxis?: KAxisOption
  /** 柱宽（px，对齐 ECharts barWidth）：不传按槽位自适应（占槽位 80%） */
  barWidth?: number
  /** 同类目内系列柱间空隙占柱宽比例（对齐 ECharts barGap），缺省 0.25 */
  barGap?: number
  /** 柱体圆角半径（px，对齐 ECharts borderRadius，仅生长方向前端两角圆角）；堆叠时每段都会圆角，建议单系列使用 */
  barRadius?: number
  /** 主题覆盖 */
  theme?: Partial<KChartTheme>
  /** 画布内边距覆盖 */
  padding?: Partial<Padding>
  /** 空数据提示文案 */
  emptyText?: string
}

/** 归一化后的系列（绘制与命中检测共用的内部模型） */
interface PreparedSeries {
  series: KBarSeries
  points: NormalizedDatum[]
  /** 系列颜色：纯色或渐变配置 */
  color: KColor
  /** 是否叠加折线系列（type='line'） */
  isLine: boolean
  /** 标线（基于全量数据预解析，不随缩放窗口重算） */
  markLines: ResolvedMarkLine[]
  /** 标注点（max/min/固定点，基于全量数据预解析） */
  markPoints: ResolvedMarkPoint[]
  /** 标域数据（像素解析在渲染时做） */
  markAreas: KMarkAreaDatum[]
}

interface Layout {
  pad: Padding
  plotX: number
  plotY: number
  plotW: number
  plotH: number
  /** 类目比例尺（纵向在 x，横向在 y） */
  catScale: BandScale
  /** 主数值比例尺（纵向在 y，横向在 x） */
  valScale: LinearScale
  /** 次数值比例尺（折柱混合右轴，无则为 null） */
  valScale2: LinearScale | null
  theme: KChartTheme
  prepared: PreparedSeries[]
  horizontal: boolean
  /** 瀑布图各柱顶部像素 y（tooltip 锚定用） */
  waterfallTops: number[] | null
  /** dataZoom 滑条几何，未启用为 null */
  zoom: ZoomGeom | null
}

const DEFAULT_PADDING: Padding = { top: 24, right: 24, bottom: 36, left: 44 }

/**
 * 柱形图
 * 支持：多系列分组 / 堆叠（series.stack）、横向条形图（option.horizontal）、
 * 自基线入场生长动画、null 断点跳柱、点级颜色与标签、悬停十字参考线。
 */
export class BarChart extends BaseChart<BarChartOption> {
  private layout: Layout | null = null
  /** dataZoom 滑条控制器（与折线图共用的直角坐标系能力） */
  private zoomer: DataZoomController
  /** hover 高亮带当前中心位置（画布坐标，rAF 逐帧逼近目标，实现平滑滑动） */
  private bandPos = 0
  /** 高亮带目标类目下标（null 表示指针已离开，淡出中） */
  private bandTarget: number | null = null
  /** 目标中心坐标（每次 build 刷新，rAF 读成员避免旧帧闭包过期导致追不上） */
  private bandTargetX = 0
  /** 高亮带不透明度 0~1（出现/消失淡入淡出） */
  private bandAlpha = 0
  private bandRaf: number | null = null

  constructor(container: HTMLElement, option: BarChartOption) {
    super(container, option)
    this.zoomer = new DataZoomController(this.renderer, () => this.render())
  }

  override destroy(): void {
    if (this.bandRaf !== null) cancelAnimationFrame(this.bandRaf)
    this.bandRaf = null
    super.destroy()
  }

  /**
   * 同步高亮带动画状态（build 内每帧调用）：目标变化时启动 rAF 缓动，
   * 位置逐帧向目标类目中心靠拢（lerp），透明度向目标淡入淡出，收敛后自动停帧。
   * 目标坐标存成员而非闭包：闭包在快速移动时会捕获旧帧的 hoverIndex，导致带子卡死在旧位置。
   */
  private syncBandAnim(hoverIndex: number | null, targetPos: () => number): void {
    const changed = hoverIndex !== this.bandTarget
    this.bandTarget = hoverIndex
    if (hoverIndex !== null) this.bandTargetX = targetPos()
    if (!changed && this.bandRaf !== null) return
    // 首次出现：直接就位，只做淡入，避免从旧位置飞入
    if (this.bandAlpha <= 0.01 && hoverIndex !== null) this.bandPos = this.bandTargetX
    if (this.bandRaf !== null) return
    const tick = (): void => {
      const target = this.bandTarget
      if (target !== null) {
        this.bandPos += (this.bandTargetX - this.bandPos) * 0.28
        this.bandAlpha += (1 - this.bandAlpha) * 0.22
      } else {
        this.bandAlpha += (0 - this.bandAlpha) * 0.22
      }
      const posDone = target === null || Math.abs(this.bandTargetX - this.bandPos) < 0.5
      const alphaDone = this.bandAlpha < 0.005 || (target !== null && this.bandAlpha > 0.995)
      if (posDone && alphaDone) {
        if (target === null) this.bandAlpha = 0
        this.bandRaf = null
        return
      }
      this.render()
      this.bandRaf = requestAnimationFrame(tick)
    }
    this.bandRaf = requestAnimationFrame(tick)
  }

  /** 当前可视窗口的起始数据下标（组件层 tooltip 全局索引换算用） */
  getVisibleStart(): number {
    return this.zoomer.visibleStart
  }

  protected build(option: BarChartOption, ctx: RenderContext): GroupNode {
    const theme: KChartTheme = { ...defaultTheme, ...option.theme }
    const horizontal = option.horizontal ?? false

    // ============ markLine / markPoint 解析（基于全量数据：均值/阈值/极值不随缩放窗口变化） ============
    const fullMarkLines = option.series.map((s) => resolveMarkLines(s, option.labels))
    const fullMarkPoints = option.series.map((s) => resolveMarkPoints(s, option.labels))

    // ============ dataZoom：解析窗口并切片（窗口为全域时仅出滑条不切片；inside 模式滚轮缩放共用同一切片） ============
    const zoomCfg = this.zoomer.resolve(option.dataZoom, false, option.labels.length, horizontal)
    const zoomActive = !!zoomCfg?.slider
    let silValues: Array<number | null> = []
    if (zoomCfg) {
      const n = option.labels.length
      const [start, end] = this.zoomer.applyWindow(n)
      silValues = option.series.length ? normalizeData(option.series[0].data).map((d) => d.value) : []
      if (start > 0 || end < n - 1) {
        option = {
          ...option,
          labels: option.labels.slice(start, end + 1),
          series: option.series.map((ser) => ({ ...ser, data: ser.data.slice(start, end + 1) })),
        }
      }
    }

    // ============ 数据归一化（双形态 → 统一模型；柱/线系列拆分） ============
    const prepared: PreparedSeries[] = option.series.map((s, si) => ({
      series: s,
      points: normalizeData(s.data),
      color: s.color ?? getSeriesColor(theme.colors, si),
      isLine: s.type === 'line' && !horizontal,
      markLines: fullMarkLines[si] ?? [],
      markPoints: fullMarkPoints[si] ?? [],
      markAreas: Array.isArray(s.markArea) ? s.markArea : (s.markArea?.data ?? []),
    }))

    // 堆叠归一化：stackMode='percent' 时按类目把堆叠组重算为百分比（绝对值合计为分母，正负各归各位）
    if (option.stackMode === 'percent') {
      const totals = new Map<string, number>()
      prepared.forEach((p) => {
        if (!p.series.stack || p.isLine) return
        p.points.forEach((d, i) => {
          if (d.value === null) return
          const key = `${p.series.stack}/${i}`
          totals.set(key, (totals.get(key) ?? 0) + Math.abs(d.value))
        })
      })
      prepared.forEach((p) => {
        if (!p.series.stack || p.isLine) return
        p.points = p.points.map((d, i) => {
          if (d.value === null) return d
          const total = totals.get(`${p.series.stack}/${i}`) ?? 0
          return { ...d, value: total > 0 ? (d.value / total) * 100 : 0 }
        })
      })
    }

    // 瀑布图：取第一个柱体系列按累计浮动柱展开（正增/负减，点级 color 可覆盖）
    const waterfall = (option.waterfall ?? false) && !horizontal && prepared.length > 0
    let waterfallBars: Array<{ bottom: number; top: number; v: number; color: string; labelShow: boolean }> = []
    if (waterfall && prepared.length > 0) {
      const src = prepared[0]
      let cum = 0
      waterfallBars = src.points.map((d) => {
        const v = d.value ?? 0
        const start = cum
        cum += v
        return {
          bottom: Math.min(start, cum),
          top: Math.max(start, cum),
          v,
          color: d.color ?? (v >= 0 ? '#00C48C' : '#F5455C'),
          labelShow: d.labelShow ?? false,
        }
      })
    }

    // 次数值轴（折柱混合右轴）：仅纵向且存在 yAxisIndex=1 的线系列时启用
    const useRight = prepared.some((p) => p.isLine && p.series.yAxisIndex === 1)

    // ============ 内边距：轴名称 / 交错标签 / 右轴各占一行一列 ============
    const pad: Padding = { ...DEFAULT_PADDING, ...option.padding }
    if (option.xAxis?.name) pad.bottom += 16
    // 倾斜的 x 轴标签需要更多底部空间（按最长类目估算，封顶 48px）；倾斜优先于交错
    const xRotate = horizontal ? 0 : (option.xAxis?.labelRotate ?? 0)
    if (xRotate) {
      pad.bottom += rotatedLabelPad(option.labels, xRotate, theme.fontSize)
      // "/" 形首个标签向左出界、"\" 形末个标签向右出界：按水平投影预留对应侧 pad（封顶 48px）
      const side = rotatedLabelSidePad(option.labels, xRotate, theme.fontSize, ctx.width - pad.left - pad.right)
      if (xRotate > 0) pad.left += side
      else pad.right += side
    }
    if (option.staggerLabels && !horizontal && !xRotate) pad.bottom += 16
    if (useRight && (option.yAxis2?.show ?? true)) pad.right += 36
    // dataZoom 滑条占底部一行
    if (zoomActive) pad.bottom += 44

    const labelCount_ = option.labels.length

    // ============ 入场逐柱延迟（对齐 ECharts animationDelay）：每根柱在总进度轴上错峰生长 ============
    // 基础入场时长 700ms（BaseChart.playEntrance），delay 把单柱窗口后移并同步拉长总时间轴
    const delayOf = (i: number): number => {
      const d = option.animationDelay ?? 0
      return typeof d === 'function' ? d(i) : d
    }
    const ENTRANCE_MS = 700
    const maxDelayN = labelCount_ > 0 ? Math.max(0, ...Array.from({ length: labelCount_ }, (_, i) => delayOf(i) / ENTRANCE_MS)) : 0
    const animSpan = 1 + maxDelayN
    /** 柱 i 的局部生长进度 0~1（含逐柱延迟） */
    const growOf = (i: number): number => clamp01(ctx.progress * animSpan - delayOf(i) / ENTRANCE_MS)

    const plotX = pad.left
    const plotY = pad.top
    const plotW = Math.max(0, ctx.width - pad.left - pad.right)
    const plotH = Math.max(0, ctx.height - pad.top - pad.bottom)

    // ============ 空数据兜底 ============
    const allValues = prepared
      .flatMap((p) => p.points)
      .map((d) => d.value)
      .filter((v): v is number => v !== null)
    if (option.labels.length === 0 || allValues.length === 0) {
      return group({
        key: 'empty',
        children: [
          text(ctx.width / 2, ctx.height / 2, option.emptyText ?? '暂无数据', {
            key: 'empty-text',
            anchor: 'middle',
            fontSize: 14,
            fill: theme.emptyColor,
            fontFamily: theme.fontFamily,
          }),
        ],
      })
    }

    // ============ 比例尺（主轴含柱系列与左轴线系列；右轴归右轴线系列；瀑布用浮动区间） ============
    const numOf = (vs: Array<number | null>): Array<number> => vs.filter((v): v is number => v !== null)
    const mainValues = waterfall
      ? waterfallBars.flatMap((b) => [b.bottom, b.top])
      : [
          ...numOf(prepared.filter((p) => !p.isLine).flatMap((p) => p.points).map((d) => d.value)),
          ...numOf(prepared.filter((p) => p.isLine && (p.series.yAxisIndex ?? 0) === 0).flatMap((p) => p.points).map((d) => d.value)),
        ]
    const rawMin = Math.min(...mainValues)
    const rawMax = Math.max(...mainValues)
    // 业务数据默认含 0 基线，避免波动被放大
    const domainMin = rawMin > 0 ? 0 : rawMin
    const valAxis = horizontal ? option.xAxis : option.yAxis
    const ticksResult = applyAxisRange(niceTicks(domainMin, rawMax, 5), valAxis)
    const catScale = horizontal
      ? new BandScale(option.labels, [plotY, plotY + plotH])
      : new BandScale(option.labels, [plotX, plotX + plotW])
    const valScale = horizontal
      ? new LinearScale(inverseDomain(ticksResult.min, ticksResult.max, valAxis), [plotX, plotX + plotW])
      : new LinearScale(inverseDomain(ticksResult.min, ticksResult.max, valAxis), [plotY + plotH, plotY])

    // 右轴：独立 0 基线域
    const rightValues = numOf(prepared.filter((p) => p.isLine && p.series.yAxisIndex === 1).flatMap((p) => p.points).map((d) => d.value))
    let valScale2: LinearScale | null = null
    let ticksResult2: { min: number; max: number; ticks: number[] } | null = null
    if (useRight && rightValues.length > 0) {
      const rMin = Math.min(...rightValues)
      const rMax = Math.max(...rightValues)
      ticksResult2 = niceTicks(rMin > 0 ? 0 : rMin, rMax, 5)
      valScale2 = new LinearScale([ticksResult2.min, ticksResult2.max], [plotY + plotH, plotY])
    }

    this.layout = { pad, plotX, plotY, plotW, plotH, catScale, valScale, valScale2, theme, prepared, horizontal, waterfallTops: null, zoom: null }

    // ============ dataZoom 滑条几何（渲染与拖拽命中共用）；inside 模式记录绘图区供滚轮缩放 / 拖拽平移命中 ============
    const zoomGeom = zoomActive ? this.zoomer.buildGeom(pad.left, ctx.height - 24, plotW) : null
    this.layout.zoom = zoomGeom
    this.zoomer.setPlotRect(zoomCfg?.inside ? { x: plotX, y: plotY, w: plotW, h: plotH } : null)

    const children: GroupNode['children'] = []

    // ============ 柱形背景带（showBackground：每类目一根全高浅灰柱，柱体之下） ============
    if (option.showBackground ?? false) {
      const bgFill = this.resolvePaint(option.backgroundColor, 'rgba(148, 152, 166, 0.14)')
      const bgNodes: GroupNode['children'] = []
      for (let i = 0; i < option.labels.length; i++) {
        const c = catScale.center(i)
        const bw = catScale.bandwidth$
        const bgRect = horizontal
          ? rect(plotX, r2(c - bw / 2), plotW, r2(bw), { key: `bg/${i}`, radius: Math.min(4, bw / 2), fill: bgFill, opacity: clamp01(ctx.progress * 2) })
          : rect(r2(c - bw / 2), plotY, r2(bw), plotH, { key: `bg/${i}`, radius: Math.min(4, bw / 2), fill: bgFill, opacity: clamp01(ctx.progress * 2) })
        bgNodes.push(bgRect)
      }
      children.push(group({ key: 'background', children: bgNodes }))
    }

    // ============ hover 高亮带：一根主题色淡色带平滑滑动到当前类目（默认开启，false 关闭，可换色） ============
    if (option.hoverHighlight !== false) {
      const hi = ctx.hoverIndex
      const active = hi !== null && hi >= 0 && hi < option.labels.length
      this.syncBandAnim(active ? hi : null, () => (active && hi !== null ? catScale.center(hi) : this.bandPos))
      if (this.bandAlpha > 0.01) {
        const hlPaint =
          option.hoverHighlight !== undefined && option.hoverHighlight !== true
            ? this.resolvePaint(option.hoverHighlight)
            : withAlpha(theme.colors[0], 0.14)
        const c = this.bandPos
        const bw = catScale.bandwidth$
        children.push(
          group({
            key: 'hover-band',
            children: [
              horizontal
                ? rect(plotX, r2(c - bw / 2), plotW, r2(bw), { key: 'hl', radius: Math.min(4, bw / 2), fill: hlPaint, opacity: this.bandAlpha })
                : rect(r2(c - bw / 2), plotY, r2(bw), plotH, { key: 'hl', radius: Math.min(4, bw / 2), fill: hlPaint, opacity: this.bandAlpha }),
            ],
          })
        )
      }
    }

    // ============ 数值轴：网格线 + 刻度标签（对齐 ECharts：splitLine 隶属数值轴） ============
    const showCatAxis = (horizontal ? option.yAxis?.show : option.xAxis?.show) ?? true
    const showValAxis = (horizontal ? option.xAxis?.show : option.yAxis?.show) ?? true
    const axisBottom = plotY + plotH
    const gridNodes: GroupNode['children'] = []
    const valLabelNodes: GroupNode['children'] = []
    const valTickNodes: GroupNode['children'] = []
    if (showValAxis) {
      const showGrid = splitLineOf(valAxis)
      const gridStyle = splitStyleOf(valAxis)
      for (const tick of ticksResult.ticks) {
        const tp = r2(valScale.scale(tick))
        // 纵向网格线为水平线，横向网格线为垂直线
        if (showGrid) {
          gridNodes.push(
            horizontal
              ? path(`M${tp},${plotY}L${tp},${axisBottom}`, { key: `grid/${tick}`, stroke: gridStyle.color ?? theme.gridColor, strokeWidth: 1, dash: gridStyle.dash })
              : path(`M${plotX},${tp}L${plotX + plotW},${tp}`, { key: `grid/${tick}`, stroke: gridStyle.color ?? theme.gridColor, strokeWidth: 1, dash: gridStyle.dash })
          )
        }
        if (horizontal) {
          valLabelNodes.push(
            text(tp, axisBottom + 20, axisLabelFmt(option.xAxis, tick), {
              key: `xlabel/${tick}`,
              anchor: 'middle',
              fontSize: labelFontSizeOf(option.xAxis, theme.fontSize),
              fill: labelColorOf(option.xAxis, theme.textColor),
              fontFamily: theme.fontFamily,
            })
          )
          valTickNodes.push(
            path(`M${tp},${axisBottom}L${tp},${axisBottom + 5}`, {
              key: `xtick/${tick}`,
              stroke: theme.axisLineColor,
              strokeWidth: 1,
            })
          )
        } else {
          valLabelNodes.push(
            text(plotX - 8, tp + labelFontSizeOf(option.yAxis, theme.fontSize) / 2 - 1, axisLabelFmt(option.yAxis, tick), {
              key: `ylabel/${tick}`,
              anchor: 'end',
              fontSize: labelFontSizeOf(option.yAxis, theme.fontSize),
              fill: labelColorOf(option.yAxis, theme.textColor),
              fontFamily: theme.fontFamily,
            })
          )
          valTickNodes.push(
            path(`M${plotX},${tp}L${plotX - 5},${tp}`, {
              key: `ytick/${tick}`,
              stroke: theme.axisLineColor,
              strokeWidth: 1,
            })
          )
        }
      }
    }
    children.push(group({ key: 'grid', children: gridNodes }))

    // ============ 轴线（双轴线清晰可见，对齐 ECharts 基础样式） ============
    if (showCatAxis) {
      // 类目轴线：纵向在底部，横向在左侧
      children.push(
        horizontal
          ? path(`M${plotX},${plotY}L${plotX},${axisBottom}`, { key: 'axis/cat', stroke: theme.axisLineColor, strokeWidth: 1 })
          : path(`M${plotX},${axisBottom}L${plotX + plotW},${axisBottom}`, { key: 'axis/cat', stroke: theme.axisLineColor, strokeWidth: 1 })
      )
    }
    if (showValAxis) {
      // 数值轴线：纵向在左侧，横向在底部
      children.push(
        horizontal
          ? path(`M${plotX},${axisBottom}L${plotX + plotW},${axisBottom}`, { key: 'axis/val', stroke: theme.axisLineColor, strokeWidth: 1 })
          : path(`M${plotX},${plotY}L${plotX},${axisBottom}`, { key: 'axis/val', stroke: theme.axisLineColor, strokeWidth: 1 })
      )
    }

    // ============ 次数值轴（右轴，折柱混合；仅纵向） ============
    // 注：右轴名称也归入类目标签层，需在类目标签节点数组声明之后使用
    const catLabelNodes: GroupNode['children'] = []
    const catTickNodes: GroupNode['children'] = []
    if (useRight && valScale2 && ticksResult2 && !horizontal) {
      for (const tick of ticksResult2.ticks) {
        const tp = r2(valScale2.scale(tick))
        valLabelNodes.push(
          text(plotX + plotW + 8, tp + theme.fontSize / 2 - 1, axisLabelFmt(option.yAxis2, tick), {
            key: `y2label/${tick}`,
            anchor: 'start',
            fontSize: theme.fontSize,
            fill: theme.textColor,
            fontFamily: theme.fontFamily,
          })
        )
        valTickNodes.push(
          path(`M${plotX + plotW},${tp}L${plotX + plotW + 5},${tp}`, {
            key: `y2tick/${tick}`,
            stroke: theme.axisLineColor,
            strokeWidth: 1,
          })
        )
      }
      // 右轴轴线
      children.push(
        path(`M${plotX + plotW},${plotY}L${plotX + plotW},${axisBottom}`, { key: 'axis/val2', stroke: theme.axisLineColor, strokeWidth: 1 })
      )
      if (option.yAxis2?.name) {
        catLabelNodes.push(
          text(plotX + plotW + 8, plotY - 10, option.yAxis2.name, {
            key: 'y2name',
            anchor: 'start',
            fontSize: theme.fontSize,
            fill: nameColorOf(option.yAxis2, theme.textColor),
            fontFamily: theme.fontFamily,
          })
        )
      }
    }

    // ============ 类目标签 + 刻度（按绘制方向长度抽稀，刻度随标签走） ============
    const labelCount = option.labels.length
    const maxVisible = horizontal
      ? Math.max(2, Math.floor(plotH / 48))
      : Math.max(2, Math.floor(plotW / 64))
    const labelStep = option.staggerLabels
      ? Math.ceil(labelCount / maxVisible)
      : labelStepOf(horizontal ? option.yAxis : option.xAxis, Math.ceil(labelCount / maxVisible))
    if (showCatAxis) {
      for (let i = 0; i < labelCount; i++) {
        if (i % labelStep !== 0 && i !== labelCount - 1) continue
        const cp = r2(catScale.center(i))
        if (horizontal) {
          catLabelNodes.push(
            text(plotX - 8, cp + theme.fontSize / 2 - 1, option.labels[i], {
              key: `xlabel/${i}`,
              anchor: 'end',
              fontSize: theme.fontSize,
              fill: theme.textColor,
              fontFamily: theme.fontFamily,
            })
          )
          catTickNodes.push(
            path(`M${plotX},${cp}L${plotX - 5},${cp}`, {
              key: `xtick/${i}`,
              stroke: theme.axisLineColor,
              strokeWidth: 1,
            })
          )
        } else {
          catLabelNodes.push(
            text(cp, axisBottom + (xRotate ? 14 : 20 + (option.staggerLabels ? (i % 2) * 16 : 0)), option.labels[i], {
              key: `xlabel/${i}`,
              anchor: xRotate ? (xRotate > 0 ? 'end' : 'start') : 'middle',
              rotate: xRotate ? -xRotate : undefined,
              fontSize: theme.fontSize,
              fill: theme.textColor,
              fontFamily: theme.fontFamily,
            })
          )
          catTickNodes.push(
            path(`M${cp},${axisBottom}L${cp},${axisBottom + 5}`, {
              key: `xtick/${i}`,
              stroke: theme.axisLineColor,
              strokeWidth: 1,
            })
          )
        }
      }
      // 轴名称：数值轴名称贴轴尾第二行，类目轴名称贴轴首上方
      const valAxisName = horizontal ? option.xAxis?.name : option.yAxis?.name
      const catAxisName = horizontal ? option.yAxis?.name : option.xAxis?.name
      const valAxisOpt = horizontal ? option.xAxis : option.yAxis
      const catAxisOpt = horizontal ? option.yAxis : option.xAxis
      if (valAxisName) {
        catLabelNodes.push(
          horizontal
            ? text(plotX + plotW, axisBottom + 36, valAxisName, { key: 'xname', anchor: 'end', fontSize: theme.fontSize, fill: nameColorOf(valAxisOpt, theme.textColor), fontFamily: theme.fontFamily })
            : text(plotX - 8, plotY - 10, valAxisName, { key: 'yname', anchor: 'start', fontSize: theme.fontSize, fill: nameColorOf(valAxisOpt, theme.textColor), fontFamily: theme.fontFamily })
        )
      }
      if (catAxisName) {
        catLabelNodes.push(
          horizontal
            ? text(plotX - 8, plotY - 10, catAxisName, { key: 'yname', anchor: 'start', fontSize: theme.fontSize, fill: nameColorOf(catAxisOpt, theme.textColor), fontFamily: theme.fontFamily })
            : text(plotX + plotW, axisBottom + 36, catAxisName, { key: 'xname', anchor: 'end', fontSize: theme.fontSize, fill: nameColorOf(catAxisOpt, theme.textColor), fontFamily: theme.fontFamily })
        )
      }
    }
    children.push(group({ key: 'catlabel', children: catLabelNodes }))
    children.push(group({ key: 'cattick', children: catTickNodes }))
    children.push(group({ key: 'vallabel', children: valLabelNodes }))
    children.push(group({ key: 'valtick', children: valTickNodes }))

    // ============ 悬停十字参考线（柱体之下，先画） ============
    if (ctx.hoverIndex !== null && ctx.hoverIndex < labelCount) {
      const hc = r2(catScale.center(ctx.hoverIndex))
      children.push(
        horizontal
          ? path(`M${plotX},${hc}L${plotX + plotW},${hc}`, { key: 'crosshair', stroke: theme.axisLineColor, strokeWidth: 1, dash: [4, 4] })
          : path(`M${hc},${plotY}L${hc},${axisBottom}`, { key: 'crosshair', stroke: theme.axisLineColor, strokeWidth: 1, dash: [4, 4] })
      )
    }

    // ============ 柱体布局：槽位 = 独占系列或一个堆叠组 ============
    const slotKeys: string[] = []
    const slotIndexOf = new Map<number, number>()
    option.series.forEach((s, si) => {
      const key = s.stack ? `stack:${s.stack}` : `single:${si}`
      let idx = slotKeys.indexOf(key)
      if (idx === -1) {
        slotKeys.push(key)
        idx = slotKeys.length - 1
      }
      slotIndexOf.set(si, idx)
    })
    const slotCount = Math.max(1, slotKeys.length)
    const slotWidth = catScale.bandwidth$ / slotCount
    // 柱宽：barWidth 显式指定（封顶槽位宽）否则按槽位减去系列间空隙（barGap 占柱宽比例，缺省 0.25）
    const barWidth = option.barWidth
      ? Math.min(option.barWidth, slotWidth)
      : Math.max(2, slotWidth / (1 + (option.barGap ?? 0.25)))

    // 堆叠累计：key = 槽位/类目，正负值分开累计（对齐 ECharts：负值堆到 0 以下）
    const stackAcc = new Map<string, { pos: number; neg: number }>()

    // 0 基线像素位置（入场生长与标签方向的锚点）
    const base0 = valScale.scale(0)
    const barNodes: GroupNode['children'] = []
    const labelNodes: GroupNode['children'] = []

    if (waterfall) {
      // ============ 瀑布图：浮动柱 + 阶梯连接线 ============
      const wfTops: number[] = []
      waterfallBars.forEach((b, i) => {
        const catCenter = catScale.center(i)
        const pA = valScale.scale(b.bottom)
        const pB = valScale.scale(b.top)
        const inner = Math.abs(pA - base0) <= Math.abs(pB - base0) ? pA : pB
        const outer = inner === pA ? pB : pA
        const dir = outer >= inner ? 1 : -1
        const fullH = Math.max(1, Math.abs(pB - pA))
        const grow = fullH * growOf(i)
        const barY = dir === 1 ? inner : inner - grow
        barNodes.push(
          rect(r2(catCenter - barWidth / 2), r2(barY), r2(barWidth), r2(grow), { key: `wbar/${i}`, fill: b.color, cursor: 'pointer' })
        )
        wfTops.push(r2(Math.min(pA, pB)))
        if (b.labelShow) {
          const labelY = dir === 1 ? outer - 6 : outer + theme.fontSize + 4
          labelNodes.push(
            text(r2(catCenter), r2(labelY), formatNumber(b.v), {
              key: `wlabel/${i}`,
              anchor: 'middle',
              fontSize: theme.fontSize,
              fontWeight: 600,
              fill: b.color,
              fontFamily: theme.fontFamily,
            })
          )
        }
      })
      this.layout.waterfallTops = wfTops
      // 阶梯连接线：上一根柱累计终点水平延伸到下一根柱侧缘（虚线）
      for (let i = 0; i < waterfallBars.length - 1; i++) {
        const level = valScale.scale(waterfallBars[i].top)
        const x1 = catScale.center(i) + barWidth / 2
        const x2 = catScale.center(i + 1) - barWidth / 2
        if (x2 <= x1) continue
        barNodes.push(
          path(`M${r2(x1)},${r2(level)}L${r2(x2)},${r2(level)}`, {
            key: `wlink/${i}`,
            stroke: withAlpha(theme.textColor, 0.45),
            strokeWidth: 1,
            dash: [3, 3],
          })
        )
      }
    } else {
      prepared.forEach((p, si) => {
        if (p.isLine) return
      const slot = slotIndexOf.get(si) ?? 0
      const groupOffset = (slot - (slotCount - 1) / 2) * slotWidth

      for (let i = 0; i < labelCount; i++) {
        const datum = p.points[i]
        if (!datum || datum.value === null) continue
        const v = datum.value
        const color = datum.color ?? p.color

        // 段的两个数据端（非堆叠槽位即 [0, v]）
        let bottom = 0
        let top = v
        if (p.series.stack) {
          const accKey = `${slot}/${i}`
          const acc = stackAcc.get(accKey) ?? { pos: 0, neg: 0 }
          if (v >= 0) {
            bottom = acc.pos
            top = acc.pos + v
            acc.pos = top
          } else {
            top = acc.neg
            bottom = acc.neg + v
            acc.neg = bottom
          }
          stackAcc.set(accKey, acc)
        }

        // 像素两端；内侧端（靠近 0 基线）为生长锚点
        const pA = valScale.scale(bottom)
        const pB = valScale.scale(top)
        const inner = Math.abs(pA - base0) <= Math.abs(pB - base0) ? pA : pB
        const outer = inner === pA ? pB : pA
        const dir = outer >= inner ? 1 : -1
        const fullH = Math.abs(pB - pA)
        const grow = fullH * growOf(i)

        // 柱体几何：沿数值轴从内侧端向外生长；barRadius 时生长方向前端两角圆角
        const catCenter = catScale.center(i) + groupOffset
        const barProps = { key: `bar/${si}/${i}`, fill: this.resolvePaint(color) }
        if (horizontal) {
          const barX = dir === 1 ? inner : inner - grow
          barNodes.push(barGeom(r2(barX), r2(catCenter - barWidth / 2), r2(grow), r2(barWidth), barProps, option.barRadius, outer > inner ? 'right' : 'left'))
        } else {
          const barY = dir === 1 ? inner : inner - grow
          barNodes.push(barGeom(r2(catCenter - barWidth / 2), r2(barY), r2(barWidth), r2(grow), barProps, option.barRadius, outer < inner ? 'top' : 'bottom'))
        }

        // 点级标签：贴在外侧端外 6px（负值方向同理）
        if (datum.labelShow) {
          if (horizontal) {
            const anchor = dir === 1 ? 'start' : 'end'
            const labelX = outer + dir * 6
            labelNodes.push(
              text(r2(labelX), r2(catCenter + theme.fontSize / 2 - 1), formatNumber(v), {
                key: `label/${si}/${i}`,
                anchor,
                fontSize: theme.fontSize,
                fontWeight: 600,
                fill: this.solidColor(color),
                fontFamily: theme.fontFamily,
              })
            )
          } else {
            const labelY = dir === 1 ? outer - 6 : outer + theme.fontSize + 4
            labelNodes.push(
              text(r2(catCenter), r2(labelY), formatNumber(v), {
                key: `label/${si}/${i}`,
                anchor: 'middle',
                fontSize: theme.fontSize,
                fontWeight: 600,
                fill: this.solidColor(color),
                fontFamily: theme.fontFamily,
              })
            )
          }
        }
      }
    })
    }

    // ============ 折柱混合：叠加折线系列（画在柱体之上，随入场渐显） ============
      const lineSeries = prepared.filter((p) => p.isLine)
      if (lineSeries.length > 0) {
        const paintOf = (c: KColor | undefined): string => this.resolvePaint(c)
      const lineNodes: GroupNode['children'] = []
      const dotNodes: GroupNode['children'] = []
      lineSeries.forEach((p, li) => {
        const valScale2 = this.layout?.valScale2
        const scale = p.series.yAxisIndex === 1 && valScale2 ? valScale2 : valScale
        const segs: Point[][] = []
        let seg: Point[] = []
        p.points.forEach((d, i) => {
          if (d.value === null || i >= labelCount) {
            if (seg.length > 0) segs.push(seg)
            seg = []
            return
          }
          seg.push({ x: catScale.center(i), y: scale.scale(d.value) })
        })
        if (seg.length > 0) segs.push(seg)
        const mode: CurveMode = p.series.smooth ? 'smooth' : 'linear'
        segs.forEach((s, ki) => {
          lineNodes.push(
            path(toPath(s, mode), {
              key: `mline/${li}/${ki}`,
              stroke: paintOf(p.color),
              strokeWidth: 2,
              fill: 'none',
              opacity: clamp01((ctx.progress - 0.4) * 2),
              cursor: 'pointer',
            })
          )
        })
        // 折线数据点圆点（柱形图上无高亮逻辑，常驻小点辅助读数）
        p.points.forEach((d, i) => {
          if (d.value === null || i >= labelCount) return
          dotNodes.push(
            circle(catScale.center(i), r2(scale.scale(d.value)), 3, {
              key: `mdot/${li}/${i}`,
              fill: this.solidColor(d.color ?? p.color),
              stroke: '#FFFFFF',
              strokeWidth: 1,
              opacity: clamp01((ctx.progress - 0.4) * 2),
            })
          )
        })
      })
      children.push(group({ key: 'mixed-lines', children: [...lineNodes, ...dotNodes] }))
    }

    // ============ markArea 标域（画在系列之下：类目带 / 数值带半透明矩形） ============
    const markAreaPx: ResolvedMarkArea[] = []
    const halfStep = (horizontal ? plotH : plotW) / Math.max(1, labelCount) / 2
    prepared.forEach((p) => {
      p.markAreas.forEach((d) => {
        const vScale = p.isLine && p.series.yAxisIndex === 1 && valScale2 ? valScale2 : valScale
        // x 区间：类目带（横向柱图时 x 轴是数值轴，仅支持 yAxis 数值带）
        let pa1: number | undefined
        let pa2: number | undefined
        let pb1: number | undefined
        let pb2: number | undefined
        if (!horizontal && d.xAxis !== undefined) {
          let i1 = typeof d.xAxis === 'number' ? d.xAxis : option.labels.indexOf(String(d.xAxis))
          if (i1 < 0) {
            const num = Number(d.xAxis)
            if (Number.isInteger(num) && option.labels[num] !== undefined) i1 = num
          }
          if (i1 < 0 || i1 >= labelCount) return
          pa1 = catScale.center(i1) - halfStep
          if (d.xAxis2 === undefined) {
            pa2 = pa1 + halfStep * 2
          } else {
            let i2 = typeof d.xAxis2 === 'number' ? d.xAxis2 : option.labels.indexOf(String(d.xAxis2))
            if (i2 < 0) {
              const num2 = Number(d.xAxis2)
              if (Number.isInteger(num2) && option.labels[num2] !== undefined) i2 = num2
            }
            if (i2 < 0 || i2 >= labelCount) return
            pa2 = catScale.center(i2) + halfStep
          }
        }
        // y 区间：数值带
        if (d.yAxis !== undefined && Number.isFinite(d.yAxis)) pb1 = vScale.scale(d.yAxis)
        if (d.yAxis2 !== undefined && Number.isFinite(d.yAxis2)) pb2 = vScale.scale(d.yAxis2)
        if (horizontal && (d.xAxis !== undefined || d.xAxis2 !== undefined)) {
          // 横向：xAxis~xAxis2 解释为数值带（数值轴在水平方向）
          if (d.xAxis !== undefined && Number.isFinite(Number(d.xAxis))) pb1 = valScale.scale(Number(d.xAxis))
          if (d.xAxis2 !== undefined && Number.isFinite(Number(d.xAxis2))) pb2 = valScale.scale(Number(d.xAxis2))
          pa1 = undefined
          pa2 = undefined
        }
        if (pa1 === undefined && pb1 === undefined) return
        markAreaPx.push({
          x1: pa1 ?? plotX,
          x2: pa2 ?? plotX + plotW,
          y1: pb1 ?? plotY,
          y2: pb2 ?? plotY + plotH,
          color: d.color,
          label: d.label,
        })
      })
    })
    const areaGroup = buildMarkAreaNodes({
      areas: markAreaPx.map((a) => ({
        ...a,
        x1: Math.max(a.x1, plotX),
        x2: Math.min(a.x2, plotX + plotW),
        y1: Math.max(a.y1, plotY),
        y2: Math.min(a.y2, plotY + plotH),
      })),
      fontSize: theme.fontSize,
      fontFamily: theme.fontFamily,
      dark: isDarkColor(theme.gridColor),
    })
    if (areaGroup) children.push(areaGroup)

    children.push(group({ key: 'series', children: [...barNodes, ...labelNodes] }))

    // ============ markLine 标线（横向柱图时坐标系转置：值轴在水平方向） ============
    const markGroup = buildMarkLineNodes({
      items: prepared.map((p) => ({
        markLines: p.markLines,
        color: this.solidColor(p.color),
        scaleValue: (v: number) => (p.isLine && p.series.yAxisIndex === 1 && valScale2 ? valScale2 : valScale).scale(v),
      })),
      valueOnY: !horizontal,
      catAt: (i) => catScale.center(i),
      plotX,
      plotY,
      plotW,
      plotH,
      fontSize: theme.fontSize,
      fontFamily: theme.fontFamily,
      dark: isDarkColor(theme.gridColor),
    })
    if (markGroup) children.push(markGroup)

    // ============ markPoint 标注点（max/min/固定点，水滴 pin 造型，画在标线之上） ============
    const markPointGroup = buildMarkPointNodes({
      items: prepared
        .filter((p) => !p.isLine)
        .map((p) => ({
          points: p.markPoints,
          color: this.solidColor(p.color),
          scaleValue: (v: number) => valScale.scale(v),
          catAt: (i: number) => catScale.center(i),
        })),
      fontSize: theme.fontSize,
      fontFamily: theme.fontFamily,
      // 横向柱图：值轴在水平方向，pin 转置指向右侧
      transpose: horizontal,
    })
    if (markPointGroup) children.push(markPointGroup)

    // ============ dataZoom 滑条 ============
    if (zoomGeom) {
      children.push(
        buildDataZoomSlider({
          geom: zoomGeom,
          theme,
          silValues,
          visibleRange: [this.zoomer.visibleStart, this.zoomer.visibleStart + option.labels.length - 1],
          seriesColor: this.solidColor(prepared[0]?.color, theme.colors[0]),
          zoomStart: this.zoomer.start,
          zoomEnd: this.zoomer.end,
        })
      )
    }

    return group({ key: 'plot', children })
  }

  protected hitTest(x: number, y: number): number | null {
    const layout = this.layout
    if (!layout) return null
    const { pad, plotW, plotH, catScale, horizontal } = layout
    if (x < pad.left || x > pad.left + plotW || y < pad.top || y > pad.top + plotH) {
      return null
    }
    const count = catScale.labels$.length
    if (count === 0) return null
    const pos = horizontal ? y - pad.top : x - pad.left
    const index = Math.floor(pos / Math.max(1e-6, catScale.step$))
    return clamp(index, 0, count - 1)
  }

  protected getHoverInfo(index: number): HoverInfo {
    const layout = this.layout
    if (!layout) return { index, x: 0, y: 0 }
    const { plotX, plotY, plotW, plotH, catScale, valScale, valScale2, prepared, horizontal } = layout
    const center = catScale.center(index)
    if (!horizontal) {
      // 瀑布图：锚定在该类目浮动柱顶部
      if (layout.waterfallTops && layout.waterfallTops[index] != null) {
        return { index, x: r2(center), y: r2(layout.waterfallTops[index]) }
      }
      // 引导点取该类目下最高的柱顶 / 折线点（右轴线系列换算到自身轴）
      let y = plotY + plotH / 2
      let found = false
      for (const p of prepared) {
        const v = p.points[index]?.value
        if (v === null || v === undefined) continue
        const scale = p.isLine && p.series.yAxisIndex === 1 && valScale2 ? valScale2 : valScale
        const py = scale.scale(v)
        if (!found || py < y) {
          y = py
          found = true
        }
      }
      return { index, x: r2(center), y: r2(found ? y : plotY + plotH / 2) }
    }
    // 横向：引导点取该类目下离 0 基线最远的柱端
    const base0 = valScale.scale(0)
    let x = plotX + plotW / 2
    let found = false
    for (const p of prepared) {
      const v = p.points[index]?.value
      if (v === null || v === undefined) continue
      const px = valScale.scale(v)
      if (!found || Math.abs(px - base0) > Math.abs(x - base0)) {
        x = px
        found = true
      }
    }
    return { index, x: r2(found ? x : plotX + plotW / 2), y: r2(center) }
  }
}

// ============ 纯函数工具 ============

function r2(v: number): number {
  return Math.round(v * 100) / 100
}

function formatNumber(v: number): string {
  if (Number.isInteger(v)) return String(v)
  return String(Number(v.toFixed(2)))
}

/** 标签估算渲染宽度（em）：中文全角按 1、ASCII 按 0.6，取最长者 */
function labelEmWidth(labels: (string | number)[] | undefined, fallback: number): number {
  const widths = (labels ?? []).map((s) => [...String(s)].reduce((w, ch) => w + (ch.charCodeAt(0) > 0xff ? 1 : 0.6), 0))
  return Math.max(fallback, ...(widths.length ? widths : [fallback]))
}

/** 倾斜 x 轴标签需要的额外底部空间：按最长类目估算文字倾斜后的纵向投影，封顶 80px */
function rotatedLabelPad(labels: (string | number)[] | undefined, rotate: number, fontSize: number): number {
  const rad = (Math.abs(rotate) * Math.PI) / 180
  return Math.max(0, Math.min(80, Math.ceil(labelEmWidth(labels, 4) * fontSize * Math.sin(rad)) - 14))
}

/** 倾斜 x 轴标签两端出界的水平预留：最长标签的水平投影超出半个类目槽位的部分，封顶 64px */
function rotatedLabelSidePad(labels: (string | number)[] | undefined, rotate: number, fontSize: number, plotW: number): number {
  const rad = (Math.abs(rotate) * Math.PI) / 180
  const hProj = labelEmWidth(labels, 4) * fontSize * Math.cos(rad)
  const catW = plotW / Math.max(1, (labels ?? []).length || 6)
  return Math.max(0, Math.min(64, Math.ceil(hProj - catW / 2)))
}

/** 刻度标签文案：用户配置了 labelFormatter 则优先，否则内置格式 */
function axisLabelFmt(axis: KAxisOption | undefined, tick: number): string {
  return axis?.labelFormatter ? axis.labelFormatter(tick) : formatNumber(tick)
}

type RoundedEdge = 'top' | 'bottom' | 'left' | 'right'

/** 柱体几何：无圆角用 rect；barRadius 时仅生长方向前端两角圆角（对齐 ECharts borderRadius [r,r,0,0]） */
function barGeom(x: number, y: number, w: number, h: number, props: { key: string; fill: string }, radius: number | undefined, edge: RoundedEdge): SceneNode {
  const rr = radius ?? 0
  if (rr <= 0) return rect(x, y, w, h, props)
  const cap = Math.min(rr, w / 2, h / 2)
  let d: string
  if (edge === 'top') {
    d = `M${x},${y + h}L${x},${y + cap}Q${x},${y} ${x + cap},${y}L${x + w - cap},${y}Q${x + w},${y} ${x + w},${y + cap}L${x + w},${y + h}Z`
  } else if (edge === 'bottom') {
    d = `M${x},${y}L${x + w},${y}L${x + w},${y + h - cap}Q${x + w},${y + h} ${x + w - cap},${y + h}L${x + cap},${y + h}Q${x},${y + h} ${x},${y + h - cap}Z`
  } else if (edge === 'right') {
    d = `M${x},${y}L${x + w - cap},${y}Q${x + w},${y} ${x + w},${y + cap}L${x + w},${y + h - cap}Q${x + w},${y + h} ${x + w - cap},${y + h}L${x},${y + h}Z`
  } else {
    d = `M${x + cap},${y}L${x + w},${y}L${x + w},${y + h}L${x + cap},${y + h}Q${x},${y + h} ${x},${y + h - cap}L${x},${y + cap}Q${x},${y} ${x + cap},${y}Z`
  }
  return path(d, props)
}
