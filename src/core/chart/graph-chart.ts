import { BaseChart } from './base-chart'
import { clamp } from '../utils/math'
import { withAlpha } from '../utils/color'
import { defaultTheme } from '../theme'
import type { KChartTheme } from '../theme'
import { circle, group, path, text } from '../scene/nodes'
import type { GroupNode } from '../scene/nodes'
import type {
  HoverInfo,
  KGraphCategory,
  KGraphLink,
  KGraphNode,
  Padding,
  RenderContext,
} from '../types'

/** 关系图布局：力导向 / 环形 / 固定坐标 */
export type KGraphLayout = 'force' | 'circular' | 'none'

/** 力导向参数（省心缺省：距离与斥力按画布面积自动推算） */
export interface GraphForceOption {
  /** 期望边长 px，缺省按 √(画布面积/节点数) 推算并收敛到 [55, 150] */
  linkDistance?: number
  /** 节点间斥力强度，缺省 linkDistance² */
  repulsion?: number
  /** 模拟迭代次数（越大布局越稳定），缺省 300 */
  iterations?: number
}

/** 关系图配置 */
export interface GraphChartOption {
  /** 节点列表 */
  nodes: KGraphNode[]
  /** 链路列表 */
  links: KGraphLink[]
  /** 类目列表（节点配色分组） */
  categories?: KGraphCategory[]
  /** 布局方式，缺省 force */
  layout?: KGraphLayout
  /** 力导向参数（仅 force 布局生效） */
  force?: GraphForceOption
  /** 节点半径范围 px，缺省 { min: 8, max: 26 } */
  nodeSize?: { min?: number; max?: number }
  /** 是否显示节点名称标签，缺省 true */
  label?: { show?: boolean }
  /** 主题覆盖 */
  theme?: Partial<KChartTheme>
  /** 画布内边距覆盖 */
  padding?: Partial<Padding>
  /** 空数据提示文案 */
  emptyText?: string
}

/** 预处理后的节点信息（组件层 tooltip 同源解码用） */
export interface PreparedGraphNode {
  /** 节点名称 */
  name: string
  /** 权重（缺省补 10） */
  value: number
  /** 用户是否显式给了 value（tooltip 决定是否展示数值行） */
  hasValue: boolean
  /** 解析后的实色（节点色 > 类目色 > 色板） */
  color: string
  /** 类目下标（无类目为 -1） */
  category: number
  /** 类目名称（无类目为 ''） */
  categoryName: string
  /** 关联链路数（入度 + 出度） */
  degree: number
  /** 节点下标（= 悬停索引） */
  index: number
}

/** 内部节点（含布局坐标与半径） */
interface GraphNode extends PreparedGraphNode {
  x: number
  y: number
  r: number
}

/** 内部链路（source / target 已解析为节点下标） */
interface GraphLink {
  source: number
  target: number
  value: number
}

interface GraphModel {
  nodes: GraphNode[]
  links: GraphLink[]
}

const DEFAULT_PADDING: Padding = { top: 32, right: 32, bottom: 32, left: 32 }

/**
 * 关系图（Graph）
 * 支持：force / circular / none 三种布局、类目配色分组、半径 √value 映射、
 * 链路线宽随 value 缩放、悬停高亮邻接子图（相连节点 + 连线）其余压暗、
 * 逐节点错峰缩放入场动画。悬停索引 = 节点下标。
 */
export class GraphChart extends BaseChart<GraphChartOption> {
  private model: GraphModel | null = null
  private cacheSig = ''

