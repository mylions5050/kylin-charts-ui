import { BaseChart } from './base-chart'
import { clamp } from '../utils/math'
import { withAlpha } from '../utils/color'
import { defaultTheme } from '../theme'
import type { KChartTheme } from '../theme'
import { circle, group, text } from '../scene/nodes'
import type { GroupNode } from '../scene/nodes'
import { buildSunburstTree } from './sunburst-chart'
import type { SunburstTreeNode } from './sunburst-chart'
import type { HoverInfo, KTreeDatum, Padding, RenderContext } from '../types'

/** 打包图配置 */
export interface CirclePackingChartOption {
  /** 层级数据（复用 KTreeDatum） */
  data: KTreeDatum[]
  /** 圆之间的间距 px，缺省 6 */
  gap?: number
  /** 是否显示节点名称标签，缺省 true */
  label?: { show?: boolean }
  theme?: Partial<KChartTheme>
  padding?: Partial<Padding>
  emptyText?: string
}

const DEFAULT_PADDING: Padding = { top: 28, right: 28, bottom: 28, left: 28 }

/** 打包树节点：x / y 为相对父圆圆心的单位尺度坐标 */
interface PackNode {
  node: SunburstTreeNode
  children: PackNode[]
  x: number
  y: number
  r: number
}

/** 布局后的圆（绘制与命中检测共用，绝对坐标） */
interface PackedCircle {
  node: SunburstTreeNode
  x: number
  y: number
  r: number
}

/**
 * 打包图（Circle Packing）
 * 层级圆嵌套：叶子半径 ∝ √value，兄弟圆按行式排布（确定性行列打包，保证无重叠），
 * 父圆半径由子圆包围盒推导，整树等比缩放至适配画布短边。
 * 悬停索引 = 节点先序序号（复用 buildSunburstTree，与树图 / 矩阵树图同源）。
 */
export class CirclePackingChart extends BaseChart<CirclePackingChartOption> {
  private model: PackedCircle[] | null = null
  private cacheSig = ''

