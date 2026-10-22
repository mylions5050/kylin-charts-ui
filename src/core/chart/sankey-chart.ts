import { BaseChart } from './base-chart'
import { defaultTheme, getSeriesColor } from '../theme'
import type { KChartTheme } from '../theme'
import { group, path, rect, text } from '../scene/nodes'
import type { GroupNode } from '../scene/nodes'
import { withAlpha, lighten } from '../utils/color'
import type { HoverInfo, KSankeyLink, KSankeyNode, Padding, RenderContext } from '../types'

/** 桑基图配置（注册于 OptionMap['sankey']） */
export interface SankeyChartOption {
  /** 节点列表（name 需唯一，同名取第一个） */
  nodes: KSankeyNode[]
  /** 链路列表（source / target 按节点 name 关联，端点缺失的链路不绘制） */
  links: KSankeyLink[]
  /** 节点矩形宽度 px；默认 16 */
  nodeWidth?: number
  /** 布局方向：horizontal 横向（层从左到右展开，默认）/ vertical 纵向（层从上到下展开） */
  orient?: 'horizontal' | 'vertical'
  /** 是否允许拖拽节点（拖拽后链路实时跟随，位置持久保留）；默认 false */
  draggable?: boolean
  /** 同层节点最小间距 px；默认 12 */
  nodeGap?: number
  /** 链路弯曲度 0 ~ 1，0.5 为标准 S 形贝塞尔；默认 0.5 */
  curvature?: number
  /** 是否显示节点名称标签；默认 true */
  label?: { show?: boolean }
  /** 主题覆盖 */
  theme?: Partial<KChartTheme>
  /** 画布内边距覆盖 */
  padding?: Partial<Padding>
  /** 空数据提示文案 */
  emptyText?: string
}

/** 节点内部模型（绘制与命中检测共用） */
interface SankeyNodeLayout {
  /** 原始 nodes 索引（组件层 tooltip 按此解码） */
  index: number
  name: string
  /** 节点流量 = max(显式 value, 入和, 出和)，高度按比例映射 */
  value: number
  color: string
  layer: number
  /** 节点矩形左上角 */
  x: number
  y: number
  height: number
}

/** 链路内部模型 */
interface SankeyLinkLayout {
  /** 原始 links 索引（组件层 tooltip 按此解码） */
  index: number
  source: number
  target: number
  value: number
  /** 实色（透明度渲染时按悬停状态叠加） */
  color: string
  /** 源节点右缘 x 与厚度带上下缘 */
  x0: number
  sy0: number
  sy1: number
  /** 目标节点左缘 x 与厚度带上下缘 */
  x1: number
  ty0: number
  ty1: number
}

interface Layout {
  nodes: SankeyNodeLayout[]
  links: SankeyLinkLayout[]
  /** 悬停索引编码：[0, n) 为节点，[n, n + m) 为链路 */
  nodeCount: number
  theme: KChartTheme
  /** 布局方向（纵向时布局在虚拟横向空间计算，渲染/命中时整体转置） */
  orient: 'horizontal' | 'vertical'
}

const DEFAULT_PADDING: Padding = { top: 24, right: 24, bottom: 24, left: 24 }
/** 链路默认透明度（悬停 / 关联时提升） */
const LINK_ALPHA = 0.32
const LINK_ALPHA_ACTIVE = 0.85
const LINK_ALPHA_DIM = 0.1
const NODE_DIM = 0.35
/** 悬停强调：节点颜色向白色混合的提亮幅度（与饼图保持一致，不放大） */
const HOVER_BRIGHTEN = 0.12
/** 悬停缓动逐帧逼近系数与收敛阈值（与饼图保持一致） */
const HOVER_EASE = 0.22
const HOVER_SNAP = 0.005

/**
 * 桑基图
 * 支持：横向 / 纵向布局（orient）、自动分层（最长路径分层 + 两次重心排序减少交叉）、
 * 节点宽度/间距/链路弯曲度定制、节点与链路级颜色、
 * 悬停节点高亮关联链路、悬停链路高亮两端节点（逐索引缓动平滑过渡，不放大）、
 * 节点拖拽（draggable，链路实时跟随，位置钳制在绘图区内）、
 * 链路厚度随入场动画从节点展开。
 */
