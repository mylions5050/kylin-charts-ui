import { BaseChart } from './base-chart'
import { BandScale, LinearScale } from '../scale'
import { niceTicks, clamp } from '../utils/math'
import { withAlpha } from '../utils/color'
import { defaultTheme, getSeriesColor } from '../theme'
import type { KChartTheme } from '../theme'
import { group, path, rect, text } from '../scene/nodes'
import type { GroupNode } from '../scene/nodes'
import type { HoverInfo, KAxisOption, KCandleDatum, Padding, Point, RenderContext } from '../types'

/** K 线图配置（注册于 OptionMap['candlestick']） */
export interface CandlestickChartOption {
  /** x 轴类目标签（交易日等） */
  labels: string[]
  /** K 线数据（与 labels 一一对应）：[开盘价, 收盘价, 最低价, 最高价] */
  data: KCandleDatum[]
  /** 阳线颜色（收盘 ≥ 开盘）；默认 #F5455C（国内习惯红涨） */
  bullColor?: string
  /** 阴线颜色（收盘 < 开盘）；默认 #00B578（绿跌） */
  bearColor?: string
  /** 叠加均线周期列表，如 [5, 10, 20]；不传不绘制均线 */
  ma?: number[]
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

/** 均线的绘制模型（窗口、颜色与逐日均值序列） */
interface PreparedMa {
  /** 展示名，如 MA5 */
  name: string
  color: string
  /** 逐日均值；样本不足的前 window-1 日为 null */
  values: (number | null)[]
}

interface Layout {
  pad: Padding
  plotX: number
  plotY: number
  plotW: number
  plotH: number
  xScale: BandScale
  yScale: LinearScale
  theme: KChartTheme
  data: KCandleDatum[]
  bullColor: string
  bearColor: string
  mas: PreparedMa[]
}

const DEFAULT_PADDING: Padding = { top: 24, right: 24, bottom: 36, left: 52 }

const DEFAULT_BULL = '#F5455C'
const DEFAULT_BEAR = '#00B578'

/**
 * K 线（蜡烛）图
 * 支持：红涨绿跌阴阳配色、十字星（开=收）退化为一字横线、
 * 叠加 MA 均线（逐日均值、null 断点自动跳过）、悬停类目高亮带 + 十字参考线、
 * 蜡烛逐根入场生长动画、均线自左向右揭示动画。
 */
export class CandlestickChart extends BaseChart<CandlestickChartOption> {
  private layout: Layout | null = null

  constructor(container: HTMLElement, option: CandlestickChartOption) {
    super(container, option)
  }