  protected build(option: CirclePackingChartOption, ctx: RenderContext): GroupNode {
    const theme: KChartTheme = { ...defaultTheme, ...option.theme }
    const pad: Padding = { ...DEFAULT_PADDING, ...option.padding }
    const plotW = Math.max(0, ctx.width - pad.left - pad.right)
    const plotH = Math.max(0, ctx.height - pad.top - pad.bottom)
    const model = this.getModel(option, plotW, plotH, pad)
    if (model.length === 0) {
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

    const showLabel = option.label?.show ?? true
    const hover = ctx.hoverIndex
    const children: GroupNode['children'] = []
    const count = Math.max(1, model.length)

    model.forEach((pc, gi) => {
      const local = clamp01(ctx.progress * count - gi)
      if (local <= 0) return
      const dimmed = hover !== null && hover !== pc.node.index
      const r = Math.max(0.5, pc.r * local)
      children.push(
        circle(pc.x, pc.y, r, {
          key: `circle/${pc.node.index}`,
          fill: withAlpha(pc.node.color, pc.node.alpha * (dimmed ? 0.35 : 1)),
          // 白色细描边区分同色系父子圆层级；悬停时替换为品牌紫高亮
          stroke: hover === pc.node.index ? theme.colors[0] : '#FFFFFF',
          strokeWidth: hover === pc.node.index ? 2 : 1,
          cursor: 'pointer',
        })
      )
      // 仅叶子圆显示标签：父圆标签易与子圆标签重叠，父级信息走 tooltip
      const isLeaf = pc.node.children.length === 0
      if (showLabel && isLeaf && pc.r >= 16) {
        children.push(
          text(pc.x, pc.y + (pc.r >= 30 ? -4 : 4), pc.node.name, {
            key: `label/${pc.node.index}`,
            anchor: 'middle',
            fontSize: Math.min(13, Math.max(10, Math.round(pc.r / 4))),
            fill: theme.textColor,
            fontFamily: theme.fontFamily,
            opacity: (dimmed ? 0.35 : 1) * local,
          })
        )
        if (pc.r >= 30) {
          children.push(
            text(pc.x, pc.y + 12, String(pc.node.value), {
              key: `value/${pc.node.index}`,
              anchor: 'middle',
              fontSize: Math.min(12, Math.max(10, Math.round(pc.r / 5))),
              fill: theme.textColor,
              fontFamily: theme.fontFamily,
              opacity: (dimmed ? 0.35 : 1) * local,
            })
          )
        }
      }
    })

    return group({ key: 'plot', children: [group({ key: 'packing', children })] })
  }

  /** 命中检测：同点多个圆重叠时取更深的节点（子圆优先于父圆） */
  protected hitTest(x: number, y: number): number | null {
    const model = this.model
    if (!model) return null
    let best: number | null = null
    let bestDepth = -1
    for (const pc of model) {
      if (Math.hypot(x - pc.x, y - pc.y) <= pc.r && pc.node.depth > bestDepth) {
        best = pc.node.index
        bestDepth = pc.node.depth
      }
    }
    return best
  }

  protected getHoverInfo(index: number): HoverInfo {
    const pc = this.model?.find((p) => p.node.index === index)
    if (!pc) return { index, x: 0, y: 0 }
    return { index, x: r2(pc.x), y: r2(pc.y) }
  }

  // ============ 布局（签名缓存：数据 / 尺寸 / 间距不变则复用） ============

  private getModel(option: CirclePackingChartOption, plotW: number, plotH: number, pad: Padding): PackedCircle[] {
    const sig = JSON.stringify([option.data, option.gap, plotW, plotH])
    if (this.model && sig === this.cacheSig) return this.model
    this.cacheSig = sig

    if (option.data.length === 0 || plotW <= 0 || plotH <= 0) {
      this.model = []
      return this.model
    }
    const theme: KChartTheme = { ...defaultTheme, ...option.theme }
    const gap = option.gap ?? 6
    const roots = buildSunburstTree(option.data, theme.colors)

    // 以单位尺度（叶子 r = √value）递归打包；多根时把根当兄弟做顶层排布，
    // 再按顶层包围盒整体缩放适配画布
    const unitRoots = roots.map((nd) => packTree(nd, gap))
    let bboxR: number
    if (unitRoots.length === 1) {
      bboxR = unitRoots[0].r
    } else {
      layoutRing(unitRoots, gap)
      bboxR = Math.max(...unitRoots.map((p) => Math.hypot(p.x, p.y) + p.r))
    }
    const scale = Math.min(plotW, plotH) / 2 / Math.max(bboxR, 1e-9)

    const cx = pad.left + plotW / 2
    const cy = pad.top + plotH / 2
    const out: PackedCircle[] = []
    for (const root of unitRoots) {
      collectPacked(root, out, cx + root.x * scale, cy + root.y * scale, scale)
    }
    this.model = out
    return this.model
  }
}

// ============ 布局（纯函数） ============

/**
 * 递归打包：返回以自身圆心为原点的 PackNode（子圆坐标相对父圆心）。
 * 兄弟圆交给 layoutRing 做环形排布，父圆半径由子圆最远延伸推导。
 */
function packTree(node: SunburstTreeNode, gap: number): PackNode {
  if (node.children.length === 0) {
    return { node, children: [], x: 0, y: 0, r: Math.sqrt(node.value) }
  }

  const childPacks = node.children.map((nd) => packTree(nd, gap))
  layoutRing(childPacks, gap)
  const extent = Math.max(...childPacks.map((p) => Math.hypot(p.x, p.y) + p.r))
  return { node, children: childPacks, x: 0, y: 0, r: extent + gap }
}

/**
 * 环形排布：兄弟圆按半径降序绕中心均布（首圆在正上方），
 * 迭代放大环半径直到任意两圆不重叠（构造性保证无碰撞）。
 * 单子圆直接置于父心。
 */
function layoutRing(items: PackNode[], gap: number): void {
  if (items.length === 1) {
    items[0].x = 0
    items[0].y = 0
    return
  }
  const sorted = [...items].sort((a, b) => b.r - a.r)
  const n = sorted.length
  let R = sorted[0].r + gap
  for (let iter = 0; iter < 240; iter++) {
    const pts = sorted.map((p, i) => {
      const a = -Math.PI / 2 + (i / n) * Math.PI * 2
      return { p, x: Math.cos(a) * R, y: Math.sin(a) * R }
    })
    let ok = true
    for (let i = 0; i < n && ok; i++) {
      for (let j = i + 1; j < n; j++) {
        const need = pts[i].p.r + pts[j].p.r + gap
        if (Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y) < need - 0.01) {
          ok = false
          break
        }
      }
    }
    if (ok) break
    R *= 1.03
  }
  sorted.forEach((p, i) => {
    const a = -Math.PI / 2 + (i / n) * Math.PI * 2
    p.x = Math.cos(a) * R
    p.y = Math.sin(a) * R
  })
}

/** 递归收集：把相对坐标组合成绝对坐标并应用整树缩放 */
function collectPacked(p: PackNode, out: PackedCircle[], absX: number, absY: number, scale: number): void {
  out.push({ node: p.node, x: absX, y: absY, r: p.r * scale })
  for (const child of p.children) {
    collectPacked(child, out, absX + child.x * scale, absY + child.y * scale, scale)
  }
}

// ============ 纯函数工具 ============

function r2(v: number): number {
  return Math.round(v * 100) / 100
}

function clamp01(v: number): number {
  return clamp(v, 0, 1)
}
