import { BaseChart } from './base-chart'
import { defaultTheme, getSeriesColor } from '../theme'
import type { KChartTheme } from '../theme'
import { group, path, text } from '../scene/nodes'
import type { GroupNode } from '../scene/nodes'
import { withAlpha } from '../utils/color'
import type { HoverInfo, KSunburstDatum, Padding, Point, RenderContext } from '../types'

/** 旭日图配置（注册于 OptionMap['sunburst']） */
export interface SunburstChartOption {
  /** 树形数据（顶层多项同时作为最内环，角度按 value 占比分配） */
  data: KSunburstDatum[]
  /** 内圈半径比例（相对外半径 0~0.8）；默认 0.15 */
  innerRadius?: number
  /** 最小绘制角度（度），小于该值的扇区不绘制；默认 2 */
  minAngle?: number
  /** 径向标签：show 控制开关，minAngle 小于该角度的扇区隐藏标签（度） */
  label?: { show?: boolean, minAngle?: number }
  /** 主题覆盖 */
  theme?: Partial<KChartTheme>
  /** 画布内边距覆盖 */
  padding?: Partial<Padding>
  /** 空数据提示文案 */
  emptyText?: string
}

/** 处理后的树节点（核心层布局与组件层 tooltip 共用，preorder 序号即悬停索引） */
export interface SunburstTreeNode {
  name: string
  /** 有效值：max(显式 value, 子级合计)，保证子级扇区不会溢出父级角度 */
  value: number
  /** 解析后的实色（显式色优先，顶层按色板，子级继承父级色） */
  color: string
  /** 渲染透明度（继承色随层级递减；显式色恒为 1） */
  alpha: number
  depth: number
  parent: SunburstTreeNode | null
  children: SunburstTreeNode[]
  /** 先序遍历序号（= 悬停索引） */
  index: number
}

/** 扇区内部模型（绘制与命中检测共用） */
interface SunburstSector {
  /** 对应树节点先序序号 */
  index: number
  name: string
  value: number
  depth: number
  color: string
  alpha: number
  r0: number
  r1: number
  startT: number
  endT: number
  midT: number
}

interface Layout {
  cx: number
  cy: number
  innerR: number
  ringTh: number
  maxDepth: number
  sectors: SunburstSector[]
  theme: KChartTheme
}

const DEFAULT_PADDING: Padding = { top: 24, right: 24, bottom: 24, left: 24 }
/** 继承色随层级的透明度梯度（depth 0 恒为 1） */
const DEPTH_ALPHA = [1, 0.78, 0.6, 0.46, 0.38]

/**
 * 旭日图
 * 支持：任意深度层级树、径向旋转标签（左右半圆自动翻转保证可读）、
 * 内圈半径比例、最小绘制角度兜底、顶层色板 + 子级继承色降透明度、
 * 顺时针扫描入场动画、悬停扇区高亮其余淡化。
 */
export class SunburstChart extends BaseChart<SunburstChartOption> {
  private layout: Layout | null = null