  protected build(option: CandlestickChartOption, ctx: RenderContext): GroupNode {
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

    const bullColor = option.bullColor ?? DEFAULT_BULL
    const bearColor = option.bearColor ?? DEFAULT_BEAR
    const data = option.data

    // ============ 均线计算（基于收盘价） ============
    const mas: PreparedMa[] = (option.ma ?? [])
      .filter((w) => w >= 1)
      .map((w, i) => ({
        name: `MA${w}`,
        color: resolveMaColor(w, i, theme.colors),
        values: computeMA(data, w),
      }))

    // ============ 空数据兜底 ============
    if (option.labels.length === 0 || data.length === 0) {
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

    // ============ 比例尺（价格域取影线与均线并集，不强制 0 基线） ============
    let rawMin = Infinity
    let rawMax = -Infinity
    for (const d of data) {
      rawMin = Math.min(rawMin, d[2])
      rawMax = Math.max(rawMax, d[3])
    }
    for (const m of mas) {
      for (const v of m.values) {
        if (v === null) continue
        rawMin = Math.min(rawMin, v)
        rawMax = Math.max(rawMax, v)
      }
    }
    const ticksResult = niceTicks(rawMin, rawMax, 5)
    const yScale = new LinearScale([ticksResult.min, ticksResult.max], [plotY + plotH, plotY])
    const xScale = new BandScale(option.labels, [plotX, plotX + plotW])

    this.layout = { pad, plotX, plotY, plotW, plotH, xScale, yScale, theme, data, bullColor, bearColor, mas }

    const children: GroupNode['children'] = []

    // ============ 网格线 + Y 轴（对齐 ECharts：网格线隶属 y 轴 splitLine） ============
    const showXAxis = option.xAxis?.show ?? true
    const showYAxis = option.yAxis?.show ?? true
    const gridNodes: GroupNode['children'] = []
    const yLabelNodes: GroupNode['children'] = []
    const yTickNodes: GroupNode['children'] = []
    if (showYAxis) {
      for (const tick of ticksResult.ticks) {
        const y = r2(yScale.scale(tick))
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

    // ============ 轴线（对齐 ECharts 基础样式：双轴线清晰可见） ============
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
        const cx = r2(xScale.center(i))
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

    // ============ 悬停类目高亮带 + 十字参考线（蜡烛之下，先画） ============
    if (ctx.hoverIndex !== null && ctx.hoverIndex < labelCount) {
      const hx = r2(xScale.center(ctx.hoverIndex))
      const band = xScale.bandwidth$
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

    // ============ 蜡烛（逐根错峰生长：影线与实体各自锚定自身中点） ============
    const count = Math.min(labelCount, data.length)
    const bodyW = Math.max(1, Math.min(20, xScale.bandwidth$ * 0.6))
    const candleNodes: GroupNode['children'] = []
    for (let i = 0; i < count; i++) {
      const [open, close, low, high] = data[i]
      const isBull = close >= open
      const color = isBull ? bullColor : bearColor
      const local = clamp01(ctx.progress * count - i)

      const cx = xScale.center(i)
      const yHigh = yScale.scale(high)
      const yLow = yScale.scale(low)
      // 影线：自中点向两端生长
      const midWick = (yHigh + yLow) / 2
      const halfWick = ((yLow - yHigh) / 2) * local
      if (halfWick > 0.5) {
        candleNodes.push(
          path(`M${r2(cx)},${r2(midWick - halfWick)}L${r2(cx)},${r2(midWick + halfWick)}`, {
            key: `wick/${i}`,
            stroke: color,
            strokeWidth: 1,
          })
        )
      }

      // 实体：开收盘之间；开=收（十字星）退化为一字横线
      const yTop = yScale.scale(Math.max(open, close))
      const yBot = yScale.scale(Math.min(open, close))
      const midBody = (yTop + yBot) / 2
      const halfBody = Math.max(0.5, ((yBot - yTop) / 2) * local)
      if (close === open) {
        // 十字星：1px 横线，宽度略小于实体
        candleNodes.push(
          path(`M${r2(cx - bodyW / 2)},${r2(midBody)}L${r2(cx + bodyW / 2)},${r2(midBody)}`, {
            key: `body/${i}`,
            stroke: color,
            strokeWidth: 1,
          })
        )
      } else {
        candleNodes.push(
          rect(r2(cx - bodyW / 2), r2(midBody - halfBody), r2(bodyW), r2(halfBody * 2), {
            key: `body/${i}`,
            fill: color,
          })
        )
      }
    }
    children.push(group({ key: 'series', children: candleNodes }))

    // ============ MA 均线（蜡烛之上，自左向右揭示） ============
    const entranceCutoff = plotX + plotW * ctx.progress
    const maNodes: GroupNode['children'] = []
    for (let mi = 0; mi < mas.length; mi++) {
      const m = mas[mi]
      const pts: Point[] = []
      for (let i = 0; i < count; i++) {
        const v = m.values[i]
        if (v === null) continue
        pts.push({ x: xScale.center(i), y: yScale.scale(v) })
      }
      const clipped = clipByX(pts, entranceCutoff)
      if (clipped.length === 0) continue
      maNodes.push(
        path(`M${clipped.map((p) => `${r2(p.x)},${r2(p.y)}`).join('L')}`, {
          key: `ma/${m.name}`,
          stroke: m.color,
          strokeWidth: 1.5,
        })
      )
    }
    children.push(group({ key: 'maline', children: maNodes }))

    return group({ key: 'plot', children })
  }

  protected hitTest(x: number, y: number): number | null {
    const layout = this.layout
    if (!layout) return null
    const { pad, plotW, plotH, xScale } = layout
    if (x < pad.left || x > pad.left + plotW || y < pad.top || y > pad.top + plotH) {
      return null
    }
    const count = xScale.labels$.length
    if (count === 0) return null
    const index = Math.floor((x - pad.left) / Math.max(1e-6, xScale.step$))
    return clamp(index, 0, count - 1)
  }

  protected getHoverInfo(index: number): HoverInfo {
    const layout = this.layout
    if (!layout) return { index, x: 0, y: 0 }
    const { plotY, plotH, xScale, yScale, data } = layout
    const datum = data[index]
    // 引导点锚定在蜡烛最高价（tooltip 显示在其上方）
    const y = datum ? yScale.scale(datum[3]) : plotY + plotH / 2
    return { index, x: r2(xScale.center(index)), y: r2(clamp(y, plotY, plotY + plotH)) }
  }
}

// ============ 纯函数工具（core 与组件层共用） ============

function r2(v: number): number {
  return Math.round(v * 100) / 100
}

function clamp01(v: number): number {
  return clamp(v, 0, 1)
}

/** 价格轴刻度：保留 1 位小数以内，避免浮点尾差 */
function formatPrice(v: number): string {
  return String(Number(v.toFixed(2)))
}

/** 刻度标签文案：用户配置了 labelFormatter 则优先，否则内置价格格式 */
function axisLabelFmt(axis: KAxisOption | undefined, tick: number): string {
  return axis?.labelFormatter ? axis.labelFormatter(tick) : formatPrice(tick)
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

/** 常用均线周期的固定配色（隐藏某条均线时其余颜色不漂移） */
const MA_COLOR_MAP: Record<number, string> = { 5: '#2B6FFF', 10: '#FF9F43', 20: '#7C5CFC', 30: '#00C6A2' }

/** 均线取色：常用周期映射固定颜色，其余按序取主题色板（core 与组件图例共用） */
export function resolveMaColor(window: number, index: number, colors: string[]): string {
  return MA_COLOR_MAP[window] ?? getSeriesColor(colors, index)
}

/**
 * 计算移动平均线（MA）：基于收盘价，窗口内算术平均。
 * 样本不足的前 window-1 日为 null（绘制与 tooltip 均跳过）。
 */
export function computeMA(data: KCandleDatum[], window: number): (number | null)[] {
  const result: (number | null)[] = []
  let sum = 0
  for (let i = 0; i < data.length; i++) {
    sum += data[i][1]
    if (i >= window) sum -= data[i - window][1]
    result.push(i >= window - 1 ? Number((sum / window).toFixed(4)) : null)
  }
  return result
}

/** 入场揭示：仅保留 x <= cutoff 的点，跨界处做线性插值，实现从左向右绘制 */
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