export class SankeyChart extends BaseChart<SankeyChartOption> {
  private layout: Layout | null = null
  /** 悬停强调动画值（按悬停索引编码）：0（无强调）~ 1（完全强调），节点与链路独立缓动 */
  private hoverEases = new Map<number, number>()
  private hoverRaf: number | null = null
  /** 节点拖拽：被拖节点索引、拖拽起点（指针坐标 + 偏移量）、各节点累计偏移（虚拟横向坐标） */
  private dragIndex: number | null = null
  private dragStart: { px: number; py: number; dx: number; dy: number } | null = null
  private dragOffsets = new Map<number, { dx: number; dy: number }>()

  constructor(container: HTMLElement, option: SankeyChartOption) {
    super(container, option)
    // 拖拽自挂指针事件（SVGRenderer.on 支持多监听，不影响基类 hover 流水线）
    this.renderer.on('pointerdown', this.handleDragStart)
    this.renderer.on('pointermove', this.handleDragMove)
    this.renderer.on('pointerup', this.handleDragEnd)
    this.renderer.on('pointerleave', this.handleDragEnd)
  }

  private handleDragStart = (e: PointerEvent): void => {
    if (!(this.option as SankeyChartOption).draggable) return
    const rect = this.renderer.svg.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const index = this.hitTest(x, y)
    const n = this.layout?.nodeCount ?? 0
    if (index === null || index >= n) return
    this.dragIndex = index
    const cur = this.dragOffsets.get(index) ?? { dx: 0, dy: 0 }
    this.dragStart = { px: x, py: y, dx: cur.dx, dy: cur.dy }
    e.preventDefault()
  }

  private handleDragMove = (e: PointerEvent): void => {
    if (this.dragIndex === null || !this.dragStart) return
    const rect = this.renderer.svg.getBoundingClientRect()
    let dx = e.clientX - rect.left - this.dragStart.px
    let dy = e.clientY - rect.top - this.dragStart.py
    if (this.layout?.orient === 'vertical') {
      // 纵向：屏幕位移转置回虚拟横向坐标
      const t = dx
      dx = dy
      dy = t
    }
    this.dragOffsets.set(this.dragIndex, { dx: this.dragStart.dx + dx, dy: this.dragStart.dy + dy })
    this.render()
  }

  private handleDragEnd = (): void => {
    this.dragIndex = null
    this.dragStart = null
  }

  override destroy(): void {
    if (this.hoverRaf !== null) cancelAnimationFrame(this.hoverRaf)
    super.destroy()
  }

  /** 悬停强调缓动：各索引动画值逐帧向目标（悬停 1 / 非悬停 0）逼近，切换悬停时旧区域平滑退出 */
  private tickHoverAnim = (): void => {
    let active = false
    this.hoverEases.forEach((v, k) => {
      const target = k === this.hoverIndex ? 1 : 0
      if (Math.abs(target - v) > HOVER_SNAP) {
        const nv = v + (target - v) * HOVER_EASE
        this.hoverEases.set(k, Math.abs(target - nv) < HOVER_SNAP ? target : nv)
        active = true
      } else if (v !== target) {
        this.hoverEases.set(k, target)
      }
    })
    if (active) {
      this.hoverRaf = requestAnimationFrame(this.tickHoverAnim)
    } else {
      this.hoverRaf = null
    }
    this.render()
  }

  /** 在 build 内调用：为新悬停索引补动画值、清理已收敛项，并按需启动缓动 */
  private updateHoverAnim(hoverIndex: number | null): Map<number, number> {
    if (hoverIndex !== null && !this.hoverEases.has(hoverIndex)) this.hoverEases.set(hoverIndex, 0)
    this.hoverEases.forEach((v, k) => {
      if (k !== hoverIndex && v <= HOVER_SNAP) this.hoverEases.delete(k)
    })
    let need = false
    this.hoverEases.forEach((v, k) => {
      if (Math.abs((k === hoverIndex ? 1 : 0) - v) > HOVER_SNAP) need = true
    })
    if (need && this.hoverRaf === null) {
      this.hoverRaf = requestAnimationFrame(this.tickHoverAnim)
    }
    return this.hoverEases
  }