  protected build(option: GraphChartOption, ctx: RenderContext): GroupNode {
    const theme: KChartTheme = { ...defaultTheme, ...option.theme }
    const pad: Padding = { ...DEFAULT_PADDING, ...option.padding }
    const model = this.getModel(option, ctx.width - pad.left - pad.right, ctx.height - pad.top - pad.bottom, pad)
    const nodes = model.nodes
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

    const showLabel = option.label?.show ?? true
    const hover = ctx.hoverIndex

    // ============ 悬停邻接集：相连节点与连线高亮，其余压暗 ============
    const neighborSet = new Set<number>()
    if (hover !== null) {
      neighborSet.add(hover)
      for (const lk of model.links) {
        if (hover === lk.source) neighborSet.add(lk.target)
        else if (hover === lk.target) neighborSet.add(lk.source)
      }
    }

    const maxLinkValue = Math.max(1, ...model.links.map((lk) => lk.value))
    const children: GroupNode['children'] = []

    // ============ 链路（线宽 ∝ value；整体随入场淡入） ============
    const linkFade = clamp01(ctx.progress * 2 - 0.2)
    model.links.forEach((lk, li) => {
      const s = nodes[lk.source]
      const t = nodes[lk.target]
      const related = hover === null || hover === lk.source || hover === lk.target
      children.push(
        path(`M ${r2(s.x)} ${r2(s.y)} L ${r2(t.x)} ${r2(t.y)}`, {
          key: `link/${li}`,
          stroke: withAlpha(s.color, 1),
          strokeWidth: r2(1 + 4 * (lk.value / maxLinkValue)),
          opacity: (hover === null ? 0.32 : related ? 0.85 : 0.05) * linkFade,
        })
      )
    })

    // ============ 节点（半径 √value；逐节点错峰自 0 缩放入场） ============
    const nodeCount = Math.max(1, nodes.length)
    nodes.forEach((nd, gi) => {
      const local = clamp01(ctx.progress * nodeCount - gi)
      if (local <= 0) return
      const dimmed = hover !== null && !neighborSet.has(nd.index)
      const r = Math.max(0.5, nd.r * local)
      children.push(
        circle(nd.x, nd.y, r, {
          key: `node/${nd.index}`,
          fill: nd.color,
          cursor: 'pointer',
          opacity: dimmed ? 0.3 : 1,
          ...(hover === nd.index ? { stroke: '#FFFFFF', strokeWidth: 2 } : {}),
        })
      )
      if (showLabel) {
        children.push(
          text(nd.x, nd.y + r + theme.fontSize + 2, nd.name, {
            key: `label/${nd.index}`,
            anchor: 'middle',
            fontSize: theme.fontSize,
            fill: theme.textColor,
            fontFamily: theme.fontFamily,
            opacity: (dimmed ? 0.3 : 1) * local,
          })
        )
      }
    })

    return group({ key: 'plot', children: [group({ key: 'graph', children })] })
  }

  /** 命中检测：指针所在节点圆（取距离最近且不超过 r + 5 的节点） */
  protected hitTest(x: number, y: number): number | null {
    const model = this.model
    if (!model) return null
    let best: number | null = null
    let bestDist = Infinity
    for (const nd of model.nodes) {
      const d = Math.hypot(x - nd.x, y - nd.y)
      if (d <= nd.r + 5 && d < bestDist) {
        best = nd.index
        bestDist = d
      }
    }
    return best
  }

  protected getHoverInfo(index: number): HoverInfo {
    const nd = this.model?.nodes.find((n) => n.index === index)
    if (!nd) return { index, x: 0, y: 0 }
    return { index, x: r2(nd.x), y: r2(nd.y) }
  }

  // ============ 数据准备 + 布局（签名缓存：数据 / 布局参数 / 尺寸不变则复用） ============

