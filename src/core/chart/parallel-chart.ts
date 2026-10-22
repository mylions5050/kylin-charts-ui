import { BaseChart } from './base-chart'
import { clamp } from '../utils/math'
import { withAlpha } from '../utils/color'
import { LinearScale } from '../scale'
import { niceTicks } from '../utils/math'
import { defaultTheme } from '../theme'
import type { KChartTheme } from '../theme'
import { group, path, text } from '../scene/nodes'
import type { GroupNode } from '../scene/nodes'
import type { HoverInfo, KParallelDatum, KParallelDimension, Padding, RenderContext } from '../types'

/** 平行坐标配置 */
export interface ParallelChartOption {
  /** 维度列表（每项一条竖轴） */
  dimensions: KParallelDimension[]
  /** 数据记录（values 与 dimensions 一一对应） */
  data: KParallelDatum[]
  /** 线宽 px，缺省 2 */
  lineWidth?: number
  /** 是否显示轴刻度值，缺省 true */
  axisTick?: { show?: boolean }
  theme?: Partial<KChartTheme>
  padding?: Partial<Padding>
  emptyText?: string
}

const DEFAULT_PADDING: Padding = { top: 24, right: 48, bottom: 44, left: 48 }

/** 每维度的轴布局（绘制与命中检测共用） */
interface ParallelAxis {
  x: number
  scale: LinearScale
  dim: KParallelDimension
}

/**
 * 平行坐标图（Parallel Coordinates）
 * 多维数据：每维一条竖轴均匀分布，每条记录是一条横穿各轴的折线。
 * 悬停索引 = 数据下标（按折线段最近距离命中）；入场折线自左向右逐段延伸。
 */
export class ParallelChart extends BaseChart<ParallelChartOption> {
  private axes: ParallelAxis[] = []
  private plotBox: { x: number; y: number; w: number; h: number } = { x: 0, y: 0, w: 0, h: 0 }
  private cacheSig = ''

  protected build(option: ParallelChartOption, ctx: RenderContext): GroupNode {
    const theme: KChartTheme = { ...defaultTheme, ...option.theme }
    const pad: Padding = { ...DEFAULT_PADDING, ...option.padding }
    const plotW = Math.max(0, ctx.width - pad.left - pad.right)
    const plotH = Math.max(0, ctx.height - pad.top - pad.bottom)
    const dims = option.dimensions
    if (dims.length < 2 || option.data.length === 0 || plotW <= 0 || plotH <= 0) {
      this.axes = []
      return group({
        key: 'empty',
        children: [
          text(ctx.width / 2, ctx.height / 2, dims.length < 2 ? '平行坐标至少需要 2 个维度' : option.emptyText ?? '暂无数据', {
            anchor: 'middle',
            fontSize: 14,
            fill: theme.emptyColor,
            fontFamily: theme.fontFamily,
          }),
        ],
      })
    }

    this.buildAxes(option, plotW, plotH, pad)
    const showTick = option.axisTick?.show ?? true
    const lineWidth = option.lineWidth ?? 2
    const hover = ctx.hoverIndex
    const children: GroupNode['children'] = []

    // ---- 竖轴 + 刻度 + 维度名 ----
    this.axes.forEach((ax, i) => {
      children.push(
        path(`M ${r2(ax.x)} ${pad.top} L ${r2(ax.x)} ${pad.top + plotH}`, {
          key: `axis/${i}`,
          stroke: theme.axisLineColor,
          strokeWidth: 1,
        })
      )
      if (showTick) {
        const ticks = niceTicks(ax.scale.domain$[0], ax.scale.domain$[1], 5)
        const d0 = ax.scale.domain$[0]
        const d1 = ax.scale.domain$[1]
        for (const t of ticks.ticks) {
          // niceTicks 边界可能超出数据 domain，越界刻度不画（避免与维度名重叠）
          if (t < d0 - 1e-9 || t > d1 + 1e-9) continue
          const y = clamp(ax.scale.scale(t), pad.top, pad.top + plotH)
          children.push(
            text(ax.x + 5, y + 4, formatTick(t), {
              key: `tick/${i}/${t}`,
              anchor: 'start',
              fontSize: theme.fontSize,
              fill: theme.textColor,
              fontFamily: theme.fontFamily,
              opacity: 0.75,
            })
          )
        }
      }
      children.push(
        text(ax.x, pad.top + plotH + 22, ax.dim.name, {
          key: `dimname/${i}`,
          anchor: 'middle',
          fontSize: theme.fontSize,
          fontWeight: 600,
          fill: theme.textColor,
          fontFamily: theme.fontFamily,
        })
      )
    })

    // ---- 数据折线（入场逐段延伸） ----
    const segTotal = Math.max(1, dims.length - 1)
    option.data.forEach((datum, di) => {
      const color = datum.color ?? theme.colors[di % theme.colors.length]
      const dimmed = hover !== null && hover !== di
      const opacity = dimmed ? 0.12 : 0.85
      const width = hover === di ? lineWidth + 1 : lineWidth
      // 逐段构建（含入场裁剪）
      let d = ''
      let prevPt: { x: number; y: number } | null = null
      for (let k = 0; k < segTotal; k++) {
        const local = clamp01(ctx.progress * segTotal - k)
        if (local <= 0) break
        const p0 = this.pointAt(k, datum)
        const p1 = this.pointAt(k + 1, datum)
        if (!p0 || !p1) {
          prevPt = null
          continue
        }
        const segEnd = { x: p0.x + (p1.x - p0.x) * local, y: p0.y + (p1.y - p0.y) * local }
        if (!prevPt) {
          d += `M ${r2(p0.x)} ${r2(p0.y)} L ${r2(segEnd.x)} ${r2(segEnd.y)}`
        } else {
          d += ` M ${r2(prevPt.x)} ${r2(prevPt.y)} L ${r2(segEnd.x)} ${r2(segEnd.y)}`
        }
        prevPt = local >= 1 ? p1 : null
        if (local < 1) break
      }
      if (d) {
        children.push(
          path(d, {
            key: `line/${di}`,
            stroke: withAlpha(color, 1),
            strokeWidth: width,
            opacity,
            cursor: 'pointer',
          })
        )
      }
    })

    return group({ key: 'plot', children: [group({ key: 'parallel', children })] })
  }

