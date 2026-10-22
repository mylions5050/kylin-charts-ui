import { BaseChart } from './base-chart'
import { clamp } from '../utils/math'
import { withAlpha } from '../utils/color'
import { defaultTheme } from '../theme'
import type { KChartTheme } from '../theme'
import { group, rect, text } from '../scene/nodes'
import type { GroupNode } from '../scene/nodes'
import type { HoverInfo, KTreeDatum, Padding, RenderContext } from '../types'
import { buildSunburstTree, flattenSunburstTree } from './sunburst-chart'
import type { SunburstTreeNode } from './sunburst-chart'

/** 矩阵树图配置（注册于 OptionMap['treemap']） */
export interface TreemapChartOption {
  /** 层级数据（叶子节点 value 参与面积分配；父节点 value 缺省自动汇总子级） */
  data: KTreeDatum[]
  /** 矩形间隙 px，缺省 1 */
  gap?: number
  /** 是否显示叶子矩形名称标签（空间不足自动跳过） */
  label?: { show?: boolean }
  /** 主题覆盖 */
  theme?: Partial<KChartTheme>
  /** 画布内边距覆盖 */
  padding?: Partial<Padding>
  /** 空数据提示文案 */
  emptyText?: string
}

interface Rect {
  x: number
  y: number
  w: number
  h: number
}

/** 叶子矩形（hover 索引 = 节点先序序号） */
interface LeafRect {
  node: SunburstTreeNode
  x: number
  y: number
  w: number
  h: number
}

interface Layout {
  theme: KChartTheme
  leaves: LeafRect[]
  gap: number
  showLabel: boolean
}

const DEFAULT_PADDING: Padding = { top: 24, right: 24, bottom: 24, left: 24 }

/** 标签显示的最小矩形尺寸（px） */
const LABEL_MIN_W = 36
const LABEL_MIN_H = 20

/**
 * 矩阵树图（Treemap）
 * 支持：任意层级嵌套（面积 ∝ 叶子 value）、squarified 布局（矩形长宽比接近 1）、
 * 分支色继承 + 层级透明度衰减、矩形间隙、标签自动对比色 + 空间不足跳过、
 * 悬停高亮 + 其余压暗、逐叶自中心缩放入场动画。
 * 悬停索引 = 节点先序序号（复用 buildSunburstTree 保证组件层同源解码）。
 */
export class TreemapChart extends BaseChart<TreemapChartOption> {
  private layout: Layout | null = null

  constructor(container: HTMLElement, option: TreemapChartOption) {
    super(container, option)
  }

  protected build(option: TreemapChartOption, ctx: RenderContext): GroupNode {
    const theme: KChartTheme = { ...defaultTheme, ...option.theme }
    const pad: Padding = { ...DEFAULT_PADDING, ...option.padding }
    const plotX = pad.left
    const plotY = pad.top
    const plotW = Math.max(0, ctx.width - pad.left - pad.right)
    const plotH = Math.max(0, ctx.height - pad.top - pad.bottom)
    const gap = Math.max(0, option.gap ?? 1)
    const showLabel = option.label?.show ?? true

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

    // ============ squarified 递归布局 ============
    const leaves: LeafRect[] = []
    layoutBranch(roots, { x: plotX, y: plotY, w: plotW, h: plotH }, leaves)

    this.layout = { theme, leaves, gap, showLabel }

    // ============ 叶子矩形（逐叶自中心缩放入场；悬停时其余压暗） ============
    const leafCount = Math.max(1, leaves.length)
    const rectNodes: GroupNode['children'] = []
    const labelNodes: GroupNode['children'] = []
    leaves.forEach((lr, gi) => {
      const local = clamp01(ctx.progress * leafCount - gi)
      if (local <= 0) return
      const fill = withAlpha(lr.node.color, lr.node.alpha * (ctx.hoverIndex !== null && ctx.hoverIndex !== lr.node.index ? 0.45 : 1))
      // 自中心缩放 + 间隙内缩
      const inset = gap / 2
      const cxr = lr.x + lr.w / 2
      const cyr = lr.y + lr.h / 2
      const w = Math.max(0.5, (lr.w - inset * 2) * local)
      const h = Math.max(0.5, (lr.h - inset * 2) * local)
      rectNodes.push(
        rect(r2(cxr - w / 2), r2(cyr - h / 2), r2(w), r2(h), {
          key: `tile/${lr.node.index}`,
          fill,
          ...(ctx.hoverIndex === lr.node.index ? { stroke: theme.colors[0], strokeWidth: 2 } : {}),
        })
      )
      if (showLabel && lr.w - inset * 2 >= LABEL_MIN_W && lr.h - inset * 2 >= LABEL_MIN_H) {
        labelNodes.push(
          text(r2(cxr), r2(cyr + theme.fontSize / 2 - 1), lr.node.name, {
            key: `tilelabel/${lr.node.index}`,
            anchor: 'middle',
            fontSize: theme.fontSize,
            fill: isDarkColor(lr.node.color) ? '#FFFFFF' : theme.textColor,
            fontFamily: theme.fontFamily,
            opacity: local,
          })
        )
      }
    })
    return group({ key: 'plot', children: [group({ key: 'tiles', children: [...rectNodes, ...labelNodes] })] })
  }

