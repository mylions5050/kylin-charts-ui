import { BaseChart } from './base-chart'
import { BandScale, LinearScale, LogScale } from '../scale'
import { niceTicks, clamp, clamp01 } from '../utils/math'
import { isDarkColor, withAlpha } from '../utils/color'
import { normalizeData } from '../utils/series-data'
import type { NormalizedDatum } from '../utils/series-data'
import { defaultTheme, getSeriesColor } from '../theme'
import type { KChartTheme } from '../theme'
import { circle, group, path, rect, text } from '../scene/nodes'
import type { GroupNode, SceneNode } from '../scene/nodes'
import type {
  HoverInfo,
  KAxisOption,
  KColor,
  KDataZoomOption,
  KLineSeries,
  KLineSymbol,
  KMarkAreaDatum,
  Padding,
  Point,
  RenderContext,
  StepPosition,
} from '../types'
import { DataZoomController, buildDataZoomSlider } from './data-zoom'
import type { ZoomGeom } from './data-zoom'
import { buildMarkLineNodes, resolveMarkLines } from './mark-line'
import { applyAxisRange, inverseDomain, labelColorOf, labelFontSizeOf, labelStepOf, nameAnchorOf, nameColorOf, splitLineOf, splitStyleOf } from './axis-ext'
import { buildMarkPointNodes, resolveMarkPoints } from './mark-point'
import type { ResolvedMarkPoint } from './mark-point'
import { buildMarkAreaNodes } from './mark-area'
import type { ResolvedMarkArea } from './mark-area'
import type { ResolvedMarkLine } from './mark-line'

/** 轴配置（x / y 通用）：定义已迁移至 core/types，此处重导出保持既有 import 路径兼容 */
export type { KAxisOption }

/** 线条形态：直线 / 平滑 / 阶梯三种转折位置（柱形图折柱混合复用） */
export type CurveMode = 'linear' | 'smooth' | StepPosition

/** 数值参考带（如 AQI 等级区间）：在绘图区横向铺半透明色带并标注名称 */
export interface KValueBand {
  /** 带下界，缺省取轴域最小值 */
  min?: number
  /** 带上界，缺省取轴域最大值 */
  max?: number
  /** 带颜色（内部加透明度渲染，标注文字用原色） */
  color: string
  /** 带名称（如 “优” “轻度污染”），标注在带内右侧 */
  label?: string
}
/** 折线图配置（注册于 OptionMap['line']） */
export interface LineChartOption {
  /** x 轴类目标签（numericX 开启时为数值字符串，如 "0.5"） */
  labels: string[]
  /** 系列列表（data 支持裸值 / 携带配置对象双形态） */
  series: KLineSeries[]
  /** x 轴配置 */
  xAxis?: KAxisOption
  /** y 轴配置（show 同时控制网格线显隐；type='log' 启用对数轴） */
  yAxis?: KAxisOption
  /** 次数值轴（右侧）：配合系列 yAxisIndex=1 使用 */
  yAxis2?: KAxisOption
  /** 次类目轴（顶部）：展示与 x 轴相同的类目 */
  xAxis2?: KAxisOption
  /** x 轴两端对齐模式：false（缺省）首尾点贴齐轴两端（ECharts 折线惯例）；true 点落在类目带中心、两端留半步空白 */
  boundaryGap?: boolean
  /** 凹凸图：按类目把系列值转成名次（1 = 最高，画在顶端），粗线 + 全点圆点 */
  bump?: boolean
  /** 数值参考带（AQI 可视化等场景） */
  valueBands?: KValueBand[]
  /** 分段着色（对齐 ECharts visualMap-piecewise）：按数值区间给折线分段着色，min 为开区间下界、max 为闭区间上界，并在右侧绘制分段图例 */
  visualPieces?: KValueBand[]
  /** dataZoom 缩放（对齐 ECharts dataZoom）：true 全域窗口；对象可指定 start/end 百分比，slider / inside 可分别开关（inside 为绘图区滚轮缩放 + 拖拽平移）。垂直折线暂不支持 */
  dataZoom?: boolean | KDataZoomOption
  /** 默认符号点（ECharts 同款 emptyCircle）；false 时不常驻展示，悬停仍出现强调点（如 AQI 密集数据） */
  showSymbol?: boolean
  /** 数值 x 轴：labels 为数值字符串，x 轴按线性比例尺取刻度（函数绘图 / 双数值轴） */
  numericX?: boolean
  /** 垂直折线图：类目轴在 y（自下而上）、数值轴在 x，整体由水平图翻转而来 */
  vertical?: boolean
  /** 主题覆盖 */
  theme?: Partial<KChartTheme>
  /** 画布内边距覆盖 */
  padding?: Partial<Padding>
  /** 空数据提示文案 */
  emptyText?: string
}

/** 归一化后的系列（绘制与命中检测共用的内部模型） */
interface PreparedSeries {
  series: KLineSeries
  points: NormalizedDatum[]
  /** 系列颜色：纯色或渐变配置（渐变在绘制时经 resolvePaint 转 url 引用） */
  color: KColor
  /** 堆叠基线：本系列累加前各类目的累计值（堆叠面积下边缘） */
  base?: number[]
  /** 标线（基于全量数据预解析，不随缩放窗口重算） */
  markLines: ResolvedMarkLine[]
  /** 标注点（max/min/固定点，基于全量数据预解析） */
  markPoints: ResolvedMarkPoint[]
  /** 标域数据（像素解析在渲染时做，需要比例尺就位） */
  markAreas: KMarkAreaDatum[]
}

/** 带索引的路径点（堆叠面积回描基线时需要知道每个点对应的类目下标） */
interface SegPoint extends Point {
  i: number
  /** 原始数值（分段着色按值判属 piece） */
  v: number
}

interface Layout {
  pad: Padding
  plotX: number
  plotY: number
  plotW: number
  plotH: number
  xScale: BandScale
  /** 数值 x 轴（numericX） */
  xLinear: LinearScale | null
  xNums: number[] | null
  yScale: LinearScale | LogScale
  y2Scale: LinearScale | null
  theme: KChartTheme
  prepared: PreparedSeries[]
  /** 首尾点是否贴齐轴两端（决定 hitTest 用 round 还是 floor） */
  edgeAligned: boolean
  /** 垂直模式翻转参数（原始画布宽高），非垂直为 null */
  vertical: { w: number; h: number } | null
  /** dataZoom 滑条几何，未启用为 null */
  zoom: ZoomGeom | null
}

const DEFAULT_PADDING: Padding = { top: 24, right: 24, bottom: 36, left: 44 }

/**
 * 折线图
 * 支持：多系列、平滑曲线（Catmull-Rom）、面积填充、堆叠折线/面积、凹凸图、数值参考带（AQI）、
 * 多 x/y 轴、数值 x 轴（函数绘图/双数值轴）、对数轴、垂直折线、null 断点分段、
 * 点级颜色与标签、从左向右入场揭示动画、悬停十字线 + 高亮点。
 */
export class LineChart extends BaseChart<LineChartOption> {
private layout: Layout | null = null
  /** dataZoom 滑条控制器（切片 / 滑条渲染 / 拖拽交互共用，直角坐标系共享能力） */
  private zoomer: DataZoomController
  /** 悬停强调点缩放动画：0（消失）~ 1（完全放大） */
  private hoverEase = 0
  private hoverAnimTarget = 0
  private hoverAnimFrom = 0
  private hoverAnimStart = 0
  private hoverAnimRaf: number | null = null
  /** 最后一次悬停的数据下标（缩回动画期间仍需知道画在哪） */
  private lastHoverIndex: number | null = null

