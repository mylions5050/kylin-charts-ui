import { BaseChart } from './base-chart'
import { withAlpha } from '../utils/color'
import { defaultTheme, getSeriesColor } from '../theme'
import type { KChartTheme } from '../theme'
import { circle, group, path, text } from '../scene/nodes'
import type { GroupNode } from '../scene/nodes'
import type { HoverInfo, KColor, KRadarIndicator, KRadarSeries, Padding, Point, RenderContext } from '../types'

/** 雷达图配置（注册于 OptionMap['radar']） */
export interface RadarChartOption {
  /** 维度指标列表（至少 3 个） */
  indicators: KRadarIndicator[]
  /** 系列列表（data 顺序与 indicators 一一对应，缺位按 0 处理） */
  series: KRadarSeries[]
  /** 网格形状：多边形 / 圆形；默认 polygon */
  shape?: 'polygon' | 'circle'
  /** 网格圈数；默认 5 */
  splitNumber?: number
  /** 起始角度（度，0 = 12 点方向，顺时针）；默认 0 */
  startAngle?: number
  /** 是否显示维度名称；默认 true */
  axisName?: boolean
  /** 主题覆盖 */
  theme?: Partial<KChartTheme>
  /** 画布内边距覆盖 */
  padding?: Partial<Padding>
  /** 空数据提示文案 */
  emptyText?: string
}

/** 归一化后的系列（绘制与命中检测共用） */
interface PreparedSeries {
  series: KRadarSeries
  values: number[]
  /** 系列颜色：纯色或渐变配置 */
  color: KColor
}

interface Layout {
  cx: number
  cy: number
  R: number
  /** 各维度角（弧度，自 12 点方向顺时针） */
  angles: number[]
  theme: KChartTheme
  prepared: PreparedSeries[]
}

const DEFAULT_PADDING: Padding = { top: 36, right: 36, bottom: 36, left: 36 }

/**
 * 雷达图
 * 支持：多边形 / 圆形网格、圈数与起始角配置、多系列面积叠加、
 * 缺省 max 自动推断、自中心向外生长入场动画、
 * 悬停按角度命中维度（虚线半径线 + 顶点强调）。
 */
export class RadarChart extends BaseChart<RadarChartOption> {
  private layout: Layout | null = null

  constructor(container: HTMLElement, option: RadarChartOption) {
    super(container, option)
  }

