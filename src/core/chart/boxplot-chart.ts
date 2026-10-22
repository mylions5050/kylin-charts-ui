import { BaseChart } from './base-chart'
import { BandScale, LinearScale } from '../scale'
import { niceTicks, clamp } from '../utils/math'
import { withAlpha } from '../utils/color'
import { defaultTheme, getSeriesColor } from '../theme'
import type { KChartTheme } from '../theme'
import { circle, group, path, rect, text } from '../scene/nodes'
import type { GroupNode } from '../scene/nodes'
import type { HoverInfo, KAxisOption, KBoxplotDatum, KBoxplotSeries, Padding, RenderContext } from '../types'

/** 盒须图配置（注册于 OptionMap['boxplot']） */
export interface BoxplotChartOption {
  /** x 轴类目标签（与各系列 data 一一对应） */
  labels: string[]
  /** 系列列表（每个类目下一个盒，多系列并排） */
  series: KBoxplotSeries[]
  /** 盒宽占槽位比例 0 ~ 1，缺省 0.6 */
  boxWidth?: number
  /** x 轴配置 */
  xAxis?: KAxisOption
  /** y 轴配置（show 同时控制网格线显隐） */
  yAxis?: KAxisOption
  /** 主题覆盖 */
  theme?: Partial<KChartTheme>
  /** 画布内边距覆盖 */
  padding?: Partial<Padding>
  /** 空数据提示文案 */
  emptyText?: string
}

/** 归一化后的盒（绘制与命中检测共用的内部模型） */
export interface PreparedBox {
  min: number
  q1: number
  median: number
  q3: number
  max: number
  outliers: number[]
  color?: string
}

/** 归一化后的系列 */
interface PreparedSeries {
  series: KBoxplotSeries
  boxes: (PreparedBox | null)[]
  color: string
}

interface Layout {
  pad: Padding
  plotX: number
  plotY: number
  plotW: number
  plotH: number
  catScale: BandScale
  valScale: LinearScale
  theme: KChartTheme
  prepared: PreparedSeries[]
  seriesCount: number
  boxW: number
  capW: number
}

const DEFAULT_PADDING: Padding = { top: 24, right: 24, bottom: 36, left: 48 }

/**
 * 盒须图（箱线图）
 * 支持：五数概括（下须 / Q1 / 中位数 / Q3 / 上须）、离散异常点、
 * 多系列分组并排、点级颜色覆盖、悬停类目高亮带 + 十字参考线、
 * 盒体自中位数向两端展开 + 须线向外生长的错峰入场动画。
 * 悬停索引 = 类目序号（与 hitTest 同源）。
 */
export class BoxplotChart extends BaseChart<BoxplotChartOption> {
  private layout: Layout | null = null

  constructor(container: HTMLElement, option: BoxplotChartOption) {
    super(container, option)
  }