  protected build(option: SankeyChartOption, ctx: RenderContext): GroupNode {
    const theme: KChartTheme = { ...defaultTheme, ...option.theme }
    const pad: Padding = { ...DEFAULT_PADDING, ...option.padding }

    // ============ 空数据兜底 ============
    const layout = this.computeLayout(option, ctx.width, ctx.height, theme)
    this.layout = layout
    if (!layout || layout.nodeCount === 0) {
      return group({
        key: 'empty',
        children: [
          text(pad.left + (ctx.width - pad.left - pad.right) / 2, ctx.height / 2, option.emptyText ?? '暂无数据', {
            key: 'empty-text',
            anchor: 'middle',
            fontSize: 14,
            fill: theme.emptyColor,
            fontFamily: theme.fontFamily,
          }),
        ],
      })
    }

    const nodeWidth = Math.max(4, option.nodeWidth ?? 16)
    const curvature = clamp(option.curvature ?? 0.5, 0, 1)
    const showLabel = option.label?.show ?? true
    const n = layout.nodeCount
    const vertical = layout.orient === 'vertical'
    const hoverEases = this.updateHoverAnim(ctx.hoverIndex)

    // ============ 链路色带（入场：厚度随 progress 展开；悬停透明度逐索引缓动） ============
    const linkNodes: GroupNode['children'] = []
    for (const l of layout.links) {
      const selfIdx = n + l.index
      const ease = hoverEases.get(selfIdx) ?? 0
      // 关联激活：自身悬停 或 端点节点悬停（取各缓动最大值，平滑交叉过渡）
      let active = ease
      hoverEases.forEach((v, k) => {
        if (k < n && (k === l.source || k === l.target) && v > active) active = v
      })
      // 淡化：非端点节点的悬停、非本链路的链路悬停
      let dim = 0
      hoverEases.forEach((v, k) => {
        if (v <= dim) return
        if (k < n) {
          if (k !== l.source && k !== l.target) dim = v
        } else if (k !== selfIdx) {
          dim = v
        }
      })
      const alphaNoDim = LINK_ALPHA + (LINK_ALPHA_ACTIVE - LINK_ALPHA) * active
      const alpha = alphaNoDim + (LINK_ALPHA_DIM - alphaNoDim) * dim
      const th0 = (l.sy1 - l.sy0) * ctx.progress
      const th1 = (l.ty1 - l.ty0) * ctx.progress
      linkNodes.push(
        path(
          vertical
            ? ribbonPathV(l.x0, l.sy0, l.sy0 + th0, l.x1, l.ty0, l.ty0 + th1, curvature)
            : ribbonPath(l.x0, l.sy0, l.sy0 + th0, l.x1, l.ty0, l.ty0 + th1, curvature),
          {
            key: `link/${l.index}`,
            fill: withAlpha(l.color, alpha),
            cursor: 'pointer',
          }
        )
      )
    }

    // ============ 节点矩形（入场：厚度从中线展开；悬停提亮 + 其余淡化，不放大） ============
    const nodeNodes: GroupNode['children'] = []
    const labelNodes: GroupNode['children'] = []
    for (const nd of layout.nodes) {
      const bright = hoverEases.get(nd.index) ?? 0
      // 淡化：其他节点的悬停、非本节点端点的链路悬停
      let dim = 0
      hoverEases.forEach((v, k) => {
        if (v <= dim || k === nd.index) return
        if (k < n) dim = v
        else if (!isLinkEnd(k - n, layout, nd.index)) dim = v
      })
      const nodeFill = bright > 0.01 ? lighten(nd.color, HOVER_BRIGHTEN * bright) : nd.color
      const nodeOpacity = 1 - NODE_DIM * dim
      const thickness = nd.height * ctx.progress
      if (vertical) {
        // 转置：虚拟坐标 (x, y, 厚度, nodeWidth) → 屏幕坐标 (y, x, 厚度, nodeWidth)
        const w = thickness
        const x = nd.y + (nd.height - w) / 2
        nodeNodes.push(
          rect(x, nd.x, w, nodeWidth, {
            key: `node/${nd.index}`,
            fill: nodeFill,
            radius: 2,
            opacity: nodeOpacity,
            cursor: option.draggable ? 'grab' : 'pointer',
          })
        )
      } else {
        const y = nd.y + (nd.height - thickness) / 2
        nodeNodes.push(
          rect(nd.x, y, nodeWidth, thickness, {
            key: `node/${nd.index}`,
            fill: nodeFill,
            radius: 2,
            opacity: nodeOpacity,
            cursor: option.draggable ? 'grab' : 'pointer',
          })
        )
      }

      if (ctx.progress < 1 || !showLabel) continue
      const hovered = ctx.hoverIndex === nd.index
      if (vertical) {
        // 纵向：标签放节点下方居中（落在层间距内，不溢出画布）
        labelNodes.push(
          text(r2(nd.y + nd.height / 2), r2(nd.x + nodeWidth + 4 + theme.fontSize), nd.name, {
            key: `nlabel/${nd.index}`,
            anchor: 'middle',
            fontSize: theme.fontSize,
            fontWeight: hovered ? 600 : undefined,
            fill: hovered ? theme.colors[0] : theme.textColor,
            fontFamily: theme.fontFamily,
          })
        )
      } else {
        // 横向：标签统一放节点右侧（末层标签落在右侧预留区内，不溢出画布）
        labelNodes.push(
          text(r2(nd.x + nodeWidth + 6), r2(nd.y + nd.height / 2 + theme.fontSize / 2 - 1), nd.name, {
            key: `nlabel/${nd.index}`,
            anchor: 'start',
            fontSize: theme.fontSize,
            fontWeight: hovered ? 600 : undefined,
            fill: hovered ? theme.colors[0] : theme.textColor,
            fontFamily: theme.fontFamily,
          })
        )
      }
    }

    return group({
      key: 'plot',
      children: [
        group({ key: 'links', children: linkNodes }),
        group({ key: 'nodes', children: nodeNodes }),
        group({ key: 'nlabels', children: labelNodes }),
      ],
    })
  }