  private getModel(option: GraphChartOption, w: number, h: number, pad: Padding): GraphModel {
    const layout = option.layout ?? 'force'
    const sig = JSON.stringify([
      option.nodes,
      option.links,
      option.categories,
      layout,
      option.force,
      option.nodeSize,
      option.padding,
      w,
      h,
    ])
    if (this.model && sig === this.cacheSig) return this.model
    this.cacheSig = sig

    const theme: KChartTheme = { ...defaultTheme, ...option.theme }
    const prepared = prepareGraph(option.nodes, option.links, option.categories, theme.colors)
    const nodes: GraphNode[] = prepared.nodes.map((p) => ({ ...p, x: 0, y: 0, r: 0 }))
    const model: GraphModel = { nodes, links: prepared.links }

    assignRadii(nodes, option.nodeSize)
    if (nodes.length > 0) {
      if (layout === 'circular') {
        circularLayout(nodes, w, h)
      } else if (layout === 'none') {
        fixedLayout(nodes, option.nodes, w, h)
      } else {
        forceLayout(nodes, model.links, w, h, option.force)
      }
      // 布局坐标 → 画布绝对坐标（含内边距）
      for (const nd of nodes) {
        nd.x += pad.left
        nd.y += pad.top
      }
    }
    this.model = model
    return model
  }
}

// ============ 数据准备（纯函数，核心层与组件层共用） ============

/**
 * 节点 / 链路归一化：解析 name 或下标引用、跳过未知节点与自环、
 * 统计度数、按「节点色 > 类目色 > 色板」解析实色。
 */
export function prepareGraph(
  nodes: KGraphNode[],
  links: KGraphLink[],
  categories: KGraphCategory[] | undefined,
  colors: string[]
): { nodes: PreparedGraphNode[]; links: GraphLink[] } {
  const nameToIndex = new Map<string, number>()
  const prepared: PreparedGraphNode[] = nodes.map((nd, i) => {
    nameToIndex.set(nd.name, i)
    const cat = typeof nd.category === 'number' && nd.category >= 0 ? nd.category : -1
    const catDef = cat >= 0 && categories ? categories[cat] : undefined
    const color =
      nd.color ?? catDef?.color ?? colors[(cat >= 0 ? cat : 0) % Math.max(1, colors.length)]
    return {
      name: nd.name,
      value: nd.value ?? 10,
      hasValue: nd.value != null,
      color,
      category: cat,
      categoryName: catDef?.name ?? '',
      degree: 0,
      index: i,
    }
  })

  const resolved: GraphLink[] = []
  for (const lk of links) {
    const si = typeof lk.source === 'number' ? lk.source : nameToIndex.get(lk.source)
    const ti = typeof lk.target === 'number' ? lk.target : nameToIndex.get(lk.target)
    if (
      si == null || ti == null ||
      si < 0 || ti < 0 || si >= prepared.length || ti >= prepared.length ||
      si === ti
    ) {
      continue
    }
    resolved.push({ source: si, target: ti, value: lk.value ?? 1 })
    prepared[si].degree++
    prepared[ti].degree++
  }
  return { nodes: prepared, links: resolved }
}

// ============ 布局（纯函数） ============

/** 半径映射：√value 线性缩放到 [min, max] */
function assignRadii(nodes: GraphNode[], nodeSize: GraphChartOption['nodeSize']): void {
  const min = nodeSize?.min ?? 8
  const max = nodeSize?.max ?? 26
  let vmin = Infinity
  let vmax = -Infinity
  for (const nd of nodes) {
    vmin = Math.min(vmin, nd.value)
    vmax = Math.max(vmax, nd.value)
  }
  const smin = Math.sqrt(vmin)
  const smax = Math.sqrt(vmax)
  for (const nd of nodes) {
    nd.r = smax > smin ? min + ((Math.sqrt(nd.value) - smin) / (smax - smin)) * (max - min) : (min + max) / 2
  }
}

/** 环形布局：节点沿可用空间内切圆均匀分布 */
function circularLayout(nodes: GraphNode[], w: number, h: number): void {
  const n = nodes.length
  const cx = w / 2
  const cy = h / 2
  const rMax = Math.max(...nodes.map((nd) => nd.r))
  const R = Math.max(10, Math.min(w, h) / 2 - rMax - 14)
  nodes.forEach((nd, i) => {
    const a = (2 * Math.PI * i) / n - Math.PI / 2
    nd.x = cx + R * Math.cos(a)
    nd.y = cy + R * Math.sin(a)
  })
}

