import { BaseChart } from './base-chart'
import { clamp } from '../utils/math'
import { withAlpha } from '../utils/color'
import { defaultTheme } from '../theme'
import type { KChartTheme } from '../theme'
import { group, path, text } from '../scene/nodes'
import type { GroupNode } from '../scene/nodes'
import type { HoverInfo, KThemeRiverSeries, Padding, RenderContext } from '../types'

/** 主题河流配置 */
export interface ThemeRiverChartOption {
  /** 时间轴标签（每列一个） */
  labels: string[]
  /** 系列列表（data 与 labels 一一对应） */
  series: KThemeRiverSeries[]
  /** 平滑曲线开关，缺省 true */
  smooth?: boolean
  /** 流带颜色不透明度 0~1，缺省 0.78 */
  fillOpacity?: number
  theme?: Partial<KChartTheme>
  padding?: Partial<Padding>
  emptyText?: string
}

const DEFAULT_PADDING: Padding = { top: 28, right: 28, bottom: 44, left: 28 }

/** 绘制用的边线点 */
interface EdgePoint {
  x: number
  y: number
}

/**
 * 主题河流（ThemeRiver）
 * 中心堆叠流带图：各系列上下堆叠后整体围绕水平中轴对称展开，
 * 形似河流；悬停索引 = 时间列下标，高亮竖向参考线 + 系列明细。
 * 入场：流带自左向右逐列揭示。
 */
export class ThemeRiverChart extends BaseChart<ThemeRiverChartOption> {
  private colX: number[] = []
  private colCenterY: number[] = []
  private pxPerUnit: number = 0
  private plotBox: { x: number; y: number; w: number; h: number } = { x: 0, y: 0, w: 0, h: 0 }
  private cacheSig = ''
  private lastHover: number | null = null

  protected build(option: ThemeRiverChartOption, ctx: RenderContext): GroupNode {
    const theme: KChartTheme = { ...defaultTheme, ...option.theme }
    const pad: Padding = { ...DEFAULT_PADDING, ...option.padding }
    const plotW = Math.max(0, ctx.width - pad.left - pad.right)
    const plotH = Math.max(0, ctx.height - pad.top - pad.bottom)
    const labels = option.labels
    if (labels.length < 2 || option.series.length === 0 || plotW <= 0 || plotH <= 0) {
      this.colX = []
      return group({
        key: 'empty',
        children: [
          text(ctx.width / 2, ctx.height / 2, labels.length < 2 ? '主题河流至少需要 2 个时间点' : option.emptyText ?? '暂无数据', {
            anchor: 'middle',
            fontSize: 14,
            fill: theme.emptyColor,
            fontFamily: theme.fontFamily,
          }),
        ],
      })
    }

    this.buildModel(option, plotW, plotH, pad)
    const hover = ctx.hoverIndex
    this.lastHover = hover
    const fillOpacity = option.fillOpacity ?? 0.78
    const children: GroupNode['children'] = []
    const n = labels.length

    // ---- 流带（自左向右逐列揭示；悬停时其余系列压暗） ----
    option.series.forEach((s, si) => {
      const color = s.color ?? theme.colors[si % theme.colors.length]
      const dimmed = hover !== null && !this.isSeriesAt(si, option)
      const topPts = this.buildEdge(si, option, 'top', ctx.progress)
      const bottomPts = this.buildEdge(si, option, 'bottom', ctx.progress)
      if (topPts.length < 2) return
      children.push(
        path(bandPath(topPts, reverse(bottomPts), option.smooth ?? true), {
          key: `band/${si}`,
          fill: withAlpha(color, dimmed ? fillOpacity * 0.35 : fillOpacity),
          cursor: 'pointer',
        })
      )
    })

    // ---- x 轴时间标签 ----
    const labelStep = Math.ceil(n / 16)
    labels.forEach((lb, i) => {
      if (i % labelStep !== 0 && i !== n - 1) return
      children.push(
        text(this.colX[i], pad.top + plotH + 18, lb, {
          key: `xlabel/${i}`,
          anchor: 'middle',
          fontSize: theme.fontSize,
          fill: theme.textColor,
          fontFamily: theme.fontFamily,
        })
      )
    })

    // ---- 悬停竖向参考线 ----
    if (hover !== null && this.colX[hover] != null) {
      const { y, h } = this.plotBox
      children.push(
        path(`M ${r2(this.colX[hover])} ${y} L ${r2(this.colX[hover])} ${y + h}`, {
          key: 'hover-line',
          stroke: withAlpha(theme.textColor, 0.4),
          strokeWidth: 1,
          dash: [4, 3],
        })
      )
    }

    return group({ key: 'plot', children: [group({ key: 'river', children })] })
  }

  /** 命中检测：按 x 找最近时间列 */
  protected hitTest(x: number, y: number): number | null {
    if (this.colX.length === 0) return null
    const { x: bx, w } = this.plotBox
    if (x < bx - 12 || x > bx + w + 12) return null
    let best = 0
    let bestDist = Infinity
    this.colX.forEach((cx, i) => {
      const d = Math.abs(x - cx)
      if (d < bestDist) {
        bestDist = d
        best = i
      }
    })
    return best
  }