  protected hitTest(x: number, y: number): number | null {
    const layout = this.layout
    if (!layout) return null
    if (layout.orient === 'vertical') {
      // 纵向：布局在虚拟横向空间，命中坐标整体转置
      const t = x
      x = y
      y = t
    }
    const nodeWidth = Math.max(4, this.option.nodeWidth ?? 16)
    // 节点优先于链路
    for (const nd of layout.nodes) {
      if (x >= nd.x && x <= nd.x + nodeWidth && y >= nd.y && y <= nd.y + nd.height) return nd.index
    }
    for (const l of layout.links) {
      if (x < l.x0 || x > l.x1 || l.x1 <= l.x0) continue
      const t = (x - l.x0) / (l.x1 - l.x0)
      // 带中心线是三次贝塞尔（控制点都在中点 x 上），直接按参数方程求 y
      const syMid = (l.sy0 + l.sy1) / 2
      const tyMid = (l.ty0 + l.ty1) / 2
      const cy = bezierY(t, syMid, tyMid)
      const half = ((l.sy1 - l.sy0) / 2) * (1 - t) + ((l.ty1 - l.ty0) / 2) * t
      if (Math.abs(y - cy) <= half + 2) return layout.nodeCount + l.index
    }
    return null
  }

  protected getHoverInfo(index: number): HoverInfo {
    const layout = this.layout
    if (!layout) return { index, x: 0, y: 0 }
    const nodeWidth = Math.max(4, this.option.nodeWidth ?? 16)
    if (index < layout.nodeCount) {
      const nd = layout.nodes.find((v) => v.index === index)
      if (!nd) return { index, x: 0, y: 0 }
      if (layout.orient === 'vertical') {
        return { index, x: r2(nd.y + nd.height / 2), y: r2(nd.x + nodeWidth / 2) }
      }
      return { index, x: r2(nd.x), y: r2(nd.y + nd.height / 2) }
    }
    const l = layout.links.find((v) => v.index === index - layout.nodeCount)
    if (!l) return { index, x: 0, y: 0 }
    const t = 0.5
    const vx = r2(l.x0 + (l.x1 - l.x0) * t)
    const vy = r2(bezierY(t, (l.sy0 + l.sy1) / 2, (l.ty0 + l.ty1) / 2))
    return layout.orient === 'vertical' ? { index, x: vy, y: vx } : { index, x: vx, y: vy }
  }