  protected build(option: BoxplotChartOption, ctx: RenderContext): GroupNode {
    const theme: KChartTheme = { ...defaultTheme, ...option.theme }
    const pad: Padding = { ...DEFAULT_PADDING, ...option.padding }
    if (option.xAxis?.name) pad.bottom += 16
    // 倾斜的 x 轴标签需要更多底部空间（按最长类目估算文字倾斜后的纵向投影，封顶 48px）
    const xRotate = option.xAxis?.labelRotate ?? 0
    if (xRotate) {
      pad.bottom += rotatedLabelPad(option.labels, xRotate, theme.fontSize)
      // "/" 形首个标签向左出界、"\" 形末个标签向右出界：按水平投影预留对应侧 pad（封顶 48px）
      const side = rotatedLabelSidePad(option.labels, xRotate, theme.fontSize, ctx.width - pad.left - pad.right)
      if (xRotate > 0) pad.left += side
      else pad.right += side
    }
    const plotX = pad.left
    const plotY = pad.top
    const plotW = Math.max(0, ctx.width - pad.left - pad.right)
    const plotH = Math.max(0, ctx.height - pad.top - pad.bottom)

    // ============ 数据归一化（双形态 → 统一模型） ============
    const seriesCount = Math.max(1, option.series.length)
    const prepared: PreparedSeries[] = option.series.map((s, si) => ({
      series: s,
      boxes: s.data.map((d) => parseBoxDatum(d)),
      color: getSeriesColor(theme.colors, si, s.color),
    }))

    // ============ 空数据兜底 ============
    const hasAny = prepared.some((p) => p.boxes.some((b) => b !== null))
    if (option.labels.length === 0 || !hasAny) {
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

    // ============ 比例尺（值域取须端与异常点并集，不强制 0 基线） ============
    let rawMin = Infinity
    let rawMax = -Infinity
    for (const p of prepared) {
      for (const b of p.boxes) {
        if (!b) continue
        rawMin = Math.min(rawMin, b.min)
        rawMax = Math.max(rawMax, b.max)
        for (const o of b.outliers) {
          rawMin = Math.min(rawMin, o)
          rawMax = Math.max(rawMax, o)
        }
      }
    }
    const ticksResult = niceTicks(rawMin, rawMax, 5)
    const catScale = new BandScale(option.labels, [plotX, plotX + plotW])
    const valScale = new LinearScale([ticksResult.min, ticksResult.max], [plotY + plotH, plotY])

    this.layout = {
      pad,
      plotX,
      plotY,
      plotW,
      plotH,
      catScale,
      valScale,
      theme,
      prepared,
      seriesCount,
      boxW: 0,
      capW: 0,
    }
    const slotWidth = catScale.bandwidth$ / seriesCount
    const boxW = Math.max(4, slotWidth * (option.boxWidth ?? 0.6))
    const capW = boxW * 0.5
    this.layout.boxW = boxW
    this.layout.capW = capW

    const children: GroupNode['children'] = []

    // ============ 网格线 + Y 轴 ============
    const showXAxis = option.xAxis?.show ?? true
    const showYAxis = option.yAxis?.show ?? true
    const gridNodes: GroupNode['children'] = []
    const yLabelNodes: GroupNode['children'] = []
    const yTickNodes: GroupNode['children'] = []
    if (showYAxis) {
      for (const tick of ticksResult.ticks) {
        const y = r2(valScale.scale(tick))
        gridNodes.push(
          path(`M${plotX},${y}L${plotX + plotW},${y}`, { key: `grid/${tick}`, stroke: theme.gridColor, strokeWidth: 1 })
        )
        yLabelNodes.push(
          text(plotX - 8, y + theme.fontSize / 2 - 1, axisLabelFmt(option.yAxis, tick), {
            key: `ylabel/${tick}`,
            anchor: 'end',
            fontSize: theme.fontSize,
            fill: theme.textColor,
            fontFamily: theme.fontFamily,
          })
        )
        yTickNodes.push(
          path(`M${plotX},${y}L${plotX - 5},${y}`, { key: `ytick/${tick}`, stroke: theme.axisLineColor, strokeWidth: 1 })
        )
      }
    }
    children.push(group({ key: 'grid', children: gridNodes }))

    // ============ 轴线 ============
    const axisBottom = plotY + plotH
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

    // ============ X 轴标签 + 刻度（按宽度抽稀，刻度随标签走） ============
    const labelCount = option.labels.length
    const maxVisible = Math.max(2, Math.floor(plotW / 64))
    const labelStep = Math.ceil(labelCount / maxVisible)
    const xLabelNodes: GroupNode['children'] = []
    const xTickNodes: GroupNode['children'] = []
    if (showXAxis) {
      for (let i = 0; i < labelCount; i++) {
        if (i % labelStep !== 0 && i !== labelCount - 1) continue
        const cx = r2(catScale.center(i))
        xLabelNodes.push(
          text(cx, axisBottom + (xRotate ? 14 : 20), option.labels[i], {
            key: `xlabel/${i}`,
            anchor: xRotate ? (xRotate > 0 ? 'end' : 'start') : 'middle',
            rotate: xRotate ? -xRotate : undefined,
            fontSize: theme.fontSize,
            fill: theme.textColor,
            fontFamily: theme.fontFamily,
          })
        )
        xTickNodes.push(
          path(`M${cx},${axisBottom}L${cx},${axisBottom + 5}`, { key: `xtick/${i}`, stroke: theme.axisLineColor, strokeWidth: 1 })
        )
      }
      if (option.xAxis?.name) {
        xLabelNodes.push(
          text(plotX + plotW, axisBottom + 36, option.xAxis.name, { key: 'xname', anchor: 'end', fontSize: theme.fontSize, fill: theme.textColor, fontFamily: theme.fontFamily })
        )
      }
    }
    if (showYAxis && option.yAxis?.name) {
      yLabelNodes.push(
        text(plotX - 8, plotY - 10, option.yAxis.name, { key: 'yname', anchor: 'start', fontSize: theme.fontSize, fill: theme.textColor, fontFamily: theme.fontFamily })
      )
    }
    children.push(group({ key: 'xlabel', children: xLabelNodes }))
    children.push(group({ key: 'xtick', children: xTickNodes }))
    children.push(group({ key: 'ylabel', children: yLabelNodes }))
    children.push(group({ key: 'ytick', children: yTickNodes }))

    // ============ 悬停类目高亮带 + 十字参考线（盒体之下，先画） ============
    if (ctx.hoverIndex !== null && ctx.hoverIndex < labelCount) {
      const hx = r2(catScale.center(ctx.hoverIndex))
      const band = catScale.bandwidth$
      children.push(
        rect(r2(hx - band / 2), plotY, r2(band), r2(plotH), {
          key: 'hover-band',
          fill: withAlpha(theme.colors[0], 0.06),
        })
      )
      children.push(
        path(`M${hx},${plotY}L${hx},${axisBottom}`, { key: 'crosshair', stroke: theme.axisLineColor, strokeWidth: 1, dash: [4, 4] })
      )
    }

    // ============ 盒须（盒自中位数展开，须自盒缘向外生长，逐盒错峰） ============
    const totalSlots = Math.max(1, labelCount * seriesCount)
    const boxNodes: GroupNode['children'] = []
    const whiskerNodes: GroupNode['children'] = []
    const outlierNodes: GroupNode['children'] = []
    prepared.forEach((p, si) => {
      const groupOffset = (si - (seriesCount - 1) / 2) * slotWidth
      p.boxes.forEach((b, i) => {
        if (!b) return
        const color = b.color ?? p.color
        const cx = catScale.center(i) + groupOffset
        const local = clamp01(ctx.progress * totalSlots - (si * labelCount + i))

        const yMax = valScale.scale(b.max)
        const yQ3 = valScale.scale(b.q3)
        const yMed = valScale.scale(b.median)
        const yQ1 = valScale.scale(b.q1)
        const yMin = valScale.scale(b.min)

        // 盒体：自中位数向两端展开；Q1=Q3（零四分位距）保底 2px
        const boxTop = yMed - (yMed - yQ3) * local
        const boxBottom = yMed + (yQ1 - yMed) * local
        const halfW = boxW / 2
        boxNodes.push(
          rect(r2(cx - halfW), r2(Math.min(boxTop, boxBottom - 2)), r2(boxW), r2(Math.max(2, boxBottom - boxTop)), {
            key: `box/${si}/${i}`,
            fill: withAlpha(color, 0.35),
            stroke: color,
            strokeWidth: 1.5,
          })
        )
        // 中位线（横贯盒体，加粗）
        whiskerNodes.push(
          path(`M${r2(cx - halfW)},${r2(yMed)}L${r2(cx + halfW)},${r2(yMed)}`, {
            key: `median/${si}/${i}`,
            stroke: color,
            strokeWidth: 2,
            opacity: local,
          })
        )

        // 须线：自盒缘向外生长，端帽随入场上浮
        const topEnd = yQ3 - (yQ3 - yMax) * local
        const bottomEnd = yQ1 + (yMin - yQ1) * local
        if (yMax < yQ3 - 0.5) {
          whiskerNodes.push(
            path(`M${r2(cx)},${r2(yQ3)}L${r2(cx)},${r2(topEnd)}`, { key: `whisker-top/${si}/${i}`, stroke: color, strokeWidth: 1 })
          )
          whiskerNodes.push(
            path(`M${r2(cx - capW / 2)},${r2(topEnd)}L${r2(cx + capW / 2)},${r2(topEnd)}`, {
              key: `cap-top/${si}/${i}`,
              stroke: color,
              strokeWidth: 1,
              opacity: local,
            })
          )
        }
        if (yMin > yQ1 + 0.5) {
          whiskerNodes.push(
            path(`M${r2(cx)},${r2(yQ1)}L${r2(cx)},${r2(bottomEnd)}`, { key: `whisker-bottom/${si}/${i}`, stroke: color, strokeWidth: 1 })
          )
          whiskerNodes.push(
            path(`M${r2(cx - capW / 2)},${r2(bottomEnd)}L${r2(cx + capW / 2)},${r2(bottomEnd)}`, {
              key: `cap-bottom/${si}/${i}`,
              stroke: color,
              strokeWidth: 1,
              opacity: local,
            })
          )
        }

        // 异常点：须外离散圆点（缩放入场）
        for (let oi = 0; oi < b.outliers.length; oi++) {
          outlierNodes.push(
            circle(r2(cx), r2(valScale.scale(b.outliers[oi])), Math.max(0.5, 3 * local), {
              key: `outlier/${si}/${i}/${oi}`,
              fill: withAlpha(color, 0.85),
            })
          )
        }
      })
    })
    children.push(group({ key: 'series', children: [...whiskerNodes, ...boxNodes, ...outlierNodes] }))

    return group({ key: 'plot', children })
  }

  protected hitTest(x: number, y: number): number | null {
    const layout = this.layout
    if (!layout) return null
    const { pad, plotW, plotH, catScale } = layout
    if (x < pad.left || x > pad.left + plotW || y < pad.top || y > pad.top + plotH) {
      return null
    }
    const count = catScale.labels$.length
    if (count === 0) return null
    const index = Math.floor((x - pad.left) / Math.max(1e-6, catScale.step$))
    return clamp(index, 0, count - 1)
  }

  protected getHoverInfo(index: number): HoverInfo {
    const layout = this.layout
    if (!layout) return { index, x: 0, y: 0 }
    const { plotX, plotY, plotW, plotH, catScale, valScale, prepared } = layout
    const center = catScale.center(index)
    // 引导点锚定在第一个有盒系列的盒顶（Q3）
    let y = plotY + plotH / 2
    let found = false
    for (const p of prepared) {
      const b = p.boxes[index]
      if (!b) continue
      y = valScale.scale(b.q3)
      found = true
      break
    }
    return { index, x: r2(center), y: r2(found ? y : plotY + plotH / 2) }
  }
}

// ============ 纯函数工具（core 与组件层共用） ============

function r2(v: number): number {
  return Math.round(v * 100) / 100
}

function clamp01(v: number): number {
  return clamp(v, 0, 1)
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

/**
 * 盒须数据双形态归一化：裸元组 → 无异常点对象；对象形态透传。
 * 非法数据（长度不为 5 或含非数值）返回 null，绘制与 tooltip 均跳过。
 */
export function parseBoxDatum(datum: KBoxplotDatum): PreparedBox | null {
  const value = Array.isArray(datum) ? datum : datum?.value
  if (!Array.isArray(value) || value.length !== 5 || value.some((v) => typeof v !== 'number' || !Number.isFinite(v))) {
    return null
  }
  const [min, q1, median, q3, max] = value as [number, number, number, number, number]
  return {
    min: Math.min(min, max),
    q1: Math.min(q1, q3),
    median,
    q3: Math.max(q1, q3),
    max: Math.max(min, max),
    outliers: Array.isArray(datum) ? [] : (datum.outliers ?? []),
    color: Array.isArray(datum) ? undefined : datum.color,
  }
}

/**
 * 从原始样本计算五数概括 + 异常点（1.5 倍四分位距准则）：
 * 上下须取栅栏内样本的极值，栅栏外的样本归入异常点。
 * 分位数用线性插值法（与 Excel PERCENTILE.INC 一致）。
 */
export function computeBoxStats(samples: number[]): KBoxplotDatum | null {
  const arr = samples.filter((v) => Number.isFinite(v)).slice().sort((a, b) => a - b)
  const n = arr.length
  if (n === 0) return null
  const quantile = (p: number): number => {
    if (n === 1) return arr[0]
    const idx = p * (n - 1)
    const lo = Math.floor(idx)
    const hi = Math.ceil(idx)
    return arr[lo] + (arr[hi] - arr[lo]) * (idx - lo)
  }
  const q1 = quantile(0.25)
  const median = quantile(0.5)
  const q3 = quantile(0.75)
  const iqr = q3 - q1
  const loFence = q1 - 1.5 * iqr
  const hiFence = q3 + 1.5 * iqr
  const inliers = arr.filter((v) => v >= loFence && v <= hiFence)
  const outliers = arr.filter((v) => v < loFence || v > hiFence)
  const item: KBoxplotDatum = {
    value: [inliers[0] ?? arr[0], q1, median, q3, inliers[inliers.length - 1] ?? arr[n - 1]],
    outliers,
  }
  return item
}
