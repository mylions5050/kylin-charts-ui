import { BaseChart } from './base-chart'
import { clamp } from '../utils/math'
import { withAlpha } from '../utils/color'
import { defaultTheme } from '../theme'
import type { KChartTheme } from '../theme'
import { circle, group, path, text } from '../scene/nodes'
import type { GroupNode } from '../scene/nodes'
import type { HoverInfo, KGaugeDatum, KGaugeStop, Padding, RenderContext } from '../types'

/** 仪表盘配置 */
export interface GaugeChartOption {
  /** 仪表数据（单值） */
  data: KGaugeDatum
  /** 起始角度（度，数学角 0 = 3 点方向，逆时针为正），缺省 220 */
  startAngle?: number
  /** 结束角度，缺省 -40（合计 260° 扫过区间） */
  endAngle?: number
  /** 表盘半径占可用短边一半的比例，缺省 0.82 */
  radiusRatio?: number
  /** 进度弧线宽 px，缺省 14 */
  axisWidth?: number
  /** 阈值色标（value 为 0~1 进度位置），缺省整条品牌紫 */
  stops?: KGaugeStop[]
  /** 主刻度数量（含两端），缺省 6 */
  tickCount?: number
  /** 是否显示指针，缺省 true */
  pointer?: { show?: boolean }
  /** 中心数值文本，缺省展示 */
  detail?: { show?: boolean; fontSize?: number }
  theme?: Partial<KChartTheme>
  padding?: Partial<Padding>
  emptyText?: string
}

const DEFAULT_PADDING: Padding = { top: 24, right: 24, bottom: 24, left: 24 }

/** 内部布局模型（命中检测 / tooltip 定位共用） */
interface GaugeLayout {
  cx: number
  cy: number
  r: number
  startAngle: number
  endAngle: number
  min: number
  max: number
  value: number
  valueT: number
}

/**
 * 仪表盘（Gauge）
 * 弧形表盘：背景弧 + 阈值色标进度弧 + 刻度 + 指针 + 中心数值。
 * 入场：进度弧与指针随 progress 同步扫到目标角度。悬停索引恒为 0。
 */
export class GaugeChart extends BaseChart<GaugeChartOption> {
  private layoutCache: GaugeLayout | null = null
  private cacheSig = ''