  // ============ 布局计算（纯几何，与渲染无关） ============

  private computeLayout(option: SankeyChartOption, width: number, height: number, theme: KChartTheme): Layout | null {
    const pad: Padding = { ...DEFAULT_PADDING, ...option.padding }
    const orient = option.orient ?? 'horizontal'
    // 纵向：把宽高对调，在"虚拟横向"空间算完整布局，渲染/命中时整体转置坐标
    const w = orient === 'vertical' ? height : width
    const h = orient === 'vertical' ? width : height
    const plotW = Math.max(0, w - pad.left - pad.right)
    const plotH = Math.max(0, h - pad.top - pad.bottom)
    const nodeWidth = Math.max(4, option.nodeWidth ?? 16)
    const nodeGap = Math.max(0, option.nodeGap ?? 12)
    if (option.nodes.length === 0 || plotW <= 0 || plotH <= 0) return null

    // ---- 节点去重 + 索引表 ----
    const nameToIndex = new Map<string, number>()
    option.nodes.forEach((nd, i) => {
      if (!nameToIndex.has(nd.name)) nameToIndex.set(nd.name, i)
    })
    // 端点缺失的链路直接剔除（组件层会预过滤，保证索引对齐）
    const links = option.links.filter((l) => nameToIndex.has(l.source) && nameToIndex.has(l.target))

    // ---- 入度和流量统计 ----
    const inSum = new Array<number>(option.nodes.length).fill(0)
    const outSum = new Array<number>(option.nodes.length).fill(0)
    for (const l of links) {
      outSum[nameToIndex.get(l.source)!] += l.value
      inSum[nameToIndex.get(l.target)!] += l.value
    }
    const nodeValue = option.nodes.map((nd, i) => Math.max(nd.value ?? 0, inSum[i], outSum[i], 1e-6))

    // ---- 分层（最长路径，Kahn 拓扑；环上节点兜底归入末层） ----
    const layer = new Array<number>(option.nodes.length).fill(0)
    const indeg = new Array<number>(option.nodes.length).fill(0)
    const outs: number[][] = option.nodes.map(() => [])
    for (const l of links) {
      const s = nameToIndex.get(l.source)!
      const t = nameToIndex.get(l.target)!
      if (s === t) continue // 自环不参与分层
      outs[s].push(t)
      indeg[t]++
    }
    const queue: number[] = []
    option.nodes.forEach((_, i) => {
      if (indeg[i] === 0) queue.push(i)
    })
    for (let qi = 0; qi < queue.length; qi++) {
      const s = queue[qi]
      for (const t of outs[s]) {
        layer[t] = Math.max(layer[t], layer[s] + 1)
        if (--indeg[t] === 0) queue.push(t)
      }
    }
    option.nodes.forEach((_, i) => {
      if (indeg[i] > 0) layer[i] = Math.max(...layer) // 环兜底
    })

    // ---- 层内排序：初始按原始顺序，再做一次前向 + 一次后向重心排序减少交叉 ----
    const byLayer = new Map<number, number[]>()
    option.nodes.forEach((_, i) => {
      const arr = byLayer.get(layer[i]) ?? []
      arr.push(i)
      byLayer.set(layer[i], arr)
    })
    const maxLayer = Math.max(...layer)
    const pos = new Map<number, number>()
    const syncPos = (): void => {
      for (const arr of byLayer.values()) arr.forEach((ni, p) => pos.set(ni, p))
    }
    syncPos()
    const barycenter = (ni: number, pick: (li: number) => number[]): number => {
      const arr = pick(ni)
      if (arr.length === 0) return pos.get(ni) ?? 0
      return arr.reduce((sum, p) => sum + p, 0) / arr.length
    }
    for (let l = 1; l <= maxLayer; l++) {
      byLayer.get(l)!.sort((a, b) => barycenter(a, (i) => inNeighbors(i)) - barycenter(b, (i) => inNeighbors(i)))
      syncPos()
    }
    for (let l = maxLayer - 1; l >= 0; l--) {
      byLayer.get(l)!.sort((a, b) => barycenter(a, (i) => outNeighbors(i)) - barycenter(b, (i) => outNeighbors(i)))
      syncPos()
    }
    // 邻接查询（闭包内工具函数）
    function inNeighbors(ni: number): number[] {
      return links.filter((l) => nameToIndex.get(l.target) === ni).map((l) => pos.get(nameToIndex.get(l.source)!) ?? 0)
    }
    function outNeighbors(ni: number): number[] {
      return links.filter((l) => nameToIndex.get(l.source) === ni).map((l) => pos.get(nameToIndex.get(l.target)!) ?? 0)
    }

    // ---- 垂直比例：保证最高的层放得下，其余层共用同一比例 ----
    let scale = Infinity
    for (const arr of byLayer.values()) {
      const sumV = arr.reduce((sum, ni) => sum + nodeValue[ni], 0)
      const usable = plotH - nodeGap * (arr.length - 1)
      if (sumV > 0) scale = Math.min(scale, Math.max(usable, 1) / sumV)
    }
    if (!Number.isFinite(scale)) scale = 1

    // ---- 节点几何：每层垂直居中；拖拽偏移叠加后钳制在绘图区内 ----
    const nodes: SankeyNodeLayout[] = option.nodes.map((nd, i) => ({
      index: i,
      name: nd.name,
      value: nodeValue[i],
      color: nd.color ?? getSeriesColor(theme.colors, i),
      layer: layer[i],
      x: 0,
      y: 0,
      height: 0,
    }))
    const labelSpace = (option.label?.show ?? true) ? (orient === 'vertical' ? 36 : 80) : 0 // 纵向标签在节点下方，预留收窄；横向右侧预留长标签区
    const usableW = plotW - labelSpace
    for (const arr of byLayer.values()) {
      const colH = arr.reduce((sum, ni) => sum + nodeValue[ni] * scale, 0) + nodeGap * (arr.length - 1)
      let y = pad.top + Math.max(0, (plotH - colH) / 2)
      for (const ni of arr) {
        const nd = nodes[ni]
        nd.x = pad.left + Math.max(0, usableW - nodeWidth) * (nd.layer / Math.max(1, maxLayer))
        nd.y = y
        nd.height = Math.max(2, nodeValue[ni] * scale)
        y += nd.height + nodeGap
      }
    }
    if (this.dragOffsets.size > 0) {
      for (const nd of nodes) {
        const off = this.dragOffsets.get(nd.index)
        if (!off || (off.dx === 0 && off.dy === 0)) continue
        nd.x = clamp(nd.x + off.dx, pad.left, pad.left + plotW - nodeWidth)
        nd.y = clamp(nd.y + off.dy, pad.top, pad.top + plotH - nd.height)
      }
    }

    // ---- 链路厚度带：出边按目标 y 排序，入边按源 y 排序 ----
    const outgoing = new Map<number, number[]>()
    const incoming = new Map<number, number[]>()
    links.forEach((l, li) => {
      const s = nameToIndex.get(l.source)!
      const t = nameToIndex.get(l.target)!
      pushTo(outgoing, s, li)
      pushTo(incoming, t, li)
    })
    const linkThick = links.map((l) => Math.max(1, l.value * scale))
    const linkSy = new Array<number>(links.length).fill(0)
    const linkTy = new Array<number>(links.length).fill(0)
    for (const [s, lis] of outgoing) {
      lis.sort((a, b) => nodes[nameToIndex.get(links[b].target)!].y - nodes[nameToIndex.get(links[a].target)!].y)
      let cursor = nodes[s].y
      for (const li of lis) {
        linkSy[li] = cursor
        cursor += linkThick[li]
      }
    }
    for (const [t, lis] of incoming) {
      lis.sort((a, b) => nodes[nameToIndex.get(links[b].source)!].y - nodes[nameToIndex.get(links[a].source)!].y)
      let cursor = nodes[t].y
      for (const li of lis) {
        linkTy[li] = cursor
        cursor += linkThick[li]
      }
    }

    const linkLayouts: SankeyLinkLayout[] = links.map((l, li) => {
      const s = nameToIndex.get(l.source)!
      const t = nameToIndex.get(l.target)!
      const sourceColor = option.nodes[s].color ?? getSeriesColor(theme.colors, s)
      return {
        index: li,
        source: s,
        target: t,
        value: l.value,
        color: l.color ?? sourceColor,
        x0: nodes[s].x + nodeWidth,
        sy0: linkSy[li],
        sy1: linkSy[li] + linkThick[li],
        x1: nodes[t].x,
        ty0: linkTy[li],
        ty1: linkTy[li] + linkThick[li],
      }
    })

    return { nodes, links: linkLayouts, nodeCount: option.nodes.length, theme, orient }
  }
}