  /** 命中检测：到各记录折线的最近距离 ≤ 6px 则命中该记录 */
  protected hitTest(x: number, y: number): number | null {
    const dims = this.axes.length
    if (dims < 2) return null
    let best: number | null = null
    let bestDist = 6
    const option = this.option
    option.data.forEach((datum, di) => {
      for (let k = 0; k < dims - 1; k++) {
        const p0 = this.pointAt(k, datum)
        const p1 = this.pointAt(k + 1, datum)
        if (!p0 || !p1) continue
        const d = distToSegment(x, y, p0, p1)
        if (d < bestDist) {
          bestDist = d
          best = di
        }
      }
    })
    return best
  }

  protected getHoverInfo(index: number): HoverInfo {
    const datum = this.option.data[index]
    if (!datum || this.axes.length < 2) return { index, x: 0, y: 0 }
    // 引导点取第一条有效段的中点
    for (let k = 0; k < this.axes.length - 1; k++) {
      const p0 = this.pointAt(k, datum)
      const p1 = this.pointAt(k + 1, datum)
      if (p0 && p1) {
        return { index, x: r2((p0.x + p1.x) / 2), y: r2((p0.y + p1.y) / 2) }
      }
    }
    return { index, x: 0, y: 0 }
  }

  // ============ 内部工具 ============

  /** 第 i 维上该记录的点（值缺失返回 null，折线断开） */
  private pointAt(i: number, datum: KParallelDatum): { x: number; y: number } | null {
    const ax = this.axes[i]
    const v = datum.values[i]
    if (!ax || v == null || !Number.isFinite(v)) return null
    return { x: ax.x, y: ax.scale.scale(clamp(v, ax.scale.domain$[0], ax.scale.domain$[1])) }
  }

  private buildAxes(option: ParallelChartOption, plotW: number, plotH: number, pad: Padding): void {
    const sig = JSON.stringify([option.dimensions, option.data, plotW, plotH])
    if (this.axes.length > 0 && sig === this.cacheSig) return
    this.cacheSig = sig
    this.plotBox = { x: pad.left, y: pad.top, w: plotW, h: plotH }

    const n = option.dimensions.length
    this.axes = option.dimensions.map((dim, i) => {
      let vmin = Infinity
      let vmax = -Infinity
      for (const datum of option.data) {
        const v = datum.values[i]
        if (v == null || !Number.isFinite(v)) continue
        vmin = Math.min(vmin, v)
        vmax = Math.max(vmax, v)
      }
      if (!Number.isFinite(vmin)) {
        vmin = 0
        vmax = 1
      }
      const min = dim.min ?? vmin
      const max = dim.max ?? vmax
      return {
        x: pad.left + (n === 1 ? plotW / 2 : (i / (n - 1)) * plotW),
        scale: LinearScale.of([min, max], [pad.top + plotH, pad.top]),
        dim,
      }
    })
  }
}

// ============ 纯函数工具 ============

function distToSegment(px: number, py: number, a: { x: number; y: number }, b: { x: number; y: number }): number {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const len2 = dx * dx + dy * dy
  if (len2 === 0) return Math.hypot(px - a.x, py - a.y)
  let t = ((px - a.x) * dx + (py - a.y) * dy) / len2
  t = clamp(t, 0, 1)
  return Math.hypot(px - (a.x + t * dx), py - (a.y + t * dy))
}

function formatTick(v: number): string {
  if (Math.abs(v) >= 1000) return `${Math.round(v / 100) / 10}k`
  return Number.isInteger(v) ? String(v) : String(Math.round(v * 100) / 100)
}

function r2(v: number): number {
  return Math.round(v * 100) / 100
}

function clamp01(v: number): number {
  return clamp(v, 0, 1)
}