  protected build(option: GaugeChartOption, ctx: RenderContext): GroupNode {
    const theme: KChartTheme = { ...defaultTheme, ...option.theme }
    const pad: Padding = { ...DEFAULT_PADDING, ...option.padding }
    const plotW = Math.max(0, ctx.width - pad.left - pad.right)
    const plotH = Math.max(0, ctx.height - pad.top - pad.bottom)
    if (plotW <= 0 || plotH <= 0) {
      return group({ key: 'empty-plot', children: [] })
    }

    const startAngle = option.startAngle ?? 220
    const endAngle = option.endAngle ?? -40
    const axisWidth = option.axisWidth ?? 14
    const min = option.data.min ?? 0
    const max = option.data.max ?? 100
    const value = clamp(option.data.value, min, max)
    const valueT = max > min ? (value - min) / (max - min) : 0

    const cx = pad.left + plotW / 2
    const cy = pad.top + plotH / 2
    const r = Math.min(plotW, plotH) / 2 * (option.radiusRatio ?? 0.82)
    this.layoutCache = { cx, cy, r, startAngle, endAngle, min, max, value, valueT }

    // 入场：前 70% 进度扫弧，之后指针微调到位
    const sweepT = valueT * clamp01(ctx.progress * 1.4)
    const curAngle = startAngle + (endAngle - startAngle) * sweepT
    const fade = clamp01(ctx.progress * 2)

    const children: GroupNode['children'] = []

    // ---- 背景弧（完整量程） ----
    children.push(
      path(
        arcPath(cx, cy, r, startAngle, endAngle),
        { key: 'track', stroke: theme.gridColor, strokeWidth: axisWidth, opacity: fade }
      )
    )

    // ---- 进度弧（按 stops 取色） ----
    if (sweepT > 0.001) {
      children.push(
        path(
          arcPath(cx, cy, r, startAngle, curAngle),
          {
            key: 'progress',
            stroke: stopColorAt(option.stops, theme, sweepT),
            strokeWidth: axisWidth,
            opacity: fade,
          }
        )
      )
    }

    // ---- 刻度 + 刻度值 ----
    const tickCount = Math.max(2, option.tickCount ?? 6)
    for (let i = 0; i < tickCount; i++) {
      const t = i / (tickCount - 1)
      const a = startAngle + (endAngle - startAngle) * t
      const cos = Math.cos((a * Math.PI) / 180)
      const sin = Math.sin((a * Math.PI) / 180)
      const inner = r - axisWidth / 2 - 5
      const outer = r - axisWidth / 2 - 12
      children.push(
        path(
          `M ${r2(cx + cos * inner)} ${r2(cy - sin * inner)} L ${r2(cx + cos * outer)} ${r2(cy - sin * outer)}`,
          { key: `tick/${i}`, stroke: theme.axisLineColor, strokeWidth: 1, opacity: fade }
        )
      )
      const labelVal = min + (max - min) * t
      const lr = outer - 8
      children.push(
        text(cx + cos * lr, cy - sin * lr + theme.fontSize / 3, formatNum(labelVal), {
          key: `ticklabel/${i}`,
          anchor: cos > 0.35 ? 'start' : cos < -0.35 ? 'end' : 'middle',
          fontSize: theme.fontSize,
          fill: theme.textColor,
          fontFamily: theme.fontFamily,
          opacity: fade,
        })
      )
    }

    // ---- 指针 ----
    if (option.pointer?.show ?? true) {
      const a = (curAngle * Math.PI) / 180
      const cos = Math.cos(a)
      const sin = Math.sin(a)
      const tipLen = r - axisWidth / 2 - 16
      const tipX = cx + cos * tipLen
      const tipY = cy - sin * tipLen
      // 针身三角：尖端 + 两侧后掠点
      const side = 7
      const perpX = sin
      const perpY = cos
      const backX = cx - cos * 10
      const backY = cy + sin * 10
      children.push(
        path(
          `M ${r2(tipX)} ${r2(tipY)} L ${r2(backX + perpX * side)} ${r2(backY - perpY * side)} L ${r2(backX)} ${r2(backY)} L ${r2(backX - perpX * side)} ${r2(backY + perpY * side)} Z`,
          { key: 'needle', fill: theme.colors[0], opacity: fade }
        )
      )
      children.push(
        circle(cx, cy, 5, { key: 'hub', fill: theme.colors[0], stroke: '#FFFFFF', strokeWidth: 2, opacity: fade })
      )
    }

    // ---- 中心数值 + 名称 ----
    if (option.detail?.show ?? true) {
      const detailFont = option.detail?.fontSize ?? 26
      const unit = option.data.unit ?? ''
      children.push(
        text(cx, cy + r * 0.52, `${formatNum(value)}${unit}`, {
          key: 'value',
          anchor: 'middle',
          fontSize: detailFont,
          fontWeight: 600,
          fill: theme.textColor,
          fontFamily: theme.fontFamily,
          opacity: clamp01((ctx.progress - 0.3) * 2.5),
        })
      )
      const name = option.data.name ?? ''
      if (name) {
        children.push(
          text(cx, cy + r * 0.52 + detailFont * 0.8, name, {
            key: 'name',
            anchor: 'middle',
            fontSize: theme.fontSize,
            fill: theme.textColor,
            fontFamily: theme.fontFamily,
            opacity: clamp01((ctx.progress - 0.3) * 2.5),
          })
        )
      }
    }

    return group({ key: 'plot', children: [group({ key: 'gauge', children })] })
  }

  /** 命中检测：指针落在表盘半径内即命中（索引恒 0） */
  protected hitTest(x: number, y: number): number | null {
    const lay = this.layoutCache
    if (!lay) return null
    const d = Math.hypot(x - lay.cx, y - lay.cy)
    return d <= lay.r + 12 ? 0 : null
  }

  protected getHoverInfo(index: number): HoverInfo {
    const lay = this.layoutCache
    if (!lay) return { index, x: 0, y: 0 }
    const a = ((lay.startAngle + (lay.endAngle - lay.startAngle) * lay.valueT) * Math.PI) / 180
    const tipLen = lay.r * 0.55
    return { index, x: r2(lay.cx + Math.cos(a) * tipLen), y: r2(lay.cy - Math.sin(a) * tipLen) }
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

/** 取进度 t（0~1）处的色标颜色（最后一个 value ≤ t 的 stop，缺省品牌紫） */
function stopColorAt(stops: KGaugeStop[] | undefined, theme: KChartTheme, t: number): string {
  if (!stops || stops.length === 0) return theme.colors[0]
  const sorted = [...stops].sort((a, b) => a.value - b.value)
  let color = sorted[0].color
  for (const st of sorted) {
    if (t >= st.value) color = st.color
  }
  return color
}

function formatNum(v: number): string {
  return Number.isInteger(v) ? String(v) : String(Math.round(v * 100) / 100)
}

function r2(v: number): number {
  return Math.round(v * 100) / 100
}

function clamp01(v: number): number {
  return clamp(v, 0, 1)
}
