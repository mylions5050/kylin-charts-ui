import { BaseChart } from './base-chart'
import { defaultTheme, getSeriesColor } from '../theme'
import type { KChartTheme } from '../theme'
import { group, path, circle, text } from '../scene/nodes'
import type { GroupNode } from '../scene/nodes'
import { lighten } from '../utils/color'
import type { HoverInfo, KFunnelDatum, Padding, RenderContext } from '../types'

/** 漏斗图配置（注册于 OptionMap['funnel']） */
export interface FunnelChartOption {
  /** 数据项列表（展示顺序由 sort 决定） */
  data: KFunnelDatum[]
  /** 排序：desc 从大到小（默认）/ asc 升序金字塔 / none 保持原始顺序 */
  sort?: 'desc' | 'asc' | 'none'
  /** 水平对齐：center 居中（默认）/ left 靠左 / right 靠右 */
  align?: 'center' | 'left' | 'right'
  /**
   * 形态：funnel 梯形漏斗（默认，每层宽度按本层值占比，数据会改变轮廓）/ triangle 倒三角
   * （严格等腰三角形，上宽下尖）/ pyramid 正金字塔（严格等腰，上尖下宽）/ square 方形
   * （各层同宽的纯几何矩形，与数据无关）；triangle / pyramid / square 轮廓均按层数线性
   * 变化、与数据无关；circle 圆泡漏斗（每层一个圆，直径按本层值占比、圆心等距垂直排列）
   */
  shape?: 'funnel' | 'triangle' | 'pyramid' | 'square' | 'circle'
  /** 层间距 px；默认 6 */
  gap?: number
  /** 是否显示标签（层内名称 + 层外数值引导线）；默认 true */
  label?: { show?: boolean }
  /** 主题覆盖 */
  theme?: Partial<KChartTheme>
  /** 画布内边距覆盖 */
  padding?: Partial<Padding>
  /** 空数据提示文案 */
  emptyText?: string
}

/** 悬停强调：层级颜色向白色混合的提亮幅度（与饼图保持一致） */
const HOVER_BRIGHTEN = 0.12
/** 悬停时其他层级的半透明化强度（opacity 降至 0.4，与饼图保持一致） */
const HOVER_DIM = 0.6
/** 单层最大高度 px：超出后漏斗整体在绘图区内垂直居中，避免撑满容器显得笨重 */
const MAX_STAGE_H = 60
/** 漏斗最大宽度占绘图区高度的比例：控制宽高比，避免“大碗”形态 */
const MAX_W_RATIO = 0.88

/** 层级内部模型（绘制与命中检测共用，按展示顺序排列） */
interface FunnelStage {
  /** 对应原始数据索引（命中后映射回 tooltip） */
  dataIndex: number
  name: string
  value: number
  percent: number
  color: string
  y0: number
  y1: number
  wTop: number
  wBot: number
  /** 命中包围盒 */
  minX: number
  maxX: number
}

interface Layout {
  stages: FunnelStage[]
  align: 'center' | 'left' | 'right'
  /** center 模式的中轴 x / left 模式的左缘 / right 模式的右缘 */
  anchorX: number
  theme: KChartTheme
}

const DEFAULT_PADDING: Padding = { top: 16, right: 16, bottom: 16, left: 16 }

/**
 * 漏斗图
 * 支持：desc / asc / none 排序、center / left / right 对齐、层间距、
 * funnel / triangle / pyramid / square / circle 五种形态、
 * 层内名称标签 + 层外数值引导线、限宽限高垂直居中的紧凑布局、
 * 悬停层级提亮 + 其余层级半透明（逐层级动画过渡，与饼图交互一致）、
 * 自上而下逐层展开入场动画。
 */
export class FunnelChart extends BaseChart<FunnelChartOption> {
  private layout: Layout | null = null
  /** 悬停强调动画值（按下标）：0（无强调）~ 1（完全强调），逐层级独立缓动 */
  private hoverEases = new Map<number, number>()
  private hoverRaf: number | null = null

  constructor(container: HTMLElement, option: FunnelChartOption) {
    super(container, option)
  }

  override destroy(): void {
    if (this.hoverRaf !== null) cancelAnimationFrame(this.hoverRaf)
    super.destroy()
  }

