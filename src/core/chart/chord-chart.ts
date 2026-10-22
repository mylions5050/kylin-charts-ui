import { BaseChart } from './base-chart'
import { clamp } from '../utils/math'
import { withAlpha } from '../utils/color'
import { defaultTheme, getSeriesColor } from '../theme'
import type { KChartTheme } from '../theme'
import { group, path, text } from '../scene/nodes'
import type { GroupNode } from '../scene/nodes'
import type { HoverInfo, KChordLink, KChordNode, Padding, Point, RenderContext } from '../types'

/** 和弦图配置（注册于 OptionMap['chord']） */
export interface ChordChartOption {
  /** 节点列表（圆上弧段，按数组顺序顺时针排布） */
  nodes: KChordNode[]
  /** 链路列表（弦，source / target 为节点 name） */
  links: KChordLink[]
  /** 节点弧之间的间隙角（度），缺省 3；节点过多时自动压缩 */
  padAngle?: number
  /** 是否显示节点名称标签 */
  label?: { show?: boolean }
  /** 主题覆盖 */
  theme?: Partial<KChartTheme>
  /** 画布内边距覆盖 */
  padding?: Partial<Padding>
  /** 空数据提示文案 */
  emptyText?: string
}

/** 弧段上的链路端点区间（连续角度空间，可越过 2π） */
interface LinkSpan {
  link: KChordLink
  /** 源端弧区间 */
  s0: number
  s1: number
  /** 目标端弧区间 */
  t0: number
  t1: number
}

interface PlacedNode {
  node: KChordNode
  color: string
  /** 流量总额（入 + 出） */
  total: number
  /** 弧区间（连续角度空间） */
  a0: number
  a1: number
}

interface Layout {
  theme: KChartTheme
  cx: number
  cy: number
  /** 弧内 / 外半径 */
  r0: number
  r1: number
  placed: PlacedNode[]
  links: LinkSpan[]
}

const DEFAULT_PADDING: Padding = { top: 32, right: 32, bottom: 32, left: 32 }

/** 弦中心线贝塞尔采样段数 */
const LINK_SAMPLES = 16

/**
 * 和弦图
 * 支持：节点弧长按流量（入 + 出）自动分配、弧间隙角、
 * 弦为两端弧区间 + 中心控制点的二次贝塞尔缎带（缎带宽随流量）、
 * 悬停节点 / 链路高亮（相关弦保持、其余压暗）、径向生长入场动画、
 * 径向旋转标签自动翻转。
 * 悬停索引编码与桑基图一致：节点在前 [0, n)、链路在后 [n, n + m)。
 */
export class ChordChart extends BaseChart<ChordChartOption> {
  private layout: Layout | null = null

  constructor(container: HTMLElement, option: ChordChartOption) {
    super(container, option)
  }