  constructor(container: HTMLElement, option: LineChartOption) {
    super(container, option)
    this.zoomer = new DataZoomController(this.renderer, () => this.render())
  }

  /** 当前可视窗口的起始数据下标（组件层 tooltip 全局索引换算用） */
  getVisibleStart(): number {
    return this.zoomer.visibleStart
  }

  /** 悬停强调点出现 / 消失的缓动动画（easeOutCubic，160ms），动画期间逐帧重渲染 */
  private tickHoverAnim = (): void => {
    const t = Math.min(1, (performance.now() - this.hoverAnimStart) / 160)
    const eased = 1 - Math.pow(1 - t, 3)
    this.hoverEase = this.hoverAnimFrom + (this.hoverAnimTarget - this.hoverAnimFrom) * eased
    if (t < 1) {
      this.hoverAnimRaf = requestAnimationFrame(this.tickHoverAnim)
    } else {
      this.hoverEase = this.hoverAnimTarget
      this.hoverAnimRaf = null
    }
    this.render()
  }

  /** 在 build 内调用：监测悬停目标变化，必要时启动出现 / 消失动画；返回当前缓动值 */
  private updateHoverAnim(hoverIndex: number | null): number {
    if (hoverIndex !== null) this.lastHoverIndex = hoverIndex
    const target = hoverIndex !== null ? 1 : 0
    if (target !== this.hoverAnimTarget) {
      this.hoverAnimFrom = this.hoverEase
      this.hoverAnimStart = performance.now()
      this.hoverAnimTarget = target
      if (this.hoverAnimRaf === null) {
        this.hoverAnimRaf = requestAnimationFrame(this.tickHoverAnim)
      }
    }
    return this.hoverEase
  }

  protected build(option: LineChartOption, ctx: RenderContext): GroupNode {
    // 垂直折线：在交换宽高的画布上按水平逻辑构图，再对场景图做转置 + 双镜像翻转
    if (option.vertical) {
      const swappedCtx: RenderContext = { ...ctx, width: ctx.height, height: ctx.width }
      const rotated = this.buildPlot({ ...option, vertical: false }, swappedCtx)
      // 回填翻转参数（hitTest / getHoverInfo 的坐标换算需要原始画布宽高）
      if (this.layout) this.layout = { ...this.layout, vertical: { w: ctx.width, h: ctx.height } }
      return flipGraph(rotated, ctx.width, ctx.height) as GroupNode
    }
    return this.buildPlot(option, ctx)
  }

  private buildPlot(option: LineChartOption, ctx: RenderContext): GroupNode {
    const theme: KChartTheme = { ...defaultTheme, ...option.theme }

    // 着色辅助：paint 支持渐变（url 引用）；solid 提取纯色（图例/hover/透明度运算场景）
    const paint = (c: KColor | undefined, fallback?: string): string => this.resolvePaint(c, fallback)
    const solid = (c: KColor | undefined, fallback?: string): string => this.solidColor(c, fallback)

    // ============ markLine / markPoint 解析（基于全量数据：均值/阈值/极值不随缩放窗口变化） ============
    const fullMarkLines = option.series.map((s) => resolveMarkLines(s, option.labels))
    const fullMarkPoints = option.series.map((s) => resolveMarkPoints(s, option.labels))

    // ============ dataZoom：解析窗口并切片（滑条 + inside 滚轮缩放共用同一切片；窗口为全域时仅出滑条不切片） ============
    const zoomCfg = this.zoomer.resolve(option.dataZoom, !!option.vertical, option.labels.length)
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
    } else {
      this.zoomer.resetWindow()
    }

    // ============ 数据归一化（双形态 → 统一模型） ============
    const prepared: PreparedSeries[] = option.series.map((s, si) => ({
      series: s,
      points: normalizeData(s.data),
      // 用户色（纯色或渐变）优先；渐变时不走 getSeriesColor（其仅接受纯色缺省）
      color: s.color ?? getSeriesColor(theme.colors, si),
      markLines: fullMarkLines[si] ?? [],
      markPoints: fullMarkPoints[si] ?? [],
      markAreas: Array.isArray(s.markArea) ? s.markArea : (s.markArea?.data ?? []),
    }))