  /** 悬停强调缓动：各层级动画值逐帧向目标（悬停 1 / 非悬停 0）逼近，切换层级时旧层级平滑退出 */
  private tickHoverAnim = (): void => {
    let active = false
    this.hoverEases.forEach((v, k) => {
      const target = k === this.hoverIndex ? 1 : 0
      if (Math.abs(target - v) > 0.005) {
        const nv = v + (target - v) * 0.22
        this.hoverEases.set(k, Math.abs(target - nv) < 0.005 ? target : nv)
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

  /** 在 build 内调用：为新悬停层级补动画值、清理已收敛项，并按需启动缓动 */
  private updateHoverAnim(hoverIndex: number | null): Map<number, number> {
    if (hoverIndex !== null && !this.hoverEases.has(hoverIndex)) this.hoverEases.set(hoverIndex, 0)
    this.hoverEases.forEach((v, k) => {
      if (k !== hoverIndex && v <= 0.005) this.hoverEases.delete(k)
    })
    let need = false
    this.hoverEases.forEach((v, k) => {
      if (Math.abs((k === hoverIndex ? 1 : 0) - v) > 0.005) need = true
    })
    if (need && this.hoverRaf === null) {
      this.hoverRaf = requestAnimationFrame(this.tickHoverAnim)
    }
    return this.hoverEases
  }

  protected build(option: FunnelChartOption, ctx: RenderContext): GroupNode {
    const theme: KChartTheme = { ...defaultTheme, ...option.theme }
    const pad: Padding = { ...DEFAULT_PADDING, ...option.padding }
    const plotW = Math.max(0, ctx.width - pad.left - pad.right)
    const plotH = Math.max(0, ctx.height - pad.top - pad.bottom)
    const sort = option.sort ?? 'desc'
    const align = option.align ?? 'center'
    const shape = option.shape ?? 'funnel'
    const gap = Math.max(0, option.gap ?? 6)
    const showLabel = option.label?.show ?? true

    // ============ 空数据兜底 ============
    const total = option.data.reduce((sum, d) => sum + d.value, 0)
    const maxV = Math.max(0, ...option.data.map((d) => d.value))
    if (option.data.length === 0 || total <= 0 || maxV <= 0) {
      this.layout = null
      return group({
        key: 'empty',
        children: [
          text(pad.left + plotW / 2, pad.top + plotH / 2, option.emptyText ?? '暂无数据', {
            key: 'empty-text',
            anchor: 'middle',
            fontSize: 14,
            fill: theme.emptyColor,
            fontFamily: theme.fontFamily,
          }),
        ],
      })
    }

    // ============ 展示顺序与几何布局 ============
    const order = sortFunnelIndexes(option.data, sort)

    const labelSpace = showLabel ? 110 : 20
    // 视觉收紧：宽度不撑满容器（限宽高比），单层高度封顶，整体在绘图区内垂直居中
    const maxW = Math.max(24, Math.min(plotW - labelSpace, plotH * MAX_W_RATIO))
    const anchorX = align === 'left' ? pad.left : align === 'right' ? pad.left + plotW - labelSpace : pad.left + (plotW - labelSpace) / 2
    const n = order.length
    const slotH = Math.max(12, (plotH - gap * (n - 1)) / n)
    const stageH = Math.max(12, Math.min(MAX_STAGE_H, slotH))
    const startY = pad.top + (plotH - (stageH * n + gap * (n - 1))) / 2
    // circle 模式：圆比梯形适合更大尺寸，槽位高度单独放宽（上限 64px）
    const circleSlot = Math.min(slotH, 64)
    const circleDMax = Math.min(maxW, circleSlot * 0.94)
    const circleStartY = pad.top + (plotH - (circleSlot * n + gap * (n - 1))) / 2

    // triangle / pyramid / square：纯几何等腰轮廓——边界宽度按层数线性收缩（k/n），与数据无关，
    // 无论数据分布如何两侧边缘都是严格直线
    const stages: FunnelStage[] = order.map((dataIndex, i) => {
      const d = option.data[dataIndex]
      let wTop: number
      let wBot: number
      let y0 = startY + i * (stageH + gap)
      if (shape === 'triangle') {
        // 倒三角：首层上边满宽，末层下边收到 0（尖角朝下）
        wTop = ((n - i) / n) * maxW
        wBot = ((n - i - 1) / n) * maxW
      } else if (shape === 'pyramid') {
        // 正金字塔：首层上边收到 0（尖角朝上），末层下边满宽
        wTop = (i / n) * maxW
        wBot = ((i + 1) / n) * maxW
      } else if (shape === 'square') {
        // 方形：各层同宽，轮廓为与数据无关的矩形
        wTop = maxW
        wBot = maxW
      } else if (shape === 'circle') {
        // 圆泡漏斗：每层一个圆，直径按本层值占比，圆心等距垂直排列；y0/y1 存圆的外接包围盒
        const dia = Math.max(10, (d.value / maxV) * circleDMax)
        const cy = circleStartY + i * (circleSlot + gap) + circleSlot / 2
        wTop = dia
        wBot = dia
        y0 = cy - dia / 2
      } else {
        // 梯形漏斗：每层宽度按本层值占比（相邻层共享同值底边）
        const nextValue = i < n - 1 ? option.data[order[i + 1]].value : d.value
        wTop = Math.max(6, (d.value / maxV) * maxW)
        wBot = Math.max(6, (nextValue / maxV) * maxW)
      }
      const y1 = y0 + (shape === 'circle' ? wTop : stageH)
      // 命中包围盒（入场动画不影响命中几何）
      const xs = stageXs(align, anchorX, wTop, wBot)
      return {
        dataIndex,
        name: d.name,
        value: d.value,
        percent: (d.value / total) * 100,
        color: getSeriesColor(theme.colors, dataIndex, d.color),
        y0,
        y1,
        wTop,
        wBot,
        minX: Math.min(...xs.flat()),
        maxX: Math.max(...xs.flat()),
      }
    })

    this.layout = { stages, align, anchorX, theme }

    const children: GroupNode['children'] = []

    // ============ 层级梯形（自上而下逐层展开入场） ============
    const stageNodes: GroupNode['children'] = []
    const insideLabelNodes: GroupNode['children'] = []
    const outsideLabelNodes: GroupNode['children'] = []

    const hoverEases = this.updateHoverAnim(ctx.hoverIndex)

    stages.forEach((s, i) => {
      const ease = hoverEases.get(i) ?? 0
      // 其余层级的淡化量取各自缓动值的最大值，实现平滑交叉过渡
      let dim = 0
      hoverEases.forEach((v, k) => {
        if (k !== i) dim = Math.max(dim, v)
      })
      // 入场：每层的展开窗口错开（第 i 层在 progress ∈ [i/n, (i+1)/n] 内展开）
      const local = clamp01(ctx.progress * n - i)
      const wTop = s.wTop * local
      const wBot = s.wBot * local
      const xs = stageXs(align, anchorX, wTop, wBot)
      const [[xlt, xrt], [xlb, xrb]] = xs

      const stageFill = ease > 0.01 ? lighten(s.color, HOVER_BRIGHTEN * ease) : s.color
      const stageOpacity = 1 - HOVER_DIM * dim
      if (shape === 'circle') {
        // 圆泡漏斗：半径随入场进度从圆心放大
        stageNodes.push(
          circle(labelCenterX(align, anchorX, s.wTop), (s.y0 + s.y1) / 2, (s.wTop / 2) * local, {
            key: `stage/${s.dataIndex}`,
            fill: stageFill,
            opacity: stageOpacity,
          })
        )
      } else {
        stageNodes.push(
          path(trapezoidPath(xlt, xrt, xlb, xrb, s.y0, s.y1), {
            key: `stage/${s.dataIndex}`,
            fill: stageFill,
            opacity: stageOpacity,
          })
        )
      }

      if (ctx.progress < 1) return

      const midW = (s.wTop + s.wBot) / 2
      const midY = (s.y0 + s.y1) / 2
      // 层内名称（过窄的层省略，名称并入层外标签）
      if (midW >= 48) {
        const cx = labelCenterX(align, anchorX, midW)
        insideLabelNodes.push(
          text(r2(cx), r2(midY + theme.fontSize / 2 - 1), s.name, {
            key: `ilabel/${s.dataIndex}`,
            anchor: 'middle',
            fontSize: theme.fontSize,
            fontWeight: 600,
            fill: '#FFFFFF',
            fontFamily: theme.fontFamily,
          })
        )
      }
      // 层外数值引导线（右缘中点 → 水平段 → 文本）
      if (showLabel) {
        const midRightX = align === 'center' ? anchorX + midW / 2 : align === 'left' ? anchorX + midW : anchorX
        const nameIn = midW >= 48
        const labelText = nameIn ? `${s.value}（${formatPercent(s.percent)}）` : `${s.name} ${s.value}（${formatPercent(s.percent)}）`
        outsideLabelNodes.push(
          path(`M${r2(midRightX)},${r2(midY)}L${r2(midRightX + 8)},${r2(midY)}L${r2(midRightX + 14)},${r2(midY)}`, {
            key: `oline/${s.dataIndex}`,
            stroke: theme.axisLineColor,
            strokeWidth: 1,
          })
        )
        outsideLabelNodes.push(
          text(r2(midRightX + 18), r2(midY + theme.fontSize / 2 - 1), labelText, {
            key: `olabel/${s.dataIndex}`,
            anchor: 'start',
            fontSize: theme.fontSize,
            fill: theme.textColor,
            fontFamily: theme.fontFamily,
          })
        )
      }
    })

    children.push(group({ key: 'stages', children: stageNodes }))
    children.push(group({ key: 'ilabels', children: insideLabelNodes }))
    children.push(group({ key: 'olabels', children: outsideLabelNodes }))

    return group({ key: 'plot', children })
  }

  protected hitTest(x: number, y: number): number | null {
    const layout = this.layout
    if (!layout) return null
    for (let i = 0; i < layout.stages.length; i++) {
      const s = layout.stages[i]
      if (y >= s.y0 && y <= s.y1 && x >= s.minX - 2 && x <= s.maxX + 2) return i
    }
    return null
  }

  protected getHoverInfo(index: number): HoverInfo {
    const layout = this.layout
    if (!layout) return { index, x: 0, y: 0 }
    const s = layout.stages[index]
    if (!s) return { index, x: 0, y: 0 }
    const midW = (s.wTop + s.wBot) / 2
    const x = layout.align === 'left' ? layout.anchorX + midW / 2 : layout.align === 'right' ? layout.anchorX - midW / 2 : layout.anchorX
    return { index, x: r2(x), y: r2((s.y0 + s.y1) / 2) }
  }
}

// ============ 纯函数工具 ============

/** 漏斗展示顺序（返回原始数据索引序列），供核心层与组件层 tooltip 共用 */
export function sortFunnelIndexes(data: KFunnelDatum[], sort: 'desc' | 'asc' | 'none'): number[] {
  const order = data.map((_, i) => i)
  if (sort === 'none') return order
  return order.sort((a, b) => {
    const diff = data[b].value - data[a].value
    return sort === 'desc' ? diff : -diff
  })
}

function r2(v: number): number {
  return Math.round(v * 100) / 100
}

function clamp01(v: number): number {
  return Math.min(1, Math.max(0, v))
}

function formatPercent(p: number): string {
  return `${Number(p.toFixed(1))}%`
}

/** 层级四角 x 坐标（上左右 / 下左右），按对齐方式推导 */
function stageXs(align: 'center' | 'left' | 'right', anchorX: number, wTop: number, wBot: number): [[number, number], [number, number]] {
  if (align === 'left') {
    return [
      [anchorX, anchorX + wTop],
      [anchorX, anchorX + wBot],
    ]
  }
  if (align === 'right') {
    return [
      [anchorX - wTop, anchorX],
      [anchorX - wBot, anchorX],
    ]
  }
  return [
    [anchorX - wTop / 2, anchorX + wTop / 2],
    [anchorX - wBot / 2, anchorX + wBot / 2],
  ]
}

/** 层内标签中心 x */
function labelCenterX(align: 'center' | 'left' | 'right', anchorX: number, midW: number): number {
  if (align === 'left') return anchorX + midW / 2
  if (align === 'right') return anchorX - midW / 2
  return anchorX
}

/** 梯形路径 */
function trapezoidPath(xlt: number, xrt: number, xlb: number, xrb: number, y0: number, y1: number): string {
  return `M${r2(xlt)},${r2(y0)}L${r2(xrt)},${r2(y0)}L${r2(xrb)},${r2(y1)}L${r2(xlb)},${r2(y1)}Z`
}
