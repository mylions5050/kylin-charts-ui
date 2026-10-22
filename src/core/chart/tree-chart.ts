import { BaseChart } from './base-chart'
import { clamp } from '../utils/math'
import { withAlpha } from '../utils/color'
import { defaultTheme } from '../theme'
import type { KChartTheme } from '../theme'
import { circle, group, path, text } from '../scene/nodes'
import type { GroupNode } from '../scene/nodes'
import type { HoverInfo, KTreeDatum, Padding, RenderContext } from '../types'
import { buildSunburstTree, flattenSunburstTree } from './sunburst-chart'
import type { SunburstTreeNode } from './sunburst-chart'

/** 树图布局方向：横向（左→右）/ 纵向（上→下）/ 径向 */
export type TreeOrient = 'horizontal' | 'vertical' | 'radial'

/** 树图配置（注册于 OptionMap['tree']） */
export interface TreeChartOption {
  /** 树数据（顶层多项时作为多棵并排的森林） */
  data: KTreeDatum[]
  /** 布局方向，缺省横向 */
  orient?: TreeOrient
  /** 层间距 px（径向布局忽略该项，自动均分半径）；缺省自动填满绘图区 */
  levelGap?: number
  /** 叶节点间距上限 px（空间不足时自动压缩以适配容器） */
  nodeGap?: number
  /** 节点半径 px */
  nodeRadius?: number
  /** 是否显示节点标签 */
  label?: { show?: boolean }
  /** 主题覆盖 */
  theme?: Partial<KChartTheme>
  /** 画布内边距覆盖 */
  padding?: Partial<Padding>
  /** 空数据提示文案 */
  emptyText?: string
}

/** 布局后的节点（像素坐标 + 标签定位，hover 索引 = 先序序号） */
interface PlacedNode {
  node: SunburstTreeNode
  /** 逻辑坐标：depth 沿主轴、cross 沿叶序轴（径向映射的输入） */
  d: number
  c: number
  px: number
  py: number
  /** 标签锚点坐标 */
  lx: number
  ly: number
  anchor: 'start' | 'middle' | 'end'
  /** 径向布局的标签旋转角度（度） */
  rotate?: number
}

interface Layout {
  orient: TreeOrient
  theme: KChartTheme
  placed: PlacedNode[]
  maxDepth: number
  nodeRadius: number
  /** 径向布局参数（圆心 / 最大半径 / 叶序轴值域），非径向仅 plotY/plotH 有意义 */
  cx: number
  cy: number
  rMax: number
  plotY: number
  plotH: number
}

const RADIAL_LABEL_FACTOR = 0.72

/** 径向连线逻辑空间贝塞尔的采样段数 */
const LINK_SAMPLES = 14

/**
 * 树图
 * 支持：横向（左→右）/ 纵向（上→下）/ 径向三种布局、多根森林、
 * 叶节点等距排布 + 父节点居中对齐（空间不足自动压缩叶距）、
 * 正交平滑贝塞尔连线 / 径向逻辑空间采样曲线连线、节点色继承 + 层级透明度衰减、
 * 逐层入场动画、悬停节点高亮环 + 最近点命中。
 * 悬停索引 = 树先序遍历序号（复用 buildSunburstTree 保证组件层同源解码）。
 */
export class TreeChart extends BaseChart<TreeChartOption> {
  private layout: Layout | null = null

  constructor(container: HTMLElement, option: TreeChartOption) {
    super(container, option)
  }