  protected build(option: SunburstChartOption, ctx: RenderContext): GroupNode {
    const theme: KChartTheme = { ...defaultTheme, ...option.theme }
    const pad: Padding = { ...DEFAULT_PADDING, ...option.padding }
    const plotW = Math.max(0, ctx.width - pad.left - pad.right)
    const plotH = Math.max(0, ctx.height - pad.top - pad.bottom)
    const cx = pad.left + plotW / 2
    const cy = pad.top + plotH / 2

    // ============ 树处理与空数据兜底 ============
    const tree = buildSunburstTree(option.data, theme.colors)
    const total = tree.reduce((sum, n) => sum + n.value, 0)
    if (tree.length === 0 || total <= 0) {
      this.layout = null
      return group({
        key: 'empty',
        children: [
          text(cx, cy, option.emptyText ?? '暂无数据', {
            key: 'empty-text',
            anchor: 'middle',
            fontSize: 14,
            fill: theme.emptyColor,
            fontFamily: theme.fontFamily,
          }),
        ],
      })
    }

    // ============ 几何布局 ============
    // 外半径留 ~12% 呼吸边距，避免圆盘顶满容器高度
    const outerR = Math.max(24, Math.min(plotW / 2, plotH / 2) * 0.88)
    const innerR = clampPx((option.innerRadius ?? 0.15) * outerR, 0, outerR * 0.8)
    const maxDepth = tree.reduce((max, n) => Math.max(max, maxDepthOf(n)), 0)
    // 环数 = 最大深度 + 1（深度从 0 起算），按环数均分才能保证最深环恰好落在外半径上
    const ringTh = (outerR - innerR) / (maxDepth + 1)
    const minAngle = deg2rad(option.minAngle ?? 2)

    const sectors: SunburstSector[] = []
    const assign = (node: SunburstTreeNode, startT: number, span: number): void => {
      const r0 = innerR + node.depth * ringTh
      sectors.push({
        index: node.index,
        name: node.name,
        value: node.value,
        depth: node.depth,
        color: node.color,
        alpha: node.alpha,
        r0,
        r1: r0 + ringTh,
        startT,
        endT: startT + span,
        midT: startT + span / 2,
      })
      let cursor = startT
      for (const child of node.children) {
        const childSpan = (child.value / node.value) * span
        assign(child, cursor, childSpan)
        cursor += childSpan
      }
    }
    let cursorT = 0
    for (const root of tree) {
      const span = (root.value / total) * Math.PI * 2
      assign(root, cursorT, span)
      cursorT += span
    }

    this.layout = { cx, cy, innerR, ringTh, maxDepth, sectors, theme }

    // ============ 扇区（顺时针扫描入场；悬停高亮、其余淡化） ============
    const sweepLimit = Math.PI * 2 * ctx.progress
    const sliceNodes: GroupNode['children'] = []
    for (const s of sectors) {
      if (s.startT >= sweepLimit || s.endT - s.startT < minAngle) continue
      const drawEnd = Math.min(s.endT, sweepLimit)
      if (drawEnd - s.startT < 1e-4) continue
      const hovered = ctx.hoverIndex === s.index
      sliceNodes.push(
        path(sectorPath(cx, cy, s.r0, s.r1, s.startT, drawEnd), {
          key: `sector/${s.index}`,
          fill: s.alpha >= 0.999 ? s.color : withAlpha(s.color, s.alpha),
          stroke: '#FFFFFF',
          strokeWidth: hovered ? 1.5 : 1,
          opacity: ctx.hoverIndex !== null && !hovered ? 0.35 : 1,
          cursor: 'pointer',
        })
      )
    }

    // ============ 径向旋转标签（扫描完成后出现；过窄扇区隐藏） ============
    const labelNodes: GroupNode['children'] = []
    const labelMinAngle = deg2rad(option.label?.minAngle ?? 8)
    if ((option.label?.show ?? true) && ctx.progress >= 1) {
      for (const s of sectors) {
        if (s.endT - s.startT < labelMinAngle) continue
        const hovered = ctx.hoverIndex === s.index
        const dirX = Math.sin(s.midT)
        const dirY = -Math.cos(s.midT)
        // 径向可读性：右半圆沿半径向外读，左半圆翻 180° 从外缘向内读
        const flipped = dirX < 0
        let rot = (Math.atan2(dirY, dirX) * 180) / Math.PI
        if (flipped) rot += 180
        const anchorR = flipped ? s.r1 - 4 : s.r0 + 4
        const p = polar(cx, cy, anchorR, s.midT)
        // 沿文字“下方”偏移约 0.35 字号，使字形垂直居中于径向线
        const px = p.x + -dirY * theme.fontSize * 0.35 * (flipped ? -1 : 1)
        const py = p.y + dirX * theme.fontSize * 0.35 * (flipped ? -1 : 1)
        labelNodes.push(
          text(r2(px), r2(py), s.name, {
            key: `slabel/${s.index}`,
            anchor: flipped ? 'end' : 'start',
            fontSize: theme.fontSize,
            fontWeight: hovered ? 600 : undefined,
            fill: hovered ? theme.colors[0] : theme.textColor,
            fontFamily: theme.fontFamily,
            rotate: r2(rot),
          })
        )
      }
    }

    return group({
      key: 'plot',
      children: [group({ key: 'sectors', children: sliceNodes }), group({ key: 'slabels', children: labelNodes })],
    })
  }