  protected build(option: ChordChartOption, ctx: RenderContext): GroupNode {
    const theme: KChartTheme = { ...defaultTheme, ...option.theme }
    const pad: Padding = { ...DEFAULT_PADDING, ...option.padding }
    const plotW = Math.max(0, ctx.width - pad.left - pad.right)
    const plotH = Math.max(0, ctx.height - pad.top - pad.bottom)
    const cx = pad.left + plotW / 2
    const cy = pad.top + plotH / 2

    // ============ 数据归一化：过滤自环 / 未知节点 / 非法值链路 ============
    const nameSet = new Set(option.nodes.map((n) => n.name))
    const validLinks = option.links.filter(
      (l) => l.source !== l.target && nameSet.has(l.source) && nameSet.has(l.target) && Number.isFinite(l.value) && l.value > 0
    )
    const flows = new Map<string, number>()
    for (const l of validLinks) {
      flows.set(l.source, (flows.get(l.source) ?? 0) + l.value)
      flows.set(l.target, (flows.get(l.target) ?? 0) + l.value)
    }

    // ============ 空数据兜底 ============
    if (option.nodes.length === 0 || (validLinks.length === 0 && flows.size === 0)) {
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

    // ============ 弧段分配（弧长 ∝ 流量，间隙角均摊；零流量节点跳过） ============
    const activeNodes = option.nodes.filter((n) => (flows.get(n.name) ?? 0) > 0)
    const n = activeNodes.length
    const grand = activeNodes.reduce((sum, nd) => sum + (flows.get(nd.name) ?? 0), 0)
    const gapDeg = option.padAngle ?? 3
    const gap = Math.min((gapDeg * Math.PI) / 180, (Math.PI * 2 * 0.4) / Math.max(1, n))
    const usable = Math.max(0.1, Math.PI * 2 - gap * n)
    let cursor = 0
    const placed: PlacedNode[] = activeNodes.map((node) => {
      const total = flows.get(node.name) ?? 0
      const span = (total / grand) * usable
      const pn: PlacedNode = {
        node,
        color: node.color ?? getSeriesColor(theme.colors, option.nodes.indexOf(node)),
        total,
        a0: cursor,
        a1: cursor + span,
      }
      cursor += span + gap
      return pn
    })
    const byName = new Map<string, PlacedNode>()
    for (const pn of placed) byName.set(pn.node.name, pn)

    // ============ 链路端点弧区间（每节点先源端后目标端，按链路顺序分配） ============
    const linkSpans: LinkSpan[] = []
    const cursors = new Map<string, number>()
    for (const pn of placed) cursors.set(pn.node.name, pn.a0)
    for (const l of validLinks) {
      const sp = byName.get(l.source)!
      const tp = byName.get(l.target)!
      const ss = ((l.value / sp.total) * (sp.a1 - sp.a0))
      const ts = ((l.value / tp.total) * (tp.a1 - tp.a0))
      const s0 = cursors.get(l.source)!
      const t0 = cursors.get(l.target)!
      linkSpans.push({ link: l, s0, s1: s0 + ss, t0, t1: t0 + ts })
      cursors.set(l.source, s0 + ss)
      cursors.set(l.target, t0 + ts)
    }

    // ============ 半径（外半径留呼吸边距给径向标签） ============
    const outerR = (Math.min(plotW, plotH) / 2) * 0.78
    const thickness = clamp(outerR * 0.09, 8, 18)
    const r1 = outerR
    const r0 = Math.max(6, outerR - thickness)

    this.layout = { theme, cx, cy, r0, r1, placed, links: linkSpans }

    // ============ 入场：径向自中心生长（半径 × progress） ============
    const g = ctx.progress
    const gr0 = r0 * g
    const gr1 = r1 * g

    const children: GroupNode['children'] = []

    // ============ 弦（缎带：两端弧区间 + 中心控制点二次贝塞尔） ============
    const ribbonNodes: GroupNode['children'] = []
    linkSpans.forEach((ls, k) => {
      const src = byName.get(ls.link.source)!
      let fillAlpha = 0.32
      if (ctx.hoverIndex !== null) {
        if (ctx.hoverIndex < placed.length) {
          const hi = ctx.hoverIndex
          const related = ls.link.source === placed[hi].node.name || ls.link.target === placed[hi].node.name
          fillAlpha = related ? 0.75 : 0.06
        } else {
          fillAlpha = ctx.hoverIndex - placed.length === k ? 0.85 : 0.06
        }
      }
      ribbonNodes.push(
        path(ribbonPath(cx, cy, gr0, ls.s0, ls.s1, ls.t0, ls.t1), {
          key: `ribbon/${k}`,
          fill: withAlpha(src.color, fillAlpha),
        })
      )
    })
    children.push(group({ key: 'ribbons', children: ribbonNodes }))

    // ============ 节点弧段 ============
    const arcNodes: GroupNode['children'] = []
    placed.forEach((pn, i) => {
      let alpha = 0.9
      if (ctx.hoverIndex !== null) {
        if (ctx.hoverIndex < placed.length) {
          alpha = ctx.hoverIndex === i ? 1 : 0.25
        } else {
          const ls = linkSpans[ctx.hoverIndex - placed.length]
          alpha = ls && (ls.link.source === pn.node.name || ls.link.target === pn.node.name) ? 1 : 0.25
        }
      }
      arcNodes.push(
        path(sectorPath(cx, cy, gr0, gr1, pn.a0, pn.a1), {
          key: `arc/${i}`,
          fill: withAlpha(pn.color, alpha),
        })
      )
    })
    children.push(group({ key: 'arcs', children: arcNodes }))

    // ============ 径向旋转标签（左半圈翻转保持可读） ============
    const showLabel = option.label?.show ?? true
    const labelNodes: GroupNode['children'] = []
    if (showLabel) {
      placed.forEach((pn, i) => {
        const midT = (pn.a0 + pn.a1) / 2
        const lr = gr1 + 8
        const flipped = Math.sin(midT) < 0
        const p = polar(cx, cy, lr, midT)
        labelNodes.push(
          text(r2(p.x), r2(p.y), pn.node.name, {
            key: `label/${i}`,
            anchor: flipped ? 'end' : 'start',
            fontSize: theme.fontSize,
            fill: theme.textColor,
            fontFamily: theme.fontFamily,
            opacity: clamp01(ctx.progress * 2 - 0.5),
            rotate: (Math.atan2(-Math.cos(midT), Math.sin(midT)) * 180) / Math.PI + (flipped ? 180 : 0),
          })
        )
      })
    }
    children.push(group({ key: 'labels', children: labelNodes }))

    return group({ key: 'plot', children })
  }

  /**
   * 命中检测：弧段按角度区间命中节点；圆内按弦中心线最近距离命中链路。
   * 返回节点序号 [0, n) 或链路序号 [n, n + m)。
   */
  protected hitTest(x: number, y: number): number | null {
    const layout = this.layout
    if (!layout) return null
    const dx = x - layout.cx
    const dy = y - layout.cy
    const r = Math.hypot(dx, dy)
    if (r > layout.r1 + 2) return null
    let t = Math.atan2(dx, -dy)
    if (t < 0) t += Math.PI * 2

    // 弧段：节点（角度含 2π 回绕情况，t 与 t + 2π 都试）
    if (r >= layout.r0 - 2) {
      for (let i = 0; i < layout.placed.length; i++) {
        const pn = layout.placed[i]
        if ((t >= pn.a0 && t <= pn.a1) || (t + Math.PI * 2 >= pn.a0 && t + Math.PI * 2 <= pn.a1)) {
          return i
        }
      }
      return null
    }

    // 圆内：弦中心线最近距离
    let best = -1
    let bestDist = Infinity
    layout.links.forEach((ls, k) => {
      const mid = this.linkCenterline(ls)
      for (const p of mid) {
        const d = Math.hypot(x - p.x, y - p.y)
        if (d < bestDist) {
          bestDist = d
          best = k
        }
      }
    })
    if (best === -1) return null
    const ls = layout.links[best]
    // 命中阈值：两端缎带半厚的平均（角宽 × 半径）+ 容差
    const srcSpan = ls.s1 - ls.s0
    const tgtSpan = ls.t1 - ls.t0
    const halfThick = ((srcSpan + tgtSpan) / 4) * layout.r0 + 3
    return bestDist <= halfThick ? layout.placed.length + best : null
  }

  protected getHoverInfo(index: number): HoverInfo {
    const layout = this.layout
    if (!layout) return { index, x: 0, y: 0 }
    if (index < layout.placed.length) {
      const pn = layout.placed[index]
      const p = polar(layout.cx, layout.cy, layout.r1, (pn.a0 + pn.a1) / 2)
      return { index, x: r2(p.x), y: r2(p.y) }
    }
    const ls = layout.links[index - layout.placed.length]
    if (!ls) return { index, x: 0, y: 0 }
    const mid = this.linkCenterline(ls)
    const p = mid[Math.floor(mid.length / 2)] ?? { x: layout.cx, y: layout.cy }
    return { index, x: r2(p.x), y: r2(p.y) }
  }

  /** 弦中心线：源端中点 → 中心控制 → 目标端中点的二次贝塞尔采样 */
  private linkCenterline(ls: LinkSpan): Point[] {
    const layout = this.layout!
    const p0 = polar(layout.cx, layout.cy, layout.r0, (ls.s0 + ls.s1) / 2)
    const p1 = polar(layout.cx, layout.cy, layout.r0, (ls.t0 + ls.t1) / 2)
    const pts: Point[] = []
    for (let i = 0; i <= LINK_SAMPLES; i++) {
      const u = i / LINK_SAMPLES
      const v = 1 - u
      pts.push({
        x: v * v * p0.x + 2 * v * u * layout.cx + u * u * p1.x,
        y: v * v * p0.y + 2 * v * u * layout.cy + u * u * p1.y,
      })
    }
    return pts
  }
}

// ============ 纯函数工具 ============

function r2(v: number): number {
  return Math.round(v * 100) / 100
}

function clamp01(v: number): number {
  return clamp(v, 0, 1)
}

/** 极坐标（与饼图 / 旭日图同约定：12 点钟起始、顺时针） */
function polar(cx: number, cy: number, r: number, t: number): Point {
  return { x: cx + r * Math.sin(t), y: cy - r * Math.cos(t) }
}

/** 环形扇区路径（复用旭日图实现，含整圆保护） */
function sectorPath(cx: number, cy: number, r0: number, r1: number, a0: number, a1: number): string {
  const span = a1 - a0
  if (span <= 0 || r1 <= 0) return ''
  const end = span >= Math.PI * 2 - 1e-4 ? a0 + Math.PI * 2 - 1e-4 : a1
  const large = end - a0 > Math.PI ? 1 : 0
  const p1 = polar(cx, cy, r1, a0)
  const p2 = polar(cx, cy, r1, end)
  if (r0 <= 0.5) {
    return `M${r2(cx)},${r2(cy)}L${r2(p1.x)},${r2(p1.y)}A${r2(r1)},${r2(r1)} 0 ${large} 1 ${r2(p2.x)},${r2(p2.y)}Z`
  }
  const p3 = polar(cx, cy, r0, end)
  const p4 = polar(cx, cy, r0, a0)
  return `M${r2(p1.x)},${r2(p1.y)}A${r2(r1)},${r2(r1)} 0 ${large} 1 ${r2(p2.x)},${r2(p2.y)}L${r2(p3.x)},${r2(p3.y)}A${r2(r0)},${r2(r0)} 0 ${large} 0 ${r2(p4.x)},${r2(p4.y)}Z`
}

/** 弦缎带路径：两侧中心二次贝塞尔 + 两端沿圆弧的扇形边（贴合节点弧内缘，消除弦切月牙缺口） */
function ribbonPath(
  cx: number,
  cy: number,
  r: number,
  s0: number,
  s1: number,
  t0: number,
  t1: number
): string {
  if (r <= 0.5 || s1 <= s0 || t1 <= t0) return ''
  const a = polar(cx, cy, r, s0)
  const b = polar(cx, cy, r, t0)
  const c = polar(cx, cy, r, t1)
  const d = polar(cx, cy, r, s1)
  const cc = `${r2(cx)},${r2(cy)}`
  const largeT = t1 - t0 > Math.PI ? 1 : 0
  const largeS = s1 - s0 > Math.PI ? 1 : 0
  return (
    `M${r2(a.x)},${r2(a.y)}` +
    `Q${cc} ${r2(b.x)},${r2(b.y)}` +
    // 目标端端面：沿圆弧正向扫过 [t0, t1]
    `A${r2(r)},${r2(r)} 0 ${largeT} 1 ${r2(c.x)},${r2(c.y)}` +
    `Q${cc} ${r2(d.x)},${r2(d.y)}` +
    // 源端端面：沿圆弧反向扫回 [s1, s0]
    `A${r2(r)},${r2(r)} 0 ${largeS} 0 ${r2(a.x)},${r2(a.y)}` +
    'Z'
  )
}