  protected build(option: TreeChartOption, ctx: RenderContext): GroupNode {
    const theme: KChartTheme = { ...defaultTheme, ...option.theme }
    const orient = option.orient ?? 'horizontal'
    const nodeRadius = option.nodeRadius ?? 6

    // 按方向给标签预留不对称内边距（横向左右各留 140，纵向上下各留 40）
    const DEFAULT_PAD: Padding =
      orient === 'horizontal'
        ? { top: 24, right: 140, bottom: 24, left: 140 }
        : orient === 'vertical'
          ? { top: 40, right: 24, bottom: 40, left: 24 }
          : { top: 24, right: 24, bottom: 24, left: 24 }
    const pad: Padding = { ...DEFAULT_PAD, ...option.padding }
    const plotX = pad.left
    const plotY = pad.top
    const plotW = Math.max(0, ctx.width - pad.left - pad.right)
    const plotH = Math.max(0, ctx.height - pad.top - pad.bottom)

    // ============ 树构建（复用旭日图的值汇总 + 色继承 + 先序编号） ============
    const roots = buildSunburstTree(option.data, theme.colors)
    const nodes = flattenSunburstTree(roots)
    if (nodes.length === 0) {
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
    const leafCount = nodes.filter((n) => n.children.length === 0).length
    const maxDepth = nodes.reduce((m, n) => Math.max(m, n.depth), 0)
    const isRoot = (n: SunburstTreeNode): boolean => n.parent === null

    // ============ 逻辑坐标布局（叶序等距 + 父居中） ============
    // cross 轴：横向/径向为 y，纵向为 x；叶距取 nodeGap 与可用空间的较小者
    const leafStep =
      orient === 'vertical'
        ? Math.min(option.nodeGap ?? 20, plotW / Math.max(1, leafCount))
        : Math.min(option.nodeGap ?? 20, plotH / Math.max(1, leafCount))
    const crossStart =
      orient === 'vertical' ? plotX + (plotW - leafCount * leafStep) / 2 : plotY + (plotH - leafCount * leafStep) / 2
    const autoLevelGap =
      orient === 'vertical'
        ? (plotH - 2 * nodeRadius) / Math.max(1, maxDepth)
        : (plotW - 2 * nodeRadius) / Math.max(1, maxDepth)
    const levelGap = option.levelGap ?? autoLevelGap
    const mainAt = (depth: number): number =>
      orient === 'vertical' ? plotY + nodeRadius + depth * levelGap : plotX + nodeRadius + depth * levelGap

    // 递归布局：叶节点按序占据 cross 轴槽位，父节点取首尾子节点中点
    const crossOf = new Map<SunburstTreeNode, number>()
    let leafCursor = 0
    const place = (node: SunburstTreeNode): number => {
      if (node.children.length === 0) {
        const c = crossStart + leafCursor * leafStep + leafStep / 2
        leafCursor++
        crossOf.set(node, c)
        return c
      }
      const cs = node.children.map(place)
      const c = (cs[0] + cs[cs.length - 1]) / 2
      crossOf.set(node, c)
      return c
    }
    roots.forEach(place)

    // ============ 逻辑坐标 → 像素坐标 ============
    const radial = orient === 'radial'
    const cx = pad.left + plotW / 2
    const cy = pad.top + plotH / 2
    const rMax = (Math.min(plotW, plotH) / 2) * RADIAL_LABEL_FACTOR
    /** 径向映射（极坐标约定与饼图一致：12 点钟起始、顺时针）；非径向直角映射 */
    const toPixel = (d: number, c: number): { x: number; y: number; t: number; r: number } => {
      if (!radial) {
        return orient === 'vertical'
          ? { x: c, y: mainAt(d), t: 0, r: 0 }
          : { x: mainAt(d), y: c, t: 0, r: 0 }
      }
      const t = (clamp(c - plotY, 0, plotH) / Math.max(1e-6, plotH)) * Math.PI * 2
      const r = (d / Math.max(1, maxDepth)) * rMax
      return { x: cx + r * Math.sin(t), y: cy - r * Math.cos(t), t, r }
    }

    const placed: PlacedNode[] = nodes.map((node) => {
      const d = node.depth
      const c = crossOf.get(node) ?? 0
      const p = toPixel(d, c)
      const isLeaf = node.children.length === 0
      let lx = p.x
      let ly = p.y
      let anchor: PlacedNode['anchor'] = 'start'
      let rotate: number | undefined
      if (radial) {
        // 径向标签：沿半径方向旋转，右半圈向外、左半圈翻转 180° 保持可读
        const flipped = Math.sin(p.t) < 0
        const rr = p.r + nodeRadius + 8
        lx = cx + rr * Math.sin(p.t)
        ly = cy - rr * Math.cos(p.t)
        anchor = flipped ? 'end' : 'start'
        rotate = (Math.atan2(-Math.cos(p.t), Math.sin(p.t)) * 180) / Math.PI + (flipped ? 180 : 0)
      } else if (orient === 'vertical') {
        anchor = 'middle'
        ly = isLeaf ? p.y + nodeRadius + theme.fontSize + 6 : p.y - nodeRadius - 8
      } else {
        anchor = isLeaf ? 'start' : 'end'
        lx = isLeaf ? p.x + nodeRadius + 6 : p.x - nodeRadius - 6
        ly = p.y + theme.fontSize / 2 - 1
      }
      return { node, d, c, px: p.x, py: p.y, lx, ly, anchor, rotate }
    })

    this.layout = { orient, theme, placed, maxDepth, nodeRadius, cx, cy, rMax, plotY, plotH }

    const children: GroupNode['children'] = []

    // ============ 连线（随子层级淡入） ============
    const levelTotal = maxDepth + 1
    const byNode = new Map<SunburstTreeNode, PlacedNode>()
    for (const pn of placed) byNode.set(pn.node, pn)
    const linkNodes: GroupNode['children'] = []
    for (const pn of placed) {
      const parent = pn.node.parent
      if (!parent) continue
      const pp = byNode.get(parent)
      if (!pp) continue
      const local = clamp01(ctx.progress * levelTotal - pn.node.depth)
      if (local <= 0) continue
      linkNodes.push(
        path(this.linkPath(pp, pn, maxDepth), {
          key: `link/${pn.node.index}`,
          stroke: pn.node.color,
          strokeWidth: 1.5,
          opacity: 0.45 * local,
        })
      )
    }
    children.push(group({ key: 'links', children: linkNodes }))

    // ============ 节点 + 标签（逐层缩放入场；根节点稍大） ============
    const nodeNodes: GroupNode['children'] = []
    const labelNodes: GroupNode['children'] = []
    const showLabel = option.label?.show ?? true
    for (const pn of placed) {
      const local = clamp01(ctx.progress * levelTotal - pn.node.depth)
      if (local <= 0) continue
      const baseR = isRoot(pn.node) ? nodeRadius * 1.3 : nodeRadius
      const fill = pn.node.alpha >= 0.999 ? pn.node.color : withAlpha(pn.node.color, pn.node.alpha)
      nodeNodes.push(
        circle(r2(pn.px), r2(pn.py), Math.max(0.5, baseR * local), {
          key: `node/${pn.node.index}`,
          fill,
        })
      )
      if (showLabel) {
        labelNodes.push(
          text(r2(pn.lx), r2(pn.ly), pn.node.name, {
            key: `nodelabel/${pn.node.index}`,
            anchor: pn.anchor,
            fontSize: theme.fontSize,
            fill: theme.textColor,
            fontFamily: theme.fontFamily,
            opacity: local,
            ...(pn.rotate != null ? { rotate: pn.rotate } : {}),
          })
        )
      }
    }
    children.push(group({ key: 'nodes', children: nodeNodes }))
    children.push(group({ key: 'labels', children: labelNodes }))

    // ============ 悬停节点高亮环 ============
    if (ctx.hoverIndex !== null && ctx.hoverIndex < placed.length) {
      const hp = placed[ctx.hoverIndex]
      children.push(
        circle(r2(hp.px), r2(hp.py), (isRoot(hp.node) ? nodeRadius * 1.3 : nodeRadius) + 4, {
          key: 'hover-ring',
          fill: 'none',
          stroke: hp.node.color,
          strokeWidth: 2,
        })
      )
    }

    return group({ key: 'plot', children })
  }

  /** 连线路径：正交方向为平滑贝塞尔；径向为逻辑空间贝塞尔采样后逐点极坐标映射 */
  private linkPath(from: PlacedNode, to: PlacedNode, maxDepth: number): string {
    const layout = this.layout
    if (!layout) return ''
    if (layout.orient === 'vertical') {
      const my = r2((from.py + to.py) / 2)
      return `M${r2(from.px)},${r2(from.py)}C${r2(from.px)},${my} ${r2(to.px)},${my} ${r2(to.px)},${r2(to.py)}`
    }
    if (layout.orient === 'horizontal') {
      const mx = r2((from.px + to.px) / 2)
      return `M${r2(from.px)},${r2(from.py)}C${mx},${r2(from.py)} ${mx},${r2(to.py)} ${r2(to.px)},${r2(to.py)}`
    }
    // 径向：在 (深度, cross) 逻辑空间构造贝塞尔（控制点取中间深度），采样映射回极坐标
    const d0 = from.d
    const c0 = from.c
    const d1 = to.d
    const c1 = to.c
    const dm = (d0 + d1) / 2
    const segments: string[] = []
    for (let i = 0; i <= LINK_SAMPLES; i++) {
      const t = i / LINK_SAMPLES
      // 三次贝塞尔：P0=(d0,c0) C1=(dm,c0) C2=(dm,c1) P3=(d1,c1)
      const u = 1 - t
      const d = u * u * u * d0 + 3 * u * u * t * dm + 3 * u * t * t * dm + t * t * t * d1
      const c = u * u * u * c0 + 3 * u * u * t * c0 + 3 * u * t * t * c1 + t * t * t * c1
      const p = this.toRadialPixel(d, c, maxDepth)
      segments.push(`${i === 0 ? 'M' : 'L'}${r2(p.x)},${r2(p.y)}`)
    }
    return segments.join('')
  }

  /** 径向逻辑坐标 → 像素坐标（连线采样用，与 toPixel 径向分支同源） */
  private toRadialPixel(d: number, c: number, maxDepth: number): { x: number; y: number } {
    const layout = this.layout!
    const t = (clamp(c - layout.plotY, 0, layout.plotH) / Math.max(1e-6, layout.plotH)) * Math.PI * 2
    const r = (d / Math.max(1, maxDepth)) * layout.rMax
    return { x: layout.cx + r * Math.sin(t), y: layout.cy - r * Math.cos(t) }
  }

  /** 最近点命中：指针阈值内取距离最小的节点（索引 = 先序序号） */
  protected hitTest(x: number, y: number): number | null {
    const layout = this.layout
    if (!layout) return null
    let best = -1
    let bestDist = Infinity
    for (const pn of layout.placed) {
      const dx = x - pn.px
      const dy = y - pn.py
      const dist = dx * dx + dy * dy
      if (dist < bestDist) {
        bestDist = dist
        best = pn.node.index
      }
    }
    if (best === -1) return null
    const threshold = Math.max(10, layout.nodeRadius + 4)
    return bestDist <= threshold * threshold ? best : null
  }

  protected getHoverInfo(index: number): HoverInfo {
    const pn = this.layout?.placed[index]
    if (!pn) return { index, x: 0, y: 0 }
    return { index, x: r2(pn.px), y: r2(pn.py) }
  }
}

// ============ 纯函数工具 ============

function r2(v: number): number {
  return Math.round(v * 100) / 100
}

function clamp01(v: number): number {
  return clamp(v, 0, 1)
}