  protected hitTest(x: number, y: number): number | null {
    const layout = this.layout
    if (!layout) return null
    const { cx, cy, innerR, ringTh, maxDepth, sectors } = layout
    const dx = x - cx
    const dy = y - cy
    const dist = Math.hypot(dx, dy)
    const outerR = innerR + ringTh * maxDepth
    if (dist < innerR || dist > outerR) return null
    // 纯平铺数据（maxDepth = 0）时全部落在第 0 环
    const depth = Math.min(Math.max(0, maxDepth - 1), Math.floor((dist - innerR) / ringTh))
    // 顺时针角（自 12 点方向）：atan2(x, -y) 归一化到 [0, 2π)
    let t = Math.atan2(dx, -dy)
    if (t < 0) t += Math.PI * 2
    for (const s of sectors) {
      if (s.depth !== depth) continue
      let start = s.startT
      let end = s.endT
      while (start < 0) {
        start += Math.PI * 2
        end += Math.PI * 2
      }
      while (start > Math.PI * 2) {
        start -= Math.PI * 2
        end -= Math.PI * 2
      }
      const tt = t < start ? t + Math.PI * 2 : t
      if (tt >= start && tt < end) return s.index
    }
    return null
  }

  protected getHoverInfo(index: number): HoverInfo {
    const layout = this.layout
    if (!layout) return { index, x: 0, y: 0 }
    const s = layout.sectors.find((v) => v.index === index)
    if (!s) return { index, x: 0, y: 0 }
    const p = polar(layout.cx, layout.cy, (s.r0 + s.r1) / 2, s.midT)
    return { index, x: r2(p.x), y: r2(p.y) }
  }
}

// ============ 树处理（核心层与组件层共用） ============

/** 构建处理后的旭日树：有效值、先序序号、颜色解析（显式色 > 顶层色板 > 继承父级色） */
export function buildSunburstTree(data: KSunburstDatum[], colors: string[]): SunburstTreeNode[] {
  let rootIdx = 0
  const walk = (d: KSunburstDatum, depth: number): SunburstTreeNode => {
    const children = (d.children ?? []).map((c) => walk(c, depth + 1))
    const childSum = children.reduce((sum, c) => sum + c.value, 0)
    const value = Math.max(d.value ?? 0, childSum, 1e-6)
    let color: string
    let alpha = 1
    if (d.color) {
      color = d.color
    } else if (depth === 0) {
      color = getSeriesColor(colors, rootIdx)
    } else {
      // 占位空串，由父节点回填实色（透明度由 alpha 控制）
      color = ''
      alpha = DEPTH_ALPHA[Math.min(depth, DEPTH_ALPHA.length - 1)]
    }
    const node: SunburstTreeNode = {
      name: d.name,
      value,
      color,
      alpha,
      depth,
      parent: null,
      children,
      index: 0,
    }
    children.forEach((c) => {
      c.parent = node
    })
    if (depth === 0) rootIdx++
    return node
  }
  const roots = data.map((d) => walk(d, 0))
  // 颜色继承下传：未显式指定色的后代节点继承最近祖先实色
  const fillInherit = (node: SunburstTreeNode): void => {
    for (const c of node.children) {
      if (!c.color) c.color = node.color
      fillInherit(c)
    }
  }
  roots.forEach(fillInherit)
  // 子节点先于父节点创建，先序序号需建树后统一分配（保证父 < 子）
  let index = 0
  const assignIndex = (node: SunburstTreeNode): void => {
    node.index = index++
    node.children.forEach(assignIndex)
  }
  roots.forEach(assignIndex)
  return roots
}

/** 先序展平整棵树（index = 数组下标），供组件层 tooltip 解码悬停索引 */
export function flattenSunburstTree(roots: SunburstTreeNode[]): SunburstTreeNode[] {
  const list: SunburstTreeNode[] = []
  const walk = (node: SunburstTreeNode): void => {
    list.push(node)
    node.children.forEach(walk)
  }
  roots.forEach(walk)
  return list
}

// ============ 纯函数工具 ============

function maxDepthOf(node: SunburstTreeNode): number {
  if (node.children.length === 0) return node.depth
  return Math.max(...node.children.map(maxDepthOf))
}

function r2(v: number): number {
  return Math.round(v * 100) / 100
}

function deg2rad(deg: number): number {
  return (deg * Math.PI) / 180
}

function clampPx(v: number, min: number, max: number): number {
  return Math.min(Math.max(v, min), max)
}

/** 极坐标 → 直角坐标（t 自 12 点方向顺时针） */
function polar(cx: number, cy: number, r: number, t: number): Point {
  return { x: cx + r * Math.sin(t), y: cy - r * Math.cos(t) }
}

/**
 * 环形扇区路径（r0 = 0 时退化为实心扇区）
 * 整圆保护：SVG 弧线起止点重合时退化不绘制，留一个不可见的缝隙
 */
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