// ============ 纯函数工具 ============

/** 桑基图节点流量（max(显式 value, 入和, 出和)），供核心层与组件层 tooltip 共用 */
export function sankeyNodeFlows(nodes: KSankeyNode[], links: KSankeyLink[]): Record<string, number> {
  const names = new Set(nodes.map((n) => n.name))
  const valid = links.filter((l) => names.has(l.source) && names.has(l.target))
  const inSum: Record<string, number> = {}
  const outSum: Record<string, number> = {}
  for (const l of valid) {
    outSum[l.source] = (outSum[l.source] ?? 0) + l.value
    inSum[l.target] = (inSum[l.target] ?? 0) + l.value
  }
  const flows: Record<string, number> = {}
  for (const n of nodes) {
    flows[n.name] = Math.max(n.value ?? 0, inSum[n.name] ?? 0, outSum[n.name] ?? 0)
  }
  return flows
}

/** 过滤端点缺失的链路（组件层预过滤后传入核心层，保证悬停索引与组件层数据对齐） */
export function sankeyValidLinks(nodes: KSankeyNode[], links: KSankeyLink[]): KSankeyLink[] {
  const names = new Set(nodes.map((n) => n.name))
  return links.filter((l) => names.has(l.source) && names.has(l.target))
}

/** Map 取数组，不存在则先建空数组 */
function pushTo(map: Map<number, number[]>, key: number, value: number): void {
  const arr = map.get(key)
  if (arr) arr.push(value)
  else map.set(key, [value])
}