  protected build(option: RadarChartOption, ctx: RenderContext): GroupNode {
    const theme: KChartTheme = { ...defaultTheme, ...option.theme }
    const pad: Padding = { ...DEFAULT_PADDING, ...option.padding }
    const plotW = Math.max(0, ctx.width - pad.left - pad.right)
    const plotH = Math.max(0, ctx.height - pad.top - pad.bottom)
    const cx = pad.left + plotW / 2
    const cy = pad.top + plotH / 2
    const shape = option.shape ?? 'polygon'
    const splitNumber = Math.max(2, option.splitNumber ?? 5)
    const showAxisName = option.axisName ?? true

    // ============ 空数据兜底（维度不足 3 个无法构成雷达） ============
    const prepared: PreparedSeries[] = option.series.map((s, si) => ({
      series: s,
      values: option.indicators.map((_, i) => s.data[i] ?? 0),
      color: s.color ?? getSeriesColor(theme.colors, si),
    }))
    if (option.indicators.length < 3 || prepared.length === 0) {
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
    const R = Math.max(24, Math.min(plotW, plotH) / 2 - 28)
    const n = option.indicators.length
    const step = (Math.PI * 2) / n
    const startT0 = deg2rad(option.startAngle ?? 0)
    const angles = option.indicators.map((_, i) => startT0 + step * i)
    // 各维度满格半径：优先 indicator.max，缺省取各系列在该维度的最大值
    const maxes = option.indicators.map((ind, i) => {
      if (ind.max && ind.max > 0) return ind.max
      return Math.max(1e-6, ...prepared.map((p) => p.values[i]))
    })

    this.layout = { cx, cy, R, angles, theme, prepared }

    const children: GroupNode['children'] = []

    // ============ 网格圈（分层填充，从外向内绘制形成交替色带） ============
    const gridNodes: GroupNode['children'] = []
    for (let k = splitNumber; k >= 1; k--) {
      const r = (R * k) / splitNumber
      if (shape === 'circle') {
        gridNodes.push(
          circle(cx, cy, r, {
            key: `ring-area/${k}`,
            fill: k % 2 === 0 ? withAlpha(theme.gridColor, 0.28) : 'transparent',
          })
        )
      } else {
        gridNodes.push(
          path(polygonPath(cx, cy, R, angles, r), {
            key: `ring-area/${k}`,
            fill: k % 2 === 0 ? withAlpha(theme.gridColor, 0.28) : 'transparent',
          })
        )
      }
    }
    // 网格描边
    for (let k = 1; k <= splitNumber; k++) {
      const r = (R * k) / splitNumber
      gridNodes.push(
        shape === 'circle'
          ? circle(cx, cy, r, { key: `ring-line/${k}`, fill: 'transparent', stroke: theme.gridColor, strokeWidth: 1 })
          : path(polygonPath(cx, cy, R, angles, r), { key: `ring-line/${k}`, stroke: theme.gridColor, strokeWidth: 1 })
      )
    }
    // 维度轴（中心 → 顶点辐条）
    angles.forEach((t, i) => {
      const v = polar(cx, cy, R, t)
      gridNodes.push(
        path(`M${r2(cx)},${r2(cy)}L${r2(v.x)},${r2(v.y)}`, {
          key: `spoke/${i}`,
          stroke: theme.axisLineColor,
          strokeWidth: 1,
        })
      )
    })
    children.push(group({ key: 'grid', children: gridNodes }))

    // ============ 悬停维度：虚线半径线（数据层之下） ============
    if (ctx.hoverIndex !== null && ctx.hoverIndex < n) {
      const hv = polar(cx, cy, R, angles[ctx.hoverIndex])
      children.push(
        path(`M${r2(cx)},${r2(cy)}L${r2(hv.x)},${r2(hv.y)}`, {
          key: 'hover-spoke',
          stroke: theme.axisLineColor,
          strokeWidth: 1,
          dash: [4, 4],
        })
      )
    }

    // ============ 系列（面积 → 多边形 → 顶点圆点；自中心向外生长入场） ============
    const areaNodes: GroupNode['children'] = []
    const lineNodes: GroupNode['children'] = []
    const dotNodes: GroupNode['children'] = []
    const progress = ctx.progress

    prepared.forEach((p, si) => {
      const pts: Point[] = angles.map((t, i) => polar(cx, cy, (p.values[i] / maxes[i]) * R * progress, t))
      const d = `M${pts.map((pt) => `${r2(pt.x)},${r2(pt.y)}`).join('L')}Z`

      if ((p.series.area ?? true) && progress > 0) {
        areaNodes.push(path(d, { key: `area/${si}`, fill: typeof p.color === 'string' ? withAlpha(p.color, 0.18) : this.resolvePaint(p.color) }))
      }
      lineNodes.push(path(d, { key: `line/${si}`, stroke: this.resolvePaint(p.color), strokeWidth: 2 }))

      pts.forEach((pt, i) => {
        const hovered = ctx.hoverIndex === i
        dotNodes.push(
          circle(r2(pt.x), r2(pt.y), hovered ? 5 : 3.5, {
            key: `dot/${si}/${i}`,
            fill: this.solidColor(p.color),
            stroke: '#FFFFFF',
            strokeWidth: 1.5,
          })
        )
      })
    })

    children.push(group({ key: 'series', children: [...areaNodes, ...lineNodes, ...dotNodes] }))

    // ============ 维度名称（外圈顶点外侧，按方位换锚点） ============
    if (showAxisName) {
      const nameNodes: GroupNode['children'] = []
      angles.forEach((t, i) => {
        const p = polar(cx, cy, R + 16, t)
        const sinT = Math.sin(t)
        const cosT = Math.cos(t)
        const anchor = sinT > 0.25 ? 'start' : sinT < -0.25 ? 'end' : 'middle'
        const y = p.y + (cosT >= 0 ? 2 : theme.fontSize + 2)
        nameNodes.push(
          text(r2(p.x), r2(y), option.indicators[i].name, {
            key: `axisname/${i}`,
            anchor,
            fontSize: theme.fontSize,
            fill: theme.textColor,
            fontFamily: theme.fontFamily,
          })
        )
      })
      children.push(group({ key: 'axisname', children: nameNodes }))
    }

    return group({ key: 'plot', children })
  }

  protected hitTest(x: number, y: number): number | null {
    const layout = this.layout
    if (!layout) return null
    const { cx, cy, R, angles } = layout
    const dx = x - cx
    const dy = y - cy
    const dist = Math.hypot(dx, dy)
    // 命中范围：网格外圈以内 + 名称区域少量外延
    if (dist > R + 12) return null
    let t = Math.atan2(dx, -dy)
    if (t < 0) t += Math.PI * 2
    const step = (Math.PI * 2) / angles.length
    // 角度吸附到最近的辐条（扇区中线在两辐条正中）
    const startT0 = angles[0]
    let rel = t - startT0
    while (rel < 0) rel += Math.PI * 2
    const index = Math.round(rel / step) % angles.length
    return index
  }

  protected getHoverInfo(index: number): HoverInfo {
    const layout = this.layout
    if (!layout) return { index, x: 0, y: 0 }
    const p = polar(layout.cx, layout.cy, layout.R, layout.angles[index] ?? 0)
    return { index, x: r2(p.x), y: r2(p.y) }
  }
}

// ============ 纯函数工具 ============

function r2(v: number): number {
  return Math.round(v * 100) / 100
}

function deg2rad(deg: number): number {
  return (deg * Math.PI) / 180
}

/** 极坐标 → 直角坐标（t 自 12 点方向顺时针） */
function polar(cx: number, cy: number, r: number, t: number): Point {
  return { x: cx + r * Math.sin(t), y: cy - r * Math.cos(t) }
}

/** 顶点在 angles 方向上、半径 r 的多边形路径 */
function polygonPath(cx: number, cy: number, R: number, angles: number[], r: number): string {
  const pts = angles.map((t) => polar(cx, cy, Math.min(r, R), t))
  return `M${pts.map((p) => `${r2(p.x)},${r2(p.y)}`).join('L')}Z`
}