    // ============ 堆叠变换：相同 stack 的系列按系列顺序逐类目累加 ============
    // 须在 allValues（y 轴范围依据）之前执行，累计值才能纳入轴范围
    const labelCount = option.labels.length
    if (!option.bump) {
      const cursors = new Map<string, number[]>()
      prepared.forEach((p) => {
        const sk = p.series.stack
        if (!sk) return
        const cur = cursors.get(sk) ?? new Array<number>(labelCount).fill(0)
        p.base = [...cur]
        p.points = p.points.map((d, i) => {
          if (d.value === null) return d
          cur[i] += d.value
          return { ...d, value: cur[i] }
        })
        cursors.set(sk, cur)
      })
    }

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
            anchor: 'middle',
            fontSize: 14,
            fill: theme.emptyColor,
            fontFamily: theme.fontFamily,
          }),
        ],
      })
    }

    // ============ 凹凸图变换：按类目把值转成名次（1 = 最高） ============
    let bumpTicks: number[] | null = null
    if (option.bump) {
      const rankMax = Math.max(2, prepared.length)
      for (let i = 0; i < labelCount; i++) {
        const ranked = prepared
          .map((p, si) => ({ si, v: p.points[i]?.value }))
          .filter((d): d is { si: number; v: number } => typeof d.v === 'number')
          .sort((a, b) => b.v - a.v)
        ranked.forEach((d, rank) => {
          prepared[d.si].points[i] = { ...prepared[d.si].points[i], value: rank + 1 }
        })
      }
      bumpTicks = []
      for (let r = 1; r <= rankMax; r++) bumpTicks.push(r)
    }

    // ============ 多 y 轴判定（凹凸图不参与） ============
    const useRight = !option.bump && prepared.some((p) => p.series.yAxisIndex === 1)

    // ============ 内边距：轴名称 / 次轴各占一行一列 ============
    const pad: Padding = { ...DEFAULT_PADDING, ...option.padding }
    if (option.xAxis?.name) pad.bottom += 16
    // 倾斜的 x 轴标签需要更多底部空间（按最长类目估算，封顶 48px）
    const xRotate = option.xAxis?.labelRotate ?? 0
    if (xRotate) {
      pad.bottom += rotatedLabelPad(option.labels, xRotate, theme.fontSize)
      // "/" 形首个标签向左出界、"\" 形末个标签向右出界：按水平投影预留对应侧 pad（封顶 48px）
      const side = rotatedLabelSidePad(option.labels, xRotate, theme.fontSize, ctx.width - pad.left - pad.right)
      if (xRotate > 0) pad.left += side
      else pad.right += side
    }
    if (useRight && option.yAxis2?.show !== false) pad.right += 36
    if (option.xAxis2 && option.xAxis2.show !== false) pad.top += option.xAxis2.name ? 34 : 18
    // 分段着色图例占右侧一列（对齐 ECharts visualMap 位置）
    if (option.visualPieces?.length) pad.right += 68
    // dataZoom 滑条占底部一行
    if (zoomActive) pad.bottom += 44
    const plotX = pad.left
    const plotY = pad.top
    const plotW = Math.max(0, ctx.width - pad.left - pad.right)
    const plotH = Math.max(0, ctx.height - pad.top - pad.bottom)

    // ============ dataZoom 滑条几何（渲染与拖拽命中共用）；inside 模式记录绘图区供滚轮缩放 / 拖拽平移命中 ============
    const zoomGeom = zoomActive ? this.zoomer.buildGeom(pad.left, ctx.height - 24, plotW) : null
    this.zoomer.setPlotRect(zoomCfg?.inside ? { x: plotX, y: plotY, w: plotW, h: plotH } : null)

    // ============ x 比例尺（类目带 / 数值线性二选一） ============
    const boundaryGap = option.boundaryGap ?? false
    const numericX = !!option.numericX && !option.vertical
    const edgeAligned = !boundaryGap && !numericX && labelCount > 1
    let xScale: BandScale
    if (edgeAligned) {
      // 贴边模式：把类目带向外扩半个 step，使 center(0)=plotX、center(n-1)=plotX+plotW
      const step = plotW / Math.max(1, labelCount - 1)
      xScale = new BandScale(option.labels, [plotX - step / 2, plotX + plotW + step / 2])
    } else {
      xScale = new BandScale(option.labels, [plotX, plotX + plotW])
    }
    let xLinear: LinearScale | null = null
    let xNums: number[] | null = null
    let xTicks: number[] | null = null
    if (numericX) {
      xNums = option.labels.map((s) => Number(s))
      const xt = applyAxisRange(niceTicks(Math.min(...xNums), Math.max(...xNums), 5), option.xAxis)
      xLinear = new LinearScale(inverseDomain(xt.min, xt.max, option.xAxis), [plotX, plotX + plotW])
      xTicks = xt.ticks
    }
    /** 第 i 个数据点的 x 像素坐标（两条路径统一入口） */
    const xAt = (i: number): number => (xNums && xLinear ? xLinear.scale(xNums[i]) : xScale.center(i))

    // ============ y 比例尺（线性 / 凹凸名次 / 对数三选一） ============
    let yScale: LinearScale | LogScale
    let yTicks: number[]
    let yDomainMin: number
    let yDomainMax: number
    if (option.bump) {
      const rankMax = Math.max(2, prepared.length)
      yScale = new LinearScale([rankMax, 1], [plotY + plotH, plotY]) // 名次 1 画在顶端
      yTicks = bumpTicks!
      yDomainMin = 1
      yDomainMax = rankMax
    } else if (option.yAxis?.type === 'log') {
      const positives = allValues.filter((v) => v > 0)
      if (positives.length > 0) {
        const d0 = Math.pow(10, Math.floor(Math.log10(Math.min(...positives))))
        const d1 = Math.pow(10, Math.ceil(Math.log10(Math.max(...allValues))))
        const ls = new LogScale([d0, d1], [plotY + plotH, plotY])
        yScale = ls
        yTicks = ls.ticks()
        yDomainMin = d0
        yDomainMax = d1
      } else {
        // 无正值兜底：退回线性轴
        const rawMin = Math.min(...allValues)
        const rawMax = Math.max(...allValues)
        const tr = niceTicks(rawMin > 0 ? 0 : rawMin, rawMax, 5)
        yScale = new LinearScale([tr.min, tr.max], [plotY + plotH, plotY])
        yTicks = tr.ticks
        yDomainMin = tr.min
        yDomainMax = tr.max
      }
    } else {
      const rawMin = Math.min(...allValues)
      const rawMax = Math.max(...allValues)
      // 业务数据默认含 0 基线，避免波动被放大
      const domainMin = rawMin > 0 ? 0 : rawMin
      const tr = applyAxisRange(niceTicks(domainMin, rawMax, 5), option.yAxis)
      yScale = new LinearScale(inverseDomain(tr.min, tr.max, option.yAxis), [plotY + plotH, plotY])
      yTicks = tr.ticks
      yDomainMin = tr.min
      yDomainMax = tr.max
    }

    // ============ 次 y 比例尺（右轴，独立 0 基线域） ============
    let y2Scale: LinearScale | null = null
    if (useRight) {
      const rightValues = prepared
        .filter((p) => p.series.yAxisIndex === 1)
        .flatMap((p) => p.points)
        .map((d) => d.value)
        .filter((v): v is number => v !== null)
      if (rightValues.length > 0) {
        const rMin = Math.min(...rightValues)
        const rMax = Math.max(...rightValues)
        const tr2 = applyAxisRange(niceTicks(rMin > 0 ? 0 : rMin, rMax, 5), option.yAxis2)
        y2Scale = new LinearScale(inverseDomain(tr2.min, tr2.max, option.yAxis2), [plotY + plotH, plotY])
      }
    }

    this.layout = {
      pad,
      plotX,
      plotY,
      plotW,
      plotH,
      xScale,
      xLinear,
      xNums,
      yScale,
      y2Scale,
      theme,
      prepared,
      edgeAligned,
      vertical: null,
      zoom: zoomGeom,
    }

    /** 系列所属数值轴（yAxisIndex=1 且右轴可用时走右轴） */
    const scaleOf = (p: PreparedSeries): LinearScale | LogScale =>
      p.series.yAxisIndex === 1 && y2Scale ? y2Scale : yScale

    const children: GroupNode['children'] = []

    // ============ 数值参考带（AQI 等级色带，铺在最底层） ============
    if (option.valueBands?.length) {
      const bandNodes: GroupNode['children'] = []
      option.valueBands.forEach((b, bi) => {
        const top = clamp(yScale.scale(b.max ?? yDomainMax), plotY, plotY + plotH)
        const bottom = clamp(yScale.scale(b.min ?? yDomainMin), plotY, plotY + plotH)
        if (bottom - top < 0.5) return
        bandNodes.push(
          rect(plotX, r2(top), r2(plotW), r2(bottom - top), {
            key: `band/${bi}`,
            fill: withAlpha(b.color, 0.14),
          })
        )
        if (b.label) {
          bandNodes.push(
            text(plotX + plotW - 8, r2((top + bottom) / 2 + theme.fontSize / 2 - 1), b.label, {
              key: `bandlabel/${bi}`,
              anchor: 'end',
              fontSize: theme.fontSize,
              fontWeight: 600,
              fill: b.color,
              fontFamily: theme.fontFamily,
            })
          )
        }
      })
      children.push(group({ key: 'bands', children: bandNodes }))
    }

    // ============ 网格线 + Y 轴（对齐 ECharts：网格线隶属 y 轴 splitLine） ============
    const showXAxis = option.xAxis?.show ?? true
    const showYAxis = option.yAxis?.show ?? true
    const gridNodes: GroupNode['children'] = []
    const yLabelNodes: GroupNode['children'] = []
    const yTickNodes: GroupNode['children'] = []
    if (showYAxis) {
      const showGrid = splitLineOf(option.yAxis)
      const gridStyle = splitStyleOf(option.yAxis)
      for (const tick of yTicks) {
        const y = r2(yScale.scale(tick))
        if (showGrid) {
          gridNodes.push(
            path(`M${plotX},${y}L${plotX + plotW},${y}`, {
              key: `grid/${tick}`,
              stroke: gridStyle.color ?? theme.gridColor,
              strokeWidth: 1,
              dash: gridStyle.dash,
            })
          )
        }
        yLabelNodes.push(
          text(plotX - 8, y + labelFontSizeOf(option.yAxis, theme.fontSize) / 2 - 1, axisLabelFmt(option.yAxis, tick), {
            key: `ylabel/${tick}`,
            anchor: 'end',
            fontSize: labelFontSizeOf(option.yAxis, theme.fontSize),
            fill: labelColorOf(option.yAxis, theme.textColor),
            fontFamily: theme.fontFamily,
          })
        )
        // y 轴刻度短线（向外 5px，对齐 x 轴刻度规格）
        yTickNodes.push(
          path(`M${plotX},${y}L${plotX - 5},${y}`, {
            key: `ytick/${tick}`,
            stroke: theme.axisLineColor,
            strokeWidth: 1,
          })
        )
      }
    }
    children.push(group({ key: 'grid', children: gridNodes }))

    // ============ 轴线（对齐 ECharts 基础样式：双轴线清晰可见） ============
    const axisBottom = plotY + plotH
    if (showXAxis) {
      children.push(
        path(`M${plotX},${axisBottom}L${plotX + plotW},${axisBottom}`, {
          key: 'axis/x',
          stroke: theme.axisLineColor,
          strokeWidth: 1,
        })
      )
    }
    if (showYAxis) {
      children.push(
        path(`M${plotX},${plotY}L${plotX},${axisBottom}`, {
          key: 'axis/y',
          stroke: theme.axisLineColor,
          strokeWidth: 1,
        })
      )
    }

    // ============ 右轴（次数值轴：轴线 + 刻度 + 标签 + 名称） ============
    if (y2Scale && option.yAxis2?.show !== false) {
      for (const tick of niceTicksOf(y2Scale)) {
        const ty = r2(y2Scale.scale(tick))
        yLabelNodes.push(
          text(plotX + plotW + 8, ty + labelFontSizeOf(option.yAxis2, theme.fontSize) / 2 - 1, axisLabelFmt(option.yAxis2, tick), {
            key: `y2label/${tick}`,
            anchor: 'start',
            fontSize: labelFontSizeOf(option.yAxis2, theme.fontSize),
            fill: labelColorOf(option.yAxis2, theme.textColor),
            fontFamily: theme.fontFamily,
          })
        )
        yTickNodes.push(
          path(`M${plotX + plotW},${ty}L${plotX + plotW + 5},${ty}`, {
            key: `y2tick/${tick}`,
            stroke: theme.axisLineColor,
            strokeWidth: 1,
          })
        )
      }
      children.push(
        path(`M${plotX + plotW},${plotY}L${plotX + plotW},${axisBottom}`, {
          key: 'axis/y2',
          stroke: theme.axisLineColor,
          strokeWidth: 1,
        })
      )
      if (option.yAxis2?.name) {
        yLabelNodes.push(
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

    // ============ X 轴标签 + 刻度（按宽度抽稀，刻度随标签走） ============
    const maxVisible = Math.max(2, Math.floor(plotW / 64))
    const labelStep = labelStepOf(option.xAxis, Math.ceil(labelCount / maxVisible))
    // 末尾强制显示最后一个标签时，若它与前一个整步标签间距不足则会重叠，
    // 此时丢弃前一个整步标签（与 ECharts interval + showLastLabel 行为一致）
    const lastIndex = labelCount - 1
    const lastMultiple = Math.floor(lastIndex / labelStep) * labelStep
    const dropLastMultiple =
      lastIndex % labelStep !== 0 && lastIndex - lastMultiple < labelStep && lastMultiple !== 0
    const xLabelNodes: GroupNode['children'] = []
    const xTickNodes: GroupNode['children'] = []
    if (showXAxis) {
      if (numericX && xTicks && xLinear) {
        // 数值 x 轴：按 niceTicks 刻度出标签
        for (const tick of xTicks) {
          const cx = r2(xLinear.scale(tick))
          xLabelNodes.push(
            text(cx, axisBottom + 20, axisLabelFmt(option.xAxis, tick), {
              key: `xlabel/${tick}`,
              anchor: xRotate ? (xRotate > 0 ? 'end' : 'start') : 'middle',
              rotate: xRotate ? -xRotate : undefined,
              fontSize: labelFontSizeOf(option.xAxis, theme.fontSize),
              fill: labelColorOf(option.xAxis, theme.textColor),
              fontFamily: theme.fontFamily,
            })
          )
          xTickNodes.push(
            path(`M${cx},${axisBottom}L${cx},${axisBottom + 5}`, {
              key: `xtick/${tick}`,
              stroke: theme.axisLineColor,
              strokeWidth: 1,
            })
          )
        }
      } else {
        for (let i = 0; i < labelCount; i++) {
          if (i % labelStep !== 0 && i !== lastIndex) continue
          if (dropLastMultiple && i === lastMultiple) continue
          const cx = r2(xScale.center(i))
          xLabelNodes.push(
            text(cx, axisBottom + (xRotate ? 14 : 20), option.labels[i], {
              key: `xlabel/${i}`,
              anchor: xRotate ? (xRotate > 0 ? 'end' : 'start') : 'middle',
              rotate: xRotate ? -xRotate : undefined,
              fontSize: labelFontSizeOf(option.xAxis, theme.fontSize),
              fill: labelColorOf(option.xAxis, theme.textColor),
              fontFamily: theme.fontFamily,
            })
          )
          xTickNodes.push(
            path(`M${cx},${axisBottom}L${cx},${axisBottom + 5}`, {
              key: `xtick/${i}`,
              stroke: theme.axisLineColor,
              strokeWidth: 1,
            })
          )
        }
      }
      // 轴名称（对齐 ECharts nameLocation：end 末端 / start 起点 / middle 居中；nameGap 控制与轴距）
      if (option.xAxis?.name) {
        const loc = nameAnchorOf(option.xAxis)
        const gap = option.xAxis?.nameGap ?? 36
        xLabelNodes.push(
          text(loc === 'end' ? plotX + plotW : loc === 'start' ? plotX : plotX + plotW / 2, axisBottom + gap, option.xAxis.name, {
            key: 'xname',
            anchor: loc === 'end' ? 'end' : loc === 'start' ? 'start' : 'middle',
            fontSize: theme.fontSize,
            fill: nameColorOf(option.xAxis, theme.textColor),
            fontFamily: theme.fontFamily,
          })
        )
      }
    }
    if (showYAxis && option.yAxis?.name) {
      const loc = nameAnchorOf(option.yAxis)
      const gap = option.yAxis?.nameGap ?? 10
      // y 轴名：end 缺省顶部左侧 / start 底部左侧 / middle 居中（旋转 90° 竖排，对齐 ECharts）
      yLabelNodes.push(
        text(loc === 'end' ? plotX - 8 : loc === 'start' ? plotX - 8 : plotX - 14, loc === 'end' ? plotY - gap : loc === 'start' ? axisBottom + gap + theme.fontSize : plotY + plotH / 2 + theme.fontSize / 2, option.yAxis.name, {
          key: 'yname',
          anchor: loc === 'middle' ? 'middle' : 'start',
          rotate: loc === 'middle' ? -90 : undefined,
          fontSize: theme.fontSize,
          fill: nameColorOf(option.yAxis, theme.textColor),
          fontFamily: theme.fontFamily,
        })
      )
    }
    children.push(group({ key: 'xlabel', children: xLabelNodes }))
    children.push(group({ key: 'xtick', children: xTickNodes }))
    children.push(group({ key: 'ylabel', children: yLabelNodes }))
    children.push(group({ key: 'ytick', children: yTickNodes }))

    // ============ 顶部次类目轴（多 x 轴：与 x 轴共用类目） ============
    if (option.xAxis2 && option.xAxis2.show !== false) {
      const x2LabelNodes: GroupNode['children'] = []
      const x2TickNodes: GroupNode['children'] = []
      for (let i = 0; i < labelCount; i++) {
        if (i % labelStep !== 0 && i !== lastIndex) continue
        if (dropLastMultiple && i === lastMultiple) continue
        const cx = r2(xAt(i))
        x2LabelNodes.push(
          text(cx, plotY - 8, option.labels[i], {
            key: `x2label/${i}`,
            anchor: 'middle',
            fontSize: theme.fontSize,
            fill: theme.textColor,
            fontFamily: theme.fontFamily,
          })
        )
        x2TickNodes.push(
          path(`M${cx},${plotY}L${cx},${plotY - 5}`, {
            key: `x2tick/${i}`,
            stroke: theme.axisLineColor,
            strokeWidth: 1,
          })
        )
      }
      if (option.xAxis2.name) {
        x2LabelNodes.push(
          text(plotX + plotW, plotY - 24, option.xAxis2.name, {
            key: 'x2name',
            anchor: 'end',
            fontSize: theme.fontSize,
            fill: theme.textColor,
            fontFamily: theme.fontFamily,
          })
        )
      }
      children.push(
        path(`M${plotX},${plotY}L${plotX + plotW},${plotY}`, {
          key: 'axis/x2',
          stroke: theme.axisLineColor,
          strokeWidth: 1,
        })
      )
      children.push(group({ key: 'x2label', children: x2LabelNodes }))
      children.push(group({ key: 'x2tick', children: x2TickNodes }))
    }

    // ============ 分段着色图例（对齐 ECharts visualMap-piecewise：右侧竖排色块 + 区间文本） ============
    if (option.visualPieces?.length) {
      const vLegendNodes: GroupNode['children'] = []
      option.visualPieces.forEach((piece, pi) => {
        const ly = plotY + 4 + pi * 24
        vLegendNodes.push(
          rect(plotX + plotW + 14, ly, 16, 10, {
            key: `vlegend/swatch/${pi}`,
            radius: 2,
            fill: piece.color,
          })
        )
        vLegendNodes.push(
          text(plotX + plotW + 36, ly + 9, formatPieceLabel(piece), {
            key: `vlegend/text/${pi}`,
            anchor: 'start',
            fontSize: theme.fontSize,
            fill: theme.textColor,
            fontFamily: theme.fontFamily,
          })
        )
      })
      children.push(group({ key: 'vlegend', children: vLegendNodes }))
    }

    // ============ 系列（面积 → 折线 → 悬停高亮点 → 点级标签） ============
    const hoverEase = this.updateHoverAnim(ctx.hoverIndex)
    const entranceCutoff = plotX + plotW * ctx.progress
    const lineNodes: GroupNode['children'] = []
    const dotNodes: GroupNode['children'] = []
    const labelNodes: GroupNode['children'] = []

    prepared.forEach((p, si) => {
      const scale = scaleOf(p)
      // 数据点 → 像素坐标（null 断点切分；SegPoint 附带类目下标供堆叠面积回描基线）
      const segments = splitSegments(p.points, labelCount, (i, v) => ({
        x: xAt(i),
        y: scale.scale(v),
      }))

      for (let gi = 0; gi < segments.length; gi++) {
        const seg = segments[gi]
        const pts = clipByX(seg, entranceCutoff)
        if (pts.length === 0) continue

        const curveMode = resolveCurveMode(p.series)

        // 分段着色：按 visualPieces 在 piece 边界处插值切分线段，同色子段合并为一条 path
        if (option.visualPieces?.length && seg.length >= 2) {
          const runs = buildPiecePaths(seg, option.visualPieces, curveMode)
          runs.forEach((run, ri) => {
            lineNodes.push(
              path(run.d, {
                key: `pline/${si}/${gi}/${ri}`,
                stroke: run.color,
                strokeWidth: 2,
                opacity: clamp01(ctx.progress * 2),
              })
            )
          })
          continue
        }

        if (p.series.area && !option.bump && pts.length >= 2) {
          if (p.base) {
            // 堆叠面积：下边缘沿上一系列的累计线回描（不做揭示裁剪，整体淡入）
            const topPts = seg.map((pt) => ({ x: pt.x, y: pt.y }))
            const basePts = [...seg]
              .reverse()
              .map((pt) => ({ x: pt.x, y: scale.scale(p.base![pt.i] ?? 0) }))
            const d =
              toPath(topPts, curveMode) +
              basePts.map((pt) => `L${r2(pt.x)},${r2(pt.y)}`).join('') +
              'Z'
            lineNodes.push(
              path(d, {
                key: `area/${si}/${gi}`,
                // 纯色叠透明度；渐变原样引用（透明度由用户在 colorStops 中自带）
                fill: typeof p.color === 'string' ? withAlpha(p.color, 0.16) : paint(p.color),
                opacity: clamp01(ctx.progress * 2),
              })
            )
          } else {
            const baseY = plotY + plotH
            // 上边缘随系列形态（直线/平滑/阶梯），下边缘直接闭合到基线
            const areaPath = toPath(pts, curveMode)
            const last = pts[pts.length - 1]
            lineNodes.push(
              path(`${areaPath}L${r2(last.x)},${r2(baseY)}L${r2(pts[0].x)},${r2(baseY)}Z`, {
                key: `area/${si}/${gi}`,
                fill: typeof p.color === 'string' ? withAlpha(p.color, 0.12) : paint(p.color),
              })
            )
          }
        }
        lineNodes.push(
          path(option.bump ? toBumpPath(pts) : toPath(pts, curveMode), {
            key: `line/${si}/${gi}`,
            stroke: paint(p.color),
            strokeWidth: option.bump ? 5 : (p.series.lineWidth ?? 2),
            dash: !option.bump && p.series.lineType === 'dashed' ? [6, 4] : !option.bump && p.series.lineType === 'dotted' ? [2, 3] : undefined,
            lineCap: option.bump ? 'round' : undefined,
          })
        )
      }

      // 常驻数据点标签（对齐 ECharts series.label.show）：每个非空点上方常驻显示数值
      const showSeriesLabel = p.series.label === true || (typeof p.series.label === 'object' && p.series.label.show !== false)
      if (showSeriesLabel && !option.bump) {
        p.points.forEach((d, i) => {
          if (d.value === null) return
          labelNodes.push(
            text(r2(xAt(i)), r2(scale.scale(d.value)) - 10, formatNumber(d.value), {
              key: `slabel/${si}/${i}`,
              anchor: 'middle',
              fontSize: theme.fontSize,
              fill: solid(d.color ?? p.color),
              fontFamily: theme.fontFamily,
            })
          )
        })
      }

      // 自定义符号点（对齐 ECharts symbol/symbolSize/symbolRotate；showSymbol=false 或凹凸图不展示）
      if (!option.bump && option.showSymbol !== false) {
        p.points.forEach((d, i) => {
          if (d.value === null) return
          const node = symbolDot(p.series.symbol, r2(xAt(i)), r2(scale.scale(d.value)), p.series.symbolSize ?? 6, solid(d.color ?? p.color), p.series.symbolRotate ?? 0, `sym/${si}/${i}`)
          if (node) dotNodes.push(node)
        })
      }

      // 凹凸图：全量名次节点（外圈光晕 + 白描边实心点）
      if (option.bump) {
        p.points.forEach((d, i) => {
          if (d.value === null) return
          const cx = r2(xAt(i))
          const cy = r2(scale.scale(d.value))
          const dc = solid(d.color ?? p.color)
          dotNodes.push(
            circle(cx, cy, 10, {
              key: `bhalo/${si}/${i}`,
              fill: withAlpha(dc, 0.22),
            })
          )
          dotNodes.push(
            circle(cx, cy, 5, {
              key: `bdot/${si}/${i}`,
              fill: dc,
              stroke: '#FFFFFF',
              strokeWidth: 2,
            })
          )
        })
      }

      // 悬停强调点（缩放动画）+ 点级标签
      const hi = hoverEase > 0.01 ? (ctx.hoverIndex ?? this.lastHoverIndex) : null
      if (hi !== null && hi < p.points.length) {
        const datum = p.points[hi]
        if (datum.value !== null) {
          const cx = r2(xAt(hi))
          const cy = r2(scale.scale(datum.value))
          const dotColor = solid(datum.color ?? p.color)
          const rBase = option.bump ? 8 : 6
          dotNodes.push(
            circle(cx, cy, r2(3 + (rBase - 3) * hoverEase), {
              key: `dot/${si}`,
              fill: dotColor,
              stroke: '#FFFFFF',
              strokeWidth: 2,
              opacity: hoverEase,
            })
          )
          if (datum.labelShow) {
            labelNodes.push(
              text(cx, cy - 10, formatNumber(datum.value), {
                key: `label/${si}`,
                anchor: 'middle',
                fontSize: theme.fontSize,
                fontWeight: 600,
                fill: dotColor,
                fontFamily: theme.fontFamily,
              })
            )
          }
        }
      }
    })

    // ============ markArea 标域（画在系列之下：类目带区间 / 数值带区间半透明矩形） ============
    const markAreaPx: ResolvedMarkArea[] = []
    const halfStep = plotW / Math.max(1, labelCount) / 2
    prepared.forEach((p) => {
      p.markAreas.forEach((d) => {
        const vScale = scaleOf(p)
        let px1: number | undefined
        let px2: number | undefined
        if (d.xAxis !== undefined) {
          let i1 = typeof d.xAxis === 'number' ? d.xAxis : option.labels.indexOf(String(d.xAxis))
          if (i1 < 0) {
            const num = Number(d.xAxis)
            if (Number.isInteger(num) && option.labels[num] !== undefined) i1 = num
          }
          if (i1 < 0 || i1 >= labelCount) return
          px1 = xAt(i1) - halfStep
          px2 = d.xAxis2 === undefined ? px1 + halfStep * 2 : undefined
          if (px2 === undefined) {
            let i2 = typeof d.xAxis2 === 'number' ? d.xAxis2 : option.labels.indexOf(String(d.xAxis2))
            if (i2 < 0) {
              const num2 = Number(d.xAxis2)
              if (Number.isInteger(num2) && option.labels[num2] !== undefined) i2 = num2
            }
            if (i2 < 0 || i2 >= labelCount) return
            px2 = xAt(i2) + halfStep
          }
        }
        const py1 = d.yAxis !== undefined && Number.isFinite(d.yAxis) ? vScale.scale(d.yAxis) : undefined
        const py2 = d.yAxis2 !== undefined && Number.isFinite(d.yAxis2) ? vScale.scale(d.yAxis2) : undefined
        if (px1 === undefined && py1 === undefined) return
        markAreaPx.push({
          x1: px1 ?? plotX,
          x2: px2 ?? plotX + plotW,
          y1: py1 ?? plotY,
          y2: py2 ?? plotY + plotH,
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

    children.push(group({ key: 'series', children: [...lineNodes, ...dotNodes, ...labelNodes] }))

    // ============ markLine 标线（阈值/均值线 + 类目垂直线，画在系列之上） ============
    const markGroup = buildMarkLineNodes({
      items: prepared.map((p) => ({
        markLines: p.markLines,
        color: solid(p.color),
        scaleValue: (v: number) => scaleOf(p).scale(v),
      })),
      valueOnY: true,
      catAt: xAt,
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
      items: prepared.map((p) => ({
        points: p.markPoints,
        color: solid(p.color),
        scaleValue: (v: number) => scaleOf(p).scale(v),
        catAt: xAt,
      })),
      fontSize: theme.fontSize,
      fontFamily: theme.fontFamily,
    })
    if (markPointGroup) children.push(markPointGroup)

    // ============ 悬停十字参考线 ============
    if (ctx.hoverIndex !== null && ctx.hoverIndex < labelCount) {
      const hx = r2(xAt(ctx.hoverIndex))
      children.push(
        path(`M${hx},${plotY}L${hx},${axisBottom}`, {
          key: 'crosshair',
          stroke: theme.axisLineColor,
          strokeWidth: 1,
          dash: [4, 4],
        })
      )
    }

    // ============ dataZoom 滑条（窗口拖拽 / 手柄缩放 / 点击定位，交互在控制器层） ============
    if (zoomGeom) {
      children.push(
        buildDataZoomSlider({
          geom: zoomGeom,
          theme,
          silValues,
          visibleRange: [this.zoomer.visibleStart, this.zoomer.visibleStart + option.labels.length - 1],
          seriesColor: this.solidColor(option.series[0]?.color, theme.colors[0]),
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
    // 垂直模式：最终坐标 → 旋转构图坐标（x' = H - y，y' = W - x）
    let mx = x
    let my = y
    if (layout.vertical) {
      mx = layout.vertical.h - y
      my = layout.vertical.w - x
    }
    const { pad, plotW, plotH, xScale, xNums, xLinear } = layout
    if (mx < pad.left || mx > pad.left + plotW || my < pad.top || my > pad.top + plotH) {
      return null
    }
    // 数值 x 轴：取像素距离最近的采样点
    if (xNums && xLinear) {
      let best = 0
      let bestD = Infinity
      for (let i = 0; i < xNums.length; i++) {
        const d = Math.abs(xLinear.scale(xNums[i]) - mx)
        if (d < bestD) {
          bestD = d
          best = i
        }
      }
      return best
    }
    const count = xScale.labels$.length
    if (count === 0) return null
    // 贴边模式点位均匀分布，用 round 找最近点；带中心模式用 floor 定位所在类目带
    const index = layout.edgeAligned
      ? Math.round((mx - pad.left) / Math.max(1e-6, plotW / Math.max(1, count - 1)))
      : Math.floor((mx - pad.left) / Math.max(1e-6, xScale.step$))
    return clamp(index, 0, count - 1)
  }

  protected getHoverInfo(index: number): HoverInfo {
    const layout = this.layout
    if (!layout) return { index, x: 0, y: 0 }
    const { plotY, plotH, xScale, xNums, xLinear, yScale, y2Scale, prepared } = layout
    const xOf = (i: number): number => (xNums && xLinear ? xLinear.scale(xNums[i]) : xScale.center(i))
    const scaleOf = (p: PreparedSeries): LinearScale | LogScale =>
      p.series.yAxisIndex === 1 && y2Scale ? y2Scale : yScale
    let y = plotY + plotH / 2
    let found = false
    for (const p of prepared) {
      const v = p.points[index]?.value
      if (v === null || v === undefined) continue
      const py = scaleOf(p).scale(v)
      if (!found || py < y) {
        y = py
        found = true
      }
    }
    // 垂直模式：旋转构图坐标 → 最终画布坐标（x = W - y'，y = H - x'）
    if (layout.vertical) {
      const rx = r2(xOf(index))
      const ry = r2(found ? y : plotY + plotH / 2)
      return { index, x: r2(layout.vertical.w - ry), y: r2(layout.vertical.h - rx) }
    }
    return { index, x: r2(xOf(index)), y: r2(found ? y : plotY + plotH / 2) }
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

/** 刻度标签文案：用户配置了 labelFormatter 则优先，否则内置格式 */
function axisLabelFmt(axis: KAxisOption | undefined, tick: number): string {
  return axis?.labelFormatter ? axis.labelFormatter(tick) : formatNumber(tick)
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

/** 自定义符号点（对齐 ECharts symbol）：emptyCircle 白心圆环（默认）/ circle 实心 / rect / triangle / diamond / pin / arrow / none */
function symbolDot(shape: KLineSymbol | undefined, cx: number, cy: number, size: number, color: string, rotate: number, key: string): SceneNode | null {
  const r = size / 2
  if (shape === 'none') return null
  if (shape === 'circle') return circle(cx, cy, r2(r), { key, fill: color })
  if (!shape || shape === 'emptyCircle') {
    return circle(cx, cy, r2(r), { key, fill: '#FFFFFF', stroke: color, strokeWidth: 1.5 })
  }
  const rad = (rotate * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)
  const poly = (pts: [number, number][]): string =>
    pts.map(([dx, dy], i) => `${i ? 'L' : 'M'}${r2(cx + dx * cos - dy * sin)},${r2(cy + dx * sin + dy * cos)}`).join('') + 'Z'
  let d: string
  if (shape === 'rect') {
    const h = r * 0.72
    d = poly([[-h, -h], [h, -h], [h, h], [-h, h]])
  } else if (shape === 'triangle') {
    d = poly([[0, -r], [r * 0.9, r * 0.72], [-r * 0.9, r * 0.72]])
  } else if (shape === 'diamond') {
    d = poly([[0, -r], [r * 0.78, 0], [0, r], [-r * 0.78, 0]])
  } else if (shape === 'arrow') {
    // 向上箭头（尾部带凹口），symbolRotate 可旋转指向
    d = poly([[0, -r], [r * 0.85, r * 0.5], [0, r * 0.1], [-r * 0.85, r * 0.5]])
  } else {
    // pin：圆头 + 下尖端（地图钉），旋转不改变头部圆形故不生效
    const hr = r * 0.6
    const yc = cy - r * 0.2
    const tipY = cy + r * 0.9
    d = `M${r2(cx)},${r2(tipY)}L${r2(cx + hr * 0.82)},${r2(yc + hr * 0.57)}A${r2(hr)},${r2(hr)} 0 1 0 ${r2(cx - hr * 0.82)},${r2(yc + hr * 0.57)}Z`
  }
  return path(d, { key, fill: color })
}

/** 倾斜 x 轴标签两端出界的水平预留：最长标签的水平投影超出半个类目槽位的部分，封顶 64px */
function rotatedLabelSidePad(labels: (string | number)[] | undefined, rotate: number, fontSize: number, plotW: number): number {
  const rad = (Math.abs(rotate) * Math.PI) / 180
  const hProj = labelEmWidth(labels, 4) * fontSize * Math.cos(rad)
  const catW = plotW / Math.max(1, (labels ?? []).length || 6)
  return Math.max(0, Math.min(64, Math.ceil(hProj - catW / 2)))
}

/** 从线性/对数比例尺取刻度列表（右轴复用 y 轴刻度逻辑） */
function niceTicksOf(scale: LinearScale | LogScale): number[] {
  if (scale instanceof LogScale) return scale.ticks()
  const [d0, d1] = scale.domain$
  return niceTicks(d0, d1, 5).ticks
}

/** 值所属 piece 的颜色（对齐 ECharts 语义：min 开区间、max 闭区间） */
function pieceColorOf(v: number, pieces: KValueBand[]): string | null {
  for (const p of pieces) {
    if ((p.min === undefined || v > p.min) && (p.max === undefined || v <= p.max)) return p.color
  }
  return null
}

/** piece 区间文本（图例用）：0 - 50 / 50 - 100 / 300 + */
function formatPieceLabel(piece: KValueBand): string {
  const lo = piece.min !== undefined ? String(piece.min) : ''
  const hi = piece.max !== undefined ? String(piece.max) : '+'
  return `${lo} - ${hi}`
}

/**
 * 分段着色路径生成：相邻点连线跨越 piece 边界时按线性插值切分，
 * 再把同色相邻子段合并为一条 path（保证边界处颜色切换平滑无缝）
 */
function buildPiecePaths(
  seg: SegPoint[],
  pieces: KValueBand[],
  mode: CurveMode
): Array<{ d: string; color: string }> {
  // 收集全部 piece 边界值
  const bounds: number[] = []
  pieces.forEach((p) => {
    if (p.min !== undefined) bounds.push(p.min)
    if (p.max !== undefined) bounds.push(p.max)
  })
  const out: Array<{ d: string; color: string }> = []
  let curColor: string | null = null
  let curPts: Point[] = []
  const flush = () => {
    if (curColor && curPts.length >= 2) out.push({ d: toPath(curPts, mode), color: curColor })
    curPts = []
    curColor = null
  }
  for (let i = 0; i < seg.length - 1; i++) {
    const a = seg[i]
    const b = seg[i + 1]
    // 相邻两点值之间的边界（升序），逐个线性插值出切分点
    const lo = Math.min(a.v, b.v)
    const hi = Math.max(a.v, b.v)
    const bs = bounds.filter((bd) => bd > lo && bd < hi).sort((x, y) => x - y)
    const nodes: Array<{ x: number; y: number; v: number }> = [a]
    for (const bd of bs) {
      const t = (bd - a.v) / (b.v - a.v)
      nodes.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, v: bd })
    }
    nodes.push(b)
    for (let k = 0; k < nodes.length - 1; k++) {
      const s = nodes[k]
      const e = nodes[k + 1]
      // 子段颜色取中点值所属 piece（子段不跨边界，中点判属即整段归属）
      const color = pieceColorOf((s.v + e.v) / 2, pieces)
      if (color === null) continue
      if (color !== curColor) {
        flush()
        curColor = color
        curPts = [{ x: s.x, y: s.y }]
      }
      curPts.push({ x: e.x, y: e.y })
    }
  }
  flush()
  return out
}

/** 按索引把归一化数据切分成由连续非 null 值组成的坐标段（附类目下标） */
function splitSegments(
  points: NormalizedDatum[],
  labelCount: number,
  toXY: (index: number, value: number) => { x: number; y: number }
): SegPoint[][] {
  const segments: SegPoint[][] = []
  let current: SegPoint[] = []
  for (let i = 0; i < labelCount; i++) {
    const v = points[i]?.value
    if (v === null || v === undefined) {
      if (current.length) segments.push(current)
      current = []
    } else {
      current.push({ ...toXY(i, v), i, v })
    }
  }
  if (current.length) segments.push(current)
  return segments
}

/** 入场揭示：仅保留 x <= cutoff 的点，并对跨界处做线性插值，实现从左向右绘制 */
function clipByX(points: Point[], cutoffX: number): Point[] {
  const result: Point[] = []
  for (const p of points) {
    if (p.x <= cutoffX) {
      result.push(p)
      continue
    }
    const prev = result[result.length - 1]
    if (prev && p.x > prev.x) {
      result.push({
        x: cutoffX,
        y: prev.y + ((p.y - prev.y) * (cutoffX - prev.x)) / (p.x - prev.x),
      })
    }
    break
  }
  return result
}

/** 系列形态解析：step 优先于 smooth（对齐 ECharts 优先级） */
function resolveCurveMode(series: KLineSeries): CurveMode {
  const raw = series.step
  if (raw === true) return 'middle'
  if (raw === 'start' || raw === 'middle' || raw === 'end') return raw
  return series.smooth ? 'smooth' : 'linear'
}

// ============ 垂直折线：场景图翻转（转置 + 双镜像，文字保持水平） ============

/**
 * 坐标变换：最终 (x, y) = (W - y', H - x')。
 * 旋转构图空间的底部类目轴 → 最终左侧；左侧数值轴 → 最终底部；
 * 系列推进方向从下向上（首类目在底部，对齐 ECharts 纵向类目习惯）。
 * 文本锚点按所属分组重映射，保证翻转后标签贴轴方向正确。
 */
function flipGraph(node: SceneNode, w: number, h: number): SceneNode {
  return flipNode(node, w, h, '')

  function flipNode(n: SceneNode, width: number, height: number, gkey: string): SceneNode {
    switch (n.type) {
      case 'group':
        return {
          ...n,
          children: n.children
            .filter((c) => !(n.key === 'xlabel' && c.type === 'text' && c.key === 'xname'))
            .map((c) => flipNode(c, width, height, n.key || gkey)),
        }
      case 'path':
        return {
          ...n,
          d: n.d.replace(/(-?[\d.]+),(-?[\d.]+)/g, (_, a: string, b: string) => {
            const nx = width - Number(b)
            const ny = height - Number(a)
            return `${r2(nx)},${r2(ny)}`
          }),
        }
      case 'rect': {
        const nx = width - (n.y + n.height)
        const ny = n.x
        return { ...n, x: r2(nx), y: r2(ny), width: n.height, height: n.width }
      }
      case 'circle':
        return { ...n, cx: r2(width - n.cy), cy: r2(height - n.cx) }
      case 'text':
        return {
          ...n,
          x: r2(width - n.y),
          y: r2(height - n.x),
          anchor: flipAnchor(n.key ?? '', gkey, n.anchor),
        }
      default:
        return n
    }
  }
}

/** 垂直翻转后的文本锚点重映射（按节点键优先，其次按所属分组） */
function flipAnchor(nodeKey: string, groupKey: string, anchor: 'start' | 'middle' | 'end' | undefined) {
  if (nodeKey === 'yname') return 'end'
  if (nodeKey === 'y2name') return 'end'
  switch (groupKey) {
    case 'xlabel':
      return 'end' // 底部类目标签 → 左侧，右对齐贴轴
    case 'ylabel':
      return 'middle' // 左侧数值标签 → 底部，居中对齐刻度
    case 'y2label':
      return 'middle' // 右侧次轴标签 → 顶部，居中对齐刻度
    case 'x2label':
      return 'start' // 顶部次轴标签 → 右侧，左对齐贴轴
    default:
      return anchor
  }
}

// ============ 以下为 path 生成（柱形图折柱混合复用） ============

/** 坐标点串 → SVG path d（直线 / Catmull-Rom 平滑 / 阶梯三种形态；柱形图折柱混合复用） */
export function toPath(points: Point[], mode: CurveMode): string {
  if (points.length === 0) return ''
  if (points.length === 1) return `M${r2(points[0].x)},${r2(points[0].y)}`
  if (mode === 'linear') {
    return `M${points.map((p) => `${r2(p.x)},${r2(p.y)}`).join('L')}`
  }
  if (mode === 'smooth') {
    return toSmoothPath(points)
  }
  return toStepPath(points, mode)
}

/** 阶梯折线：转折点位置由 mode 决定（start=先水平 / middle=中点转折 / end=后水平） */
function toStepPath(points: Point[], mode: Exclude<CurveMode, 'linear' | 'smooth'>): string {
  let d = `M${r2(points[0].x)},${r2(points[0].y)}`
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i]
    const p2 = points[i + 1]
    if (mode === 'start') {
      d += `L${r2(p2.x)},${r2(p1.y)}L${r2(p2.x)},${r2(p2.y)}`
    } else if (mode === 'end') {
      d += `L${r2(p1.x)},${r2(p2.y)}L${r2(p2.x)},${r2(p2.y)}`
    } else {
      const mx = r2((p1.x + p2.x) / 2)
      d += `L${mx},${r2(p1.y)}L${mx},${r2(p2.y)}L${r2(p2.x)},${r2(p2.y)}`
    }
  }
  return d
}

/** Catmull-Rom 转 Bezier：每段的控制点由相邻四点决定，张力系数 1/6 */
function toSmoothPath(points: Point[]): string {
  let d = `M${r2(points[0].x)},${r2(points[0].y)}`
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[i + 2] ?? p2
    const c1x = p1.x + (p2.x - p0.x) / 6
    const c1y = p1.y + (p2.y - p0.y) / 6
    const c2x = p2.x - (p3.x - p1.x) / 6
    const c2y = p2.y - (p3.y - p1.y) / 6
    d += `C${r2(c1x)},${r2(c1y)} ${r2(c2x)},${r2(c2y)} ${r2(p2.x)},${r2(p2.y)}`
  }
  return d
}

/**
 * 凹凸图路径：每个名次处水平平台 + 名次变化处水平切线 S 曲线（三次贝塞尔，
 * 控制点取段中点的同高位置），对齐经典 bump chart 视觉；相邻点同高退化为直线。
 */
export function toBumpPath(points: Point[]): string {
  if (points.length === 0) return ''
  if (points.length === 1) return `M${r2(points[0].x)},${r2(points[0].y)}`
  let d = `M${r2(points[0].x)},${r2(points[0].y)}`
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i]
    const p2 = points[i + 1]
    if (Math.abs(p1.y - p2.y) < 1e-6) {
      d += `L${r2(p2.x)},${r2(p2.y)}`
      continue
    }
    const mx = r2((p1.x + p2.x) / 2)
    d += `C${mx},${r2(p1.y)} ${mx},${r2(p2.y)} ${r2(p2.x)},${r2(p2.y)}`
  }
  return d
}