/** 链路悬停时判断某节点是否为其端点 */
function isLinkEnd(linkIndex: number, layout: Layout, nodeIndex: number): boolean {
  const l = layout.links.find((v) => v.index === linkIndex)
  return l !== undefined && (l.source === nodeIndex || l.target === nodeIndex)
}

/** S 形带中心线在参数 t 处的 y（两端厚度中点的三次贝塞尔，控制点位于中点 x） */
function bezierY(t: number, y0: number, y1: number): number {
  const u = 1 - t
  return u * u * u * y0 + 3 * u * u * t * y0 + 3 * u * t * t * y1 + t * t * t * y1
}

/** 链路色带路径（横向：层沿 x 展开，色带为竖向厚度带） */
function ribbonPath(x0: number, sy0: number, sy1: number, x1: number, ty0: number, ty1: number, c: number): string {
  const mx = x0 + (x1 - x0) * c
  return (
    `M${r2(x0)},${r2(sy0)}` +
    `C${r2(mx)},${r2(sy0)} ${r2(mx)},${r2(ty0)} ${r2(x1)},${r2(ty0)}` +
    `L${r2(x1)},${r2(ty1)}` +
    `C${r2(mx)},${r2(ty1)} ${r2(mx)},${r2(sy1)} ${r2(x0)},${r2(sy1)}` +
    'Z'
  )
}

/** 链路色带路径（纵向：层沿 y 展开，色带为横向厚度带；坐标为虚拟横向空间转置后的值） */
function ribbonPathV(y0: number, bx0: number, bx1: number, y1: number, ex0: number, ex1: number, c: number): string {
  const my = y0 + (y1 - y0) * c
  return (
    `M${r2(bx0)},${r2(y0)}` +
    `C${r2(bx0)},${r2(my)} ${r2(ex0)},${r2(my)} ${r2(ex0)},${r2(y1)}` +
    `L${r2(ex1)},${r2(y1)}` +
    `C${r2(ex1)},${r2(my)} ${r2(bx1)},${r2(my)} ${r2(bx1)},${r2(y0)}` +
    'Z'
  )
}

function r2(v: number): number {
  return Math.round(v * 100) / 100
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v))
}
