import { BaseChart } from './base-chart'
import { LinearScale } from '../scale'
import { niceTicks } from '../utils/math'
import { withAlpha } from '../utils/color'
import { defaultTheme, getSeriesColor } from '../theme'
import type { KChartTheme } from '../theme'
import { circle, group, path, text } from '../scene/nodes'
import type { GroupNode } from '../scene/nodes'
import { applyAxisRange, inverseDomain, labelColorOf, labelFontSizeOf, nameColorOf, splitLineOf, splitStyleOf } from './axis-ext'
import type { HoverInfo, KAxisOption, KColor, KScatterDatum, KScatterSeries, Padding, RenderContext } from '../types'

/** 散点图配置（注册于 OptionMap['scatter']） */
export interface ScatterChartOption {
  /** 系列列表（每系列一组散点，可多系列对比） */
  series: KScatterSeries[]
  /** x 轴配置（数值轴） */
  xAxis?: KAxisOption
  /** y 轴配置（数值轴，show 同时控制网格线显隐） */
  yAxis?: KAxisOption
  /** 主题覆盖 */
  theme?: Partial<KChartTheme>
  /** 画布内边距覆盖 */
  padding?: Partial<Padding>
  /** 空数据提示文案 */
  emptyText?: string
}

/** 归一化后的系列（绘制与命中检测共用的内部模型） */
interface PreparedSeries {
  series: KScatterSeries
  /** 系列颜色：纯色或渐变配置 */
  color: KColor
}

/** 展平后的散点像素坐标（hover 索引 = 该数组的下标，系列在前点在后） */
interface FlatPoint {
  /** 系列序号 */
  si: number
  /** 系列内点序号 */
  pi: number
  px: number
  py: number
  /** 点半径 px */
  r: number
}

interface Layout {
  pad: Padding
  plotX: number
  plotY: number
  plotW: number
  plotH: number
  xScale: LinearScale
  yScale: LinearScale
  theme: KChartTheme
  prepared: PreparedSeries[]
  /** 展平散点（与 hover 索引一一对应） */
  flatPoints: FlatPoint[]
}

const DEFAULT_PADDING: Padding = { top: 24, right: 24, bottom: 36, left: 52 }

const DEFAULT_RADIUS = 4
/** 点最大半径上限（气泡防撑爆） */
const MAX_RADIUS = 30

/**
 * 散点图
 * 支持：多系列对比、双数值轴（x / y 均为 LinearScale，区别于类目轴图表）、
 * 第三维 size 气泡图（点半径映射）、悬停最近点命中 + 十字参考线 + 高亮环、
 * 散点逐个错峰缩放入场动画。
 */
export class ScatterChart extends BaseChart<ScatterChartOption> {
  private layout: Layout | null = null

  constructor(container: HTMLElement, option: ScatterChartOption) {
    super(container, option)
  }