  protected getHoverInfo(index: number): HoverInfo {
    if (this.colX[index] == null) return { index, x: 0, y: 0 }
    const cy = this.colCenterY[index] ?? this.plotBox.y + this.plotBox.h / 2
    return { index, x: r2(this.colX[index]), y: r2(cy) }
  }

  // ============ 内部工具 ============

  /** 悬停列上某系列是否有非零值（决定压暗范围） */
  private isSeriesAt(si: number, option: ThemeRiverChartOption): boolean {
    if (this.lastHover === null) return true
    return (option.series[si]?.data[this.lastHover] ?? 0) > 0
  }

  /** 构建流带上 / 下边线点序列（含入场按列裁剪） */
  private buildEdge(si: number, option: ThemeRiverChartOption, edge: 'top' | 'bottom', progress: number): EdgePoint[] {
    const pts: EdgePoint[] = []
    const n = option.labels.length
    for (let i = 0; i < n; i++) {
      // 入场逐列揭示：progress=1 时每列 local 均为 1（含最后一列）
      const local = clamp01(progress * n - i)
      if (local <= 0) break
      const x = i === 0 ? this.colX[0] : this.colX[i - 1] + (this.colX[i] - this.colX[i - 1]) * local
      const y = this.edgeYAt(si, i, option, edge)
      if (pts.length > 0) {
        // 与上一列做插值：保证裁剪时边缘平滑推进
        const prevX = this.colX[i - 1]
        const prevY = this.edgeYAt(si, i - 1, option, edge)
        pts.push({ x, y: prevY + (y - prevY) * local })
      } else {
        pts.push({ x, y })
      }
      if (local < 1) break
    }
    return pts
  }

  /** 第 i 列上第 si 系列指定边（top = 上边缘，bottom = 下边缘）的 y 值 */
  private edgeYAt(si: number, i: number, option: ThemeRiverChartOption, edge: 'top' | 'bottom'): number {
    let cum = 0
    for (let k = 0; k <= si; k++) {
      cum += option.series[k]?.data[i] ?? 0
    }
    const v = edge === 'top' ? cum : cum - (option.series[si]?.data[i] ?? 0)
    const baseY = this.colCenterY[i] ?? 0
    return baseY - v * this.pxPerUnit
  }

  private buildModel(option: ThemeRiverChartOption, plotW: number, plotH: number, pad: Padding): void {
    const sig = JSON.stringify([option.labels, option.series, plotW, plotH])
    if (this.colX.length > 0 && sig === this.cacheSig) return
    this.cacheSig = sig
    this.plotBox = { x: pad.left, y: pad.top, w: plotW, h: plotH }

    const n = option.labels.length
    // 列间距：首尾留半列空隙（流带视觉两侧不贴边）
    const step = plotW / n
    this.colX = option.labels.map((_, i) => pad.left + step * (i + 0.5))

    let maxTotal = 0
    const totals: number[] = []
    for (let i = 0; i < n; i++) {
      let total = 0
      for (const s of option.series) total += s.data[i] ?? 0
      totals.push(total)
      maxTotal = Math.max(maxTotal, total)
    }
    // 上下各留 6% 呼吸空间（最厚列 0.88*plotH 居中）
    this.pxPerUnit = (plotH * 0.88) / Math.max(maxTotal, 1e-9)
    const midY = pad.top + plotH / 2
    // 中心堆叠：每列围绕水平中轴对称，基线（堆叠底）= midY + 列总厚 / 2
    this.colCenterY = totals.map((t) => midY + (t * this.pxPerUnit) / 2)
  }
}

// ============ 纯函数工具 ============

/** 中心对称基线：列中轴 = 中点偏移使流带围绕水平中轴对称 */

/** 闭合带状路径（上边线 + 反向下边线） */
function bandPath(top: EdgePoint[], bottom: EdgePoint[], smooth: boolean): string {
  const toCmd = (pts: EdgePoint[]): string => {
    if (pts.length === 0) return ''
    if (!smooth || pts.length < 3) {
      return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${r2(p.x)} ${r2(p.y)}`).join(' ')
    }
    return smoothPath(pts)
  }
  const bottomCmd = bottom.length === 0 ? '' : ` L ${r2(bottom[0].x)} ${r2(bottom[0].y)} ` + toCmd(bottom).replace(/^M/, '')
  return `${toCmd(top)} ${bottomCmd} Z`
}

/** Catmull-Rom → 三次贝塞尔平滑路径 */
function smoothPath(pts: EdgePoint[]): string {
  let d = `M ${r2(pts[0].x)} ${r2(pts[0].y)}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[Math.min(pts.length - 1, i + 2)]
    const c1x = p1.x + (p2.x - p0.x) / 6
    const c1y = p1.y + (p2.y - p0.y) / 6
    const c2x = p2.x - (p3.x - p1.x) / 6
    const c2y = p2.y - (p3.y - p1.y) / 6
    d += ` C ${r2(c1x)} ${r2(c1y)} ${r2(c2x)} ${r2(c2y)} ${r2(p2.x)} ${r2(p2.y)}`
  }
  return d
}

function reverse(pts: EdgePoint[]): EdgePoint[] {
  return [...pts].reverse()
}

function r2(v: number): number {
  return Math.round(v * 100) / 100
}

function clamp01(v: number): number {
  return clamp(v, 0, 1)
}
