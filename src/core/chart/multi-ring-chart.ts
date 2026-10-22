import { BaseChart } from './base-chart'
import { clamp } from '../utils/math'
import { withAlpha } from '../utils/color'
import { defaultTheme } from '../theme'
import type { KChartTheme } from '../theme'
import { circle, group, path, text } from '../scene/nodes'
import type { GroupNode } from '../scene/nodes'
import type { HoverInfo, KColor, KProgressDatum, Padding, RenderContext } from '../types'

/** 多层进度环配置 */
export interface MultiRingChartOption {
  /** 数据列表（每项一环，由外向内排布） */
  data: KProgressDatum[]
  /** 环间距 px，缺省 8 */
  ringGap?: number
  /** 中心是否显示综合完成率（各环平均），缺省 true */
  showSummary?: boolean
  theme?: Partial<KChartTheme>
  padding?: Partial<Padding>
  emptyText?: string
}

const DEFAULT_PADDING: Padding = { top: 20, right: 20, bottom: 20, left: 20 }
/** 最内侧保留半径（给综合文本留空间） */
const INNER_RESERVE = 18

/** 环布局（命中检测 / tooltip 定位共用） */
interface RingItem {
  r: number
  band: number
  pct: number
  datum: KProgressDatum
  /** 环色：纯色或渐变配置（绘制时 resolvePaint，track 取纯色兜底） */
  color: KColor
}

/**
 * 多层进度环（Multi Ring）
 * 多个指标各占一环、由外向内嵌套：底环 + 进度弧，中心展示综合完成率。
 * 入场：各环错峰扫弧。悬停索引 = 环下标（0 为最外环）。
 */
export class MultiRingChart extends BaseChart<MultiRingChartOption> {
  private rings: RingItem[] = []
  private cx = 0
  private cy = 0
  private cacheSig = ''

  protected build(option: MultiRingChartOption, ctx: RenderContext): GroupNode {
    const theme: KChartTheme = { ...defaultTheme, ...option.theme }
    const pad: Padding = { ...DEFAULT_PADDING, ...option.padding }
    const plotW = Math.max(0, ctx.width - pad.left - pad.right)
    const plotH = Math.max(0, ctx.height - pad.top - pad.bottom)
    if (option.data.length === 0 || plotW <= 0 || plotH <= 0) {
      this.rings = []
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

    this.cx = pad.left + plotW / 2
    this.cy = pad.top + plotH / 2
    this.buildModel(option, theme, plotW, plotH)

    const children: GroupNode['children'] = []
    const n = this.rings.length

    this.rings.forEach((ring, i) => {
      // 入场：各环错峰扫弧
      const sweepT = ring.pct * clamp01(ctx.progress * 1.4 - i * 0.15)
      const fade = clamp01(ctx.progress * 2)

      // 底环
      children.push(
        circle(this.cx, this.cy, ring.r, {
          key: `track/${i}`,
          fill: 'none',
          stroke: withAlpha(this.solidColor(ring.color), 0.12),
          strokeWidth: ring.band,
          opacity: fade,
          cursor: 'pointer',
        })
      )

      // 进度弧（从 12 点方向顺时针；接近整圆用 circle 兜底）
      if (sweepT > 0.001) {
        if (sweepT >= 0.999) {
          children.push(
            circle(this.cx, this.cy, ring.r, {
              key: `progress/${i}`,
              fill: 'none',
              stroke: this.resolvePaint(ring.color),
              strokeWidth: ring.band,
              opacity: fade,
              cursor: 'pointer',
            })
          )
        } else {
          children.push(
            path(arcPath(this.cx, this.cy, ring.r, 90, 90 - 360 * sweepT), {
              key: `progress/${i}`,
              stroke: this.resolvePaint(ring.color),
              strokeWidth: ring.band,
              opacity: fade,
              cursor: 'pointer',
            })
          )
        }
      }
    })

    // ---- 中心综合完成率 ----
    if (option.showSummary ?? true) {
      const innerR = this.rings.length > 0 ? this.rings[this.rings.length - 1].r - this.rings[this.rings.length - 1].band / 2 : 0
      const avg = this.rings.reduce((s, r) => s + r.pct, 0) / Math.max(1, this.rings.length)
      const font = Math.max(14, Math.min(30, Math.round(innerR * 0.62)))
      children.push(
        text(this.cx, this.cy + font * 0.34, `${Math.round(avg * 1000) / 10}%`, {
          key: 'summary',
          anchor: 'middle',
          fontSize: font,
          fontWeight: 700,
          fill: theme.textColor,
          fontFamily: theme.fontFamily,
          opacity: clamp01((ctx.progress - 0.3) * 2.5),
        })
      )
    }

    return group({ key: 'plot', children: [group({ key: 'rings', children })] })
  }

  /** 命中检测：按到圆心的距离找最近环带 */
  protected hitTest(x: number, y: number): number | null {
    if (this.rings.length === 0) return null
    const d = Math.hypot(x - this.cx, y - this.cy)
    for (let i = 0; i < this.rings.length; i++) {
      if (Math.abs(d - this.rings[i].r) <= this.rings[i].band / 2 + 4) return i
    }
    return null
  }

  protected getHoverInfo(index: number): HoverInfo {
    const ring = this.rings[index]
    if (!ring) return { index, x: 0, y: 0 }
    return { index, x: r2(this.cx), y: r2(this.cy - ring.r) }
  }

  // ============ 布局（签名缓存） ============

  private buildModel(option: MultiRingChartOption, theme: KChartTheme, plotW: number, plotH: number): void {
    const sig = JSON.stringify([option.data, option.ringGap, plotW, plotH])
    if (this.rings.length > 0 && sig === this.cacheSig) return
    this.cacheSig = sig

    const gap = option.ringGap ?? 8
    const outerR = Math.min(plotW, plotH) / 2 * 0.85
    const n = option.data.length
    const band = Math.max(6, (outerR - INNER_RESERVE - gap * Math.max(0, n - 1)) / n)

    this.rings = option.data.map((datum, i) => {
      const max = datum.max ?? 100
      const value = clamp(datum.value, 0, max)
      return {
        r: outerR - i * (band + gap) - band / 2,
        band,
        pct: max > 0 ? value / max : 0,
        datum,
        color: datum.color ?? theme.colors[i % theme.colors.length],
      }
    })
  }
}

// ============ 几何工具 ============

/** 角度 → 点（数学角：0 = 3 点方向，逆时针为正，屏幕 y 翻转） */
function polarPt(cx: number, cy: number, r: number, deg: number): { x: number; y: number } {
  const a = (deg * Math.PI) / 180
  return { x: cx + r * Math.cos(a), y: cy - r * Math.sin(a) }
}

/** 从 a0 顺时针扫到 a1（a1 < a0）的弧线路径 */
function arcPath(cx: number, cy: number, r: number, a0: number, a1: number): string {
  const p0 = polarPt(cx, cy, r, a0)
  const p1 = polarPt(cx, cy, r, a1)
  const delta = Math.abs(a0 - a1)
  const large = delta > 180 ? 1 : 0
  return `M ${r2(p0.x)} ${r2(p0.y)} A ${r2(r)} ${r2(r)} 0 ${large} 1 ${r2(p1.x)} ${r2(p1.y)}`
}

function r2(v: number): number {
  return Math.round(v * 100) / 100
}

function clamp01(v: number): number {
  return clamp(v, 0, 1)
}