/** 固定坐标布局：直接读用户给的 x / y（缺省居中） */
function fixedLayout(nodes: GraphNode[], raw: KGraphNode[], w: number, h: number): void {
  const cx = w / 2
  const cy = h / 2
  nodes.forEach((nd, i) => {
    nd.x = clamp(raw[i]?.x ?? cx, 0, w)
    nd.y = clamp(raw[i]?.y ?? cy, 0, h)
  })
}

/**
 * 力导向布局（Fruchterman-Reingold 变种，确定性：初始圆布点 + 温度线性冷却）：
 * 全对斥力 k²/d、连边弹簧 (d - k)、弱中心引力，位移逐迭代限幅。
 */
function forceLayout(nodes: GraphNode[], links: GraphLink[], w: number, h: number, force: GraphForceOption | undefined): void {
  const n = nodes.length
  const cx = w / 2
  const cy = h / 2
  if (n === 1) {
    nodes[0].x = cx
    nodes[0].y = cy
    return
  }
  // 初始：按序号绕圆均匀布点，保证同数据同布局（确定性）
  const R0 = Math.min(w, h) * 0.36
  nodes.forEach((nd, i) => {
    const a = (2 * Math.PI * i) / n - Math.PI / 2
    nd.x = cx + R0 * Math.cos(a)
    nd.y = cy + R0 * Math.sin(a)
  })

  const k = force?.linkDistance ?? clamp(0.8 * Math.sqrt((w * h) / n), 55, 150)
  const repulsion = force?.repulsion ?? k * k
  const iterations = Math.max(1, force?.iterations ?? 300)
  const edge = 16
  const dispX = new Float64Array(n)
  const dispY = new Float64Array(n)

  for (let it = 0; it < iterations; it++) {
    const temp = Math.max(0.8, (1 - it / iterations) * Math.min(w, h) * 0.1)
    dispX.fill(0)
    dispY.fill(0)
    // 全对斥力
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const dx = nodes[j].x - nodes[i].x
        const dy = nodes[j].y - nodes[i].y
        const d2 = Math.max(dx * dx + dy * dy, 16)
        const d = Math.sqrt(d2)
        const f = repulsion / d2
        const fx = (dx / d) * f
        const fy = (dy / d) * f
        dispX[i] -= fx
        dispY[i] -= fy
        dispX[j] += fx
        dispY[j] += fy
      }
    }
    // 连边弹簧
    for (const lk of links) {
      const s = nodes[lk.source]
      const t = nodes[lk.target]
      const dx = t.x - s.x
      const dy = t.y - s.y
      const d = Math.max(Math.sqrt(dx * dx + dy * dy), 1)
      const f = ((d - k) / d) * 0.1
      const fx = dx * f
      const fy = dy * f
      dispX[lk.source] += fx
      dispY[lk.source] += fy
      dispX[lk.target] -= fx
      dispY[lk.target] -= fy
    }
    // 弱中心引力 + 限幅位移
    for (let i = 0; i < n; i++) {
      dispX[i] += (cx - nodes[i].x) * 0.02
      dispY[i] += (cy - nodes[i].y) * 0.02
      const dl = Math.hypot(dispX[i], dispY[i])
      let mx = dispX[i]
      let my = dispY[i]
      if (dl > temp) {
        mx = (dispX[i] / dl) * temp
        my = (dispY[i] / dl) * temp
      }
      nodes[i].x = clamp(nodes[i].x + mx, edge, Math.max(edge, w - edge))
      nodes[i].y = clamp(nodes[i].y + my, edge, Math.max(edge, h - edge))
    }
  }
}

// ============ 纯函数工具 ============

function r2(v: number): number {
  return Math.round(v * 100) / 100
}

function clamp01(v: number): number {
  return clamp(v, 0, 1)
}