  protected build(option: ScatterChartOption, ctx: RenderContext): GroupNode {
    const theme: KChartTheme = { ...defaultTheme, ...option.theme }
    const pad: Padding = { ...DEFAULT_PADDING, ...option.padding }
    if (option.xAxis?.name) pad.bottom += 16
    // 倾斜的 x 轴标签需要更多底部空间（数值轴按默认字长估算，封顶 48px）
    const xRotate = option.xAxis?.labelRotate ?? 0
    if (xRotate) {
      pad.bottom += rotatedLabelPad(undefined, xRotate, theme.fontSize, 7)
      // "/" 形首个标签向左出界、"\" 形末个标签向右出界：按水平投影预留对应侧 pad（封顶 48px）
      const side = rotatedLabelSidePad(undefined, xRotate, theme.fontSize, ctx.width - pad.left - pad.right, 7)
      if (xRotate > 0) pad.left += side
      else pad.right += side
    }
    const plotX = pad.left
    const plotY = pad.top
    const plotW = Math.max(0, ctx.width - pad.left - pad.right)
    const plotH = Math.max(0, ctx.height - pad.top - pad.bottom)

    // ============ 数据归一化（系列色板分配） ============
    const prepared: PreparedSeries[] = option.series.map((s, si) => ({
      series: s,
      color: s.color ?? getSeriesColor(theme.colors, si),
    }))

    // ============ 空数据兜底 ============
    const totalPoints = prepared.reduce((sum, p) => sum + p.series.data.length, 0)
    if (prepared.length === 0 || totalPoints === 0) {
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

    // ============ 比例尺（双数值轴，域取数据并集，不强制 0 基线） ============
    let xMin = Infinity
    let xMax = -Infinity
    let yMin = Infinity
    let yMax = -Infinity
    for (const p of prepared) {
      for (const d of p.series.data) {
        xMin = Math.min(xMin, d[0])
        xMax = Math.max(xMax, d[0])
        yMin = Math.min(yMin, d[1])
        yMax = Math.max(yMax, d[1])
      }
    }
    const xTicks = applyAxisRange(niceTicks(xMin, xMax, 5), option.xAxis)
    const yTicks = applyAxisRange(niceTicks(yMin, yMax, 5), option.yAxis)
    const xScale = new LinearScale(inverseDomain(xTicks.min, xTicks.max, option.xAxis), [plotX, plotX + plotW])
    const yScale = new LinearScale(inverseDomain(yTicks.min, yTicks.max, option.yAxis), [plotY + plotH, plotY])

    // ============ 展平散点像素坐标（hover 索引同源） ============
    const flatPoints: FlatPoint[] = []
    prepared.forEach((p, si) => {
      p.series.data.forEach((d, pi) => {
        const r = Math.min(MAX_RADIUS, Math.max(1, d[2] ?? p.series.radius ?? DEFAULT_RADIUS))
        flatPoints.push({ si, pi, px: xScale.scale(d[0]), py: yScale.scale(d[1]), r })
      })
    })

    this.layout = { pad, plotX, plotY, plotW, plotH, xScale, yScale, theme, prepared, flatPoints }

    const children: GroupNode['children'] = []

    // ============ 网格线 + Y 轴（对齐 ECharts：网格线隶属 y 轴 splitLine） ============
    const showXAxis = option.xAxis?.show ?? true
    const showYAxis = option.yAxis?.show ?? true
    const gridNodes: GroupNode['children'] = []
    const yLabelNodes: GroupNode['children'] = []
    const yTickNodes: GroupNode['children'] = []
    if (showYAxis) {
      const showGrid = splitLineOf(option.yAxis)
      for (const tick of yTicks.ticks) {
        const y = r2(yScale.scale(tick))
        if (showGrid) {
          gridNodes.push(
            path(`M${plotX},${y}L${plotX + plotW},${y}`, { key: `grid/${tick}`, stroke: splitStyleOf(option.yAxis).color ?? theme.gridColor, strokeWidth: 1, dash: splitStyleOf(option.yAxis).dash })
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
        yTickNodes.push(
          path(`M${plotX},${y}L${plotX - 5},${y}`, { key: `ytick/${tick}`, stroke: theme.axisLineColor, strokeWidth: 1 })
        )
      }
    }
    children.push(group({ key: 'grid', children: gridNodes }))

    // ============ X 轴刻度标签（数值轴，取 xTicks） ============
    const axisBottom = plotY + plotH
    const xLabelNodes: GroupNode['children'] = []
    const xTickNodes: GroupNode['children'] = []
    if (showXAxis) {
      for (const tick of xTicks.ticks) {
        const x = r2(xScale.scale(tick))
        xLabelNodes.push(
          text(x, axisBottom + (xRotate ? 14 : 20), axisLabelFmt(option.xAxis, tick), {
            key: `xlabel/${tick}`,
            anchor: xRotate ? (xRotate > 0 ? 'end' : 'start') : 'middle',
            rotate: xRotate ? -xRotate : undefined,
            fontSize: labelFontSizeOf(option.xAxis, theme.fontSize),
            fill: labelColorOf(option.xAxis, theme.textColor),
            fontFamily: theme.fontFamily,
          })
        )
        xTickNodes.push(
          path(`M${x},${axisBottom}L${x},${axisBottom + 5}`, { key: `xtick/${tick}`, stroke: theme.axisLineColor, strokeWidth: 1 })
        )
      }
      if (option.xAxis?.name) {
        xLabelNodes.push(
          text(plotX + plotW, axisBottom + 36, option.xAxis.name, { key: 'xname', anchor: 'end', fontSize: theme.fontSize, fill: nameColorOf(option.xAxis, theme.textColor), fontFamily: theme.fontFamily })
        )
      }
    }
    if (showYAxis && option.yAxis?.name) {
      yLabelNodes.push(
        text(plotX - 8, plotY - 10, option.yAxis.name, { key: 'yname', anchor: 'start', fontSize: theme.fontSize, fill: nameColorOf(option.yAxis, theme.textColor), fontFamily: theme.fontFamily })
      )
    }
    children.push(group({ key: 'xlabel', children: xLabelNodes }))
    children.push(group({ key: 'xtick', children: xTickNodes }))
    children.push(group({ key: 'ylabel', children: yLabelNodes }))
    children.push(group({ key: 'ytick', children: yTickNodes }))

    // ============ 轴线（对齐 ECharts 基础样式：双轴线清晰可见） ============
    if (showXAxis) {
      children.push(
        path(`M${plotX},${axisBottom}L${plotX + plotW},${axisBottom}`, { key: 'axis/x', stroke: theme.axisLineColor, strokeWidth: 1 })
      )
    }
    if (showYAxis) {
      children.push(
        path(`M${plotX},${plotY}L${plotX},${axisBottom}`, { key: 'axis/y', stroke: theme.axisLineColor, strokeWidth: 1 })
      )
    }

    // ============ 散点（逐个错峰缩放入场） ============
    const pointNodes: GroupNode['children'] = []
    const total = flatPoints.length
    flatPoints.forEach((fp, gi) => {
      const color = prepared[fp.si].color
      const local = clamp01(ctx.progress * total - gi)
      pointNodes.push(
        circle(r2(fp.px), r2(fp.py), Math.max(0.5, fp.r * local), {
          key: `point/${fp.si}/${fp.pi}`,
          fill: typeof color === 'string' ? withAlpha(color, 0.8) : this.resolvePaint(color),
        })
      )
    })
    children.push(group({ key: 'series', children: pointNodes }))

    // ============ 悬停：十字参考线 + 高亮环（点之上，后画） ============
    if (ctx.hoverIndex !== null && ctx.hoverIndex < flatPoints.length) {
      const fp = flatPoints[ctx.hoverIndex]
      const hx = r2(fp.px)
      const hy = r2(fp.py)
      const color = this.solidColor(prepared[fp.si].color)
      children.push(
        path(`M${hx},${plotY}L${hx},${axisBottom}`, { key: 'crosshair/x', stroke: theme.axisLineColor, strokeWidth: 1, dash: [4, 4] })
      )
      children.push(
        path(`M${plotX},${hy}L${plotX + plotW},${hy}`, { key: 'crosshair/y', stroke: theme.axisLineColor, strokeWidth: 1, dash: [4, 4] })
      )
      children.push(
        circle(hx, hy, fp.r + 3, { key: 'hover-ring', fill: 'none', stroke: color, strokeWidth: 2 })
      )
    }

    return group({ key: 'plot', children })
  }

  /** 最近点命中：指针半径阈值内取距离最小的散点 */
  protected hitTest(x: number, y: number): number | null {
    const layout = this.layout
    if (!layout) return null
    const { pad, plotW, plotH, flatPoints } = layout
    if (x < pad.left || x > pad.left + plotW || y < pad.top || y > pad.top + plotH) {
      return null
    }
    let best = -1
    let bestDist = Infinity
    for (let i = 0; i < flatPoints.length; i++) {
      const fp = flatPoints[i]
      const dx = x - fp.px
      const dy = y - fp.py
      const dist = dx * dx + dy * dy
      if (dist < bestDist) {
        bestDist = dist
        best = i
      }
    }
    if (best === -1) return null
    const threshold = Math.max(10, flatPoints[best].r + 4)
    return bestDist <= threshold * threshold ? best : null
  }

  protected getHoverInfo(index: number): HoverInfo {
    const fp = this.layout?.flatPoints[index]
    if (!fp) return { index, x: 0, y: 0 }
    return { index, x: r2(fp.px), y: r2(fp.py) }
  }
}

// ============ 纯函数工具 ============

function r2(v: number): number {
  return Math.round(v * 100) / 100
}

function clamp01(v: number): number {
  return Math.min(1, Math.max(0, v))
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
function rotatedLabelPad(labels: (string | number)[] | undefined, rotate: number, fontSize: number, fallback = 4): number {
  const rad = (Math.abs(rotate) * Math.PI) / 180
  return Math.max(0, Math.min(80, Math.ceil(labelEmWidth(labels, fallback) * fontSize * Math.sin(rad)) - 14))
}

/** 倾斜 x 轴标签两端出界的水平预留：最长标签的水平投影超出半个类目槽位的部分，封顶 64px */
function rotatedLabelSidePad(labels: (string | number)[] | undefined, rotate: number, fontSize: number, plotW: number, fallback = 4): number {
  const rad = (Math.abs(rotate) * Math.PI) / 180
  const hProj = labelEmWidth(labels, fallback) * fontSize * Math.cos(rad)
  const catW = plotW / Math.max(1, (labels ?? []).length || 6)
  return Math.max(0, Math.min(64, Math.ceil(hProj - catW / 2)))
}

/** 展平各系列散点数据（组件 tooltip 与核心 hover 索引共用同一解码顺序） */
export function flattenScatterData(series: KScatterSeries[]): { si: number; datum: KScatterDatum }[] {
  const result: { si: number; datum: KScatterDatum }[] = []
  series.forEach((s, si) => {
    s.data.forEach((d) => result.push({ si, datum: d }))
  })
  return result
}