  /** 网格命中：指针所在叶子矩形（索引 = 节点先序序号） */
  protected hitTest(x: number, y: number): number | null {
    const layout = this.layout
    if (!layout) return null
    for (const lr of layout.leaves) {
      if (x >= lr.x && x <= lr.x + lr.w && y >= lr.y && y <= lr.y + lr.h) {
        return lr.node.index
      }
    }
    return null
  }

  protected getHoverInfo(index: number): HoverInfo {
    const lr = this.layout?.leaves.find((l) => l.node.index === index)
    if (!lr) return { index, x: 0, y: 0 }
    return { index, x: r2(lr.x + lr.w / 2), y: r2(lr.y + lr.h / 2) }
  }
}

// ============ squarified 布局（纯函数） ============

/** 递归：当前节点组的矩形按 squarify 切分，叶子落位、分支继续下钻 */
function layoutBranch(nodes: SunburstTreeNode[], r: Rect, out: LeafRect[]): void {
  const items = nodes.map((nd) => ({ node: nd, value: nd.value }))
  const rects: LeafRect[] = []
  squarify(items, r, rects)
  for (const lr of rects) {
    if (lr.node.children.length === 0) {
      out.push(lr)
    } else {
      layoutBranch(lr.node.children, lr, out)
    }
  }
}

/**
 * squarified 行贪心：按值降序逐个试装入当前行，
 * 仅当装入后行内矩形最差长宽比不变大时才并入，否则先落位当前行再开新行。
 * 行沿矩形的短边铺设（w >= h 时纵向成列，否则横向成行）。
 */
function squarify(items: { node: SunburstTreeNode; value: number }[], r: Rect, out: LeafRect[]): void {
  if (items.length === 0) return
  if (items.length === 1) {
    out.push({ node: items[0].node, x: r.x, y: r.y, w: r.w, h: r.h })
    return
  }
  // 把值归一化到当前矩形面积：∑值 → w×h，使行厚/矩形边长直接由缩放后的值决定
  const total = items.reduce((s, it) => s + Math.max(0, it.value), 0)
  const scale = total > 0 ? (r.w * r.h) / total : 0
  let rest = items
    .slice()
    .sort((a, b) => b.value - a.value)
    .map((it) => ({ node: it.node, value: Math.max(0, it.value) * scale }))
  let x = r.x
  let y = r.y
  let w = r.w
  let h = r.h
  while (rest.length > 0) {
    const short = Math.min(w, h)
    const rowVals: number[] = []
    let rowArea = 0
    let worst = Infinity
    let consumed = 0
    while (consumed < rest.length) {
      const v = rest[consumed].value
      const candArea = rowArea + v
      const candWorst = rowWorst([...rowVals, v], candArea, short)
      if (rowVals.length === 0 || candWorst <= worst) {
        rowVals.push(v)
        rowArea = candArea
        worst = candWorst
        consumed++
      } else {
        break
      }
    }
    const row = rest.slice(0, consumed)
    rest = rest.slice(consumed)
    const thickness = rowArea / Math.max(1e-9, short)
    let offset = 0
    for (const it of row) {
      const len = (it.value / Math.max(1e-9, rowArea)) * short
      if (w >= h) {
        out.push({ node: it.node, x, y: y + offset, w: thickness, h: len })
      } else {
        out.push({ node: it.node, x: x + offset, y, w: len, h: thickness })
      }
      offset += len
    }
    if (w >= h) {
      x += thickness
      w -= thickness
    } else {
      y += thickness
      h -= thickness
    }
  }
}

/** 行内最差长宽比（厚度 t 与各矩形长度 len 的较大比值） */
function rowWorst(vals: number[], area: number, short: number): number {
  const t = area / Math.max(1e-9, short)
  let worst = 0
  for (const v of vals) {
    const len = (v / Math.max(1e-9, area)) * short
    worst = Math.max(worst, Math.max(t / Math.max(1e-9, len), len / Math.max(1e-9, t)))
  }
  return worst
}

// ============ 纯函数工具 ============

function r2(v: number): number {
  return Math.round(v * 100) / 100
}

function clamp01(v: number): number {
  return clamp(v, 0, 1)
}

function parseHex(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}

/** 亮度判断（标签自动对比色用）：亮度 < 0.55 视为深色底 */
function isDarkColor(hex: string): boolean {
  const [r, g, b] = parseHex(hex)
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.55
}
