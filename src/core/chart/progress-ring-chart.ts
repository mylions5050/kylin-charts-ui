import { BaseChart } from './base-chart'
import { clamp } from '../utils/math'
import { withAlpha } from '../utils/color'
import { defaultTheme } from '../theme'
import type { KChartTheme } from '../theme'
import { circle, group, path, text } from '../scene/nodes'
import type { GroupNode } from '../scene/nodes'
import type { HoverInfo, KColor, KProgressDatum, Padding, RenderContext } from '../types'

/** 进度环配置 */
export interface ProgressRingChartOption {
  /** 进度数据（单值） */
  data: KProgressDatum
  /** 进度弧颜色（纯色或渐变，渐变沿弧线包围盒方向），缺省主题主色 */
  color?: KColor
  /** 进度弧径向渐变（沿环带半径方向从内缘色渐变到外缘色）：设置后优先于 color */
  bandGradient?: { from: string; to: string }
  /** 环带端点样式：'round' 两端圆头（对齐 stroke-linecap），缺省 'butt' 平头 */
  lineCap?: 'butt' | 'round'
  /** 扫描方向：true 顺时针（缺省，从 12 点向右扫）；false 逆时针（从 12 点向左扫） */
  clockwise?: boolean
  /** 环带宽度 px，缺省 14 */
  trackWidth?: number
  /** 半径占可用短边一半的比例 0~1，缺省 0.78 */
  radiusRatio?: number
  /** 是否显示底环，缺省 true */
  showTrack?: boolean
  theme?: Partial<KChartTheme>
  padding?: Partial<Padding>
  emptyText?: string
}

const DEFAULT_PADDING: Padding = { top: 24, right: 24, bottom: 24, left: 24 }

/** 内部布局模型（命中检测 / tooltip 定位共用） */
interface RingLayout {
  cx: number
  cy: number
  r: number
  trackWidth: number
  min: number
  max: number
  value: number
  pct: number
}

/**
 * 进度环（Progress Ring）
 * 从 12 点方向顺时针扫过的圆弧进度：底环 + 进度弧 + 中心大百分比与数值。
 * 无指针无刻度，与仪表盘形成差异；入场进度弧随 progress 同步扫到位。
 * 悬停索引恒为 0。
 */
export class ProgressRingChart extends BaseChart<ProgressRingChartOption> {
  private layoutCache: RingLayout | null = null
  private cacheSig = ''

  protected build(option: ProgressRingChartOption, ctx: RenderContext): GroupNode {
    const theme: KChartTheme = { ...defaultTheme, ...option.theme }
    const pad: Padding = { ...DEFAULT_PADDING, ...option.padding }
    const plotW = Math.max(0, ctx.width - pad.left - pad.right)
    const plotH = Math.max(0, ctx.height - pad.top - pad.bottom)
    if (plotW <= 0 || plotH <= 0) {
      return group({ key: 'empty-plot', children: [] })
    }

    const min = 0
    const max = option.data.max ?? 100
    const value = clamp(option.data.value, min, max)
    const pct = max > min ? value / max : 0
    const trackWidth = option.trackWidth ?? 14

    const cx = pad.left + plotW / 2
    const cy = pad.top + plotH / 2
    const r = Math.min(plotW, plotH) / 2 * (option.radiusRatio ?? 0.78)
    this.layoutCache = { cx, cy, r, trackWidth, min, max, value, pct }

    // 入场：前 70% 进度扫弧，之后文本淡入
    const sweepT = pct * clamp01(ctx.progress * 1.4)
    const fade = clamp01(ctx.progress * 2)

    const children: GroupNode['children'] = []
    // 着色：径向带渐变 > 顶层 color / 数据项 color > 主题主色。
    // bandGradient 用 user 坐标径向渐变精确覆盖环带（内缘 → 外缘），避免包围盒相对坐标在部分弧上偏心。
    let progressColor: string
    if (option.bandGradient) {
      const outerR = r + trackWidth / 2
      const innerStop = clamp((r - trackWidth / 2) / outerR, 0, 1)
      progressColor = this.resolvePaint({
        type: 'radial',
        units: 'user',
        x: cx,
        y: cy,
        r: outerR,
        colorStops: [
          { offset: innerStop, color: option.bandGradient.from },
          { offset: 1, color: option.bandGradient.to },
        ],
      })
    } else {
      // 顶层 color 优先，其次数据项自带 color（与类型定义保持一致）
      progressColor = this.resolvePaint(option.color ?? option.data.color, theme.colors[0])
    }
    const lineCap = option.lineCap === 'round' ? 'round' : undefined
    const cw = option.clockwise ?? true

    // ---- 底环 ----
    if (option.showTrack ?? true) {
      children.push(
        circle(cx, cy, r, {
          key: 'track',
          fill: 'none',
          stroke: withAlpha(theme.textColor, 0.12),
          strokeWidth: trackWidth,
          opacity: fade,
        })
      )
    }

    // ---- 进度弧（从 12 点方向扫描；接近整圆时用 circle 兜底避免弧路径退化） ----
    if (sweepT > 0.001) {
      if (sweepT >= 0.999) {
        children.push(
          circle(cx, cy, r, {
            key: 'progress',
            fill: 'none',
            stroke: progressColor,
            strokeWidth: trackWidth,
            lineCap,
            opacity: fade,
          })
        )
      } else {
        // 数学角：12 点方向 = 90°；顺时针角度递减（SVG sweep=1），逆时针角度递增（sweep=0）
        children.push(
          path(arcPath(cx, cy, r, 90, cw ? 90 - 360 * sweepT : 90 + 360 * sweepT, cw), {
            key: 'progress',
            stroke: progressColor,
            strokeWidth: trackWidth,
            lineCap,
            opacity: fade,
          })
        )
      }
    }

    // ---- 中心：大百分比 + 数值 / 上限 + 名称 ----
    const detailFont = Math.max(18, Math.round(r * 0.32))
    const percentText = `${Math.round(pct * 1000) / 10}%`
    children.push(
      text(cx, cy + detailFont * 0.34, percentText, {
        key: 'percent',
        anchor: 'middle',
        fontSize: detailFont,
        fontWeight: 700,
        fill: theme.textColor,
        fontFamily: theme.fontFamily,
        opacity: clamp01((ctx.progress - 0.3) * 2.5),
      })
    )
    const unit = option.data.unit ?? ''
    const ratioText = `${formatNum(value)} / ${formatNum(max)}${unit}`
    children.push(
      text(cx, cy + detailFont * 0.34 + detailFont * 0.82, ratioText, {
        key: 'ratio',
        anchor: 'middle',
        fontSize: theme.fontSize,
        fill: theme.textColor,
        fontFamily: theme.fontFamily,
        opacity: clamp01((ctx.progress - 0.3) * 2.5),
      })
    )
    const name = option.data.name ?? ''
    if (name) {
      children.push(
        text(cx, cy + detailFont * 0.34 + detailFont * 0.82 + theme.fontSize + 6, name, {
          key: 'name',
          anchor: 'middle',
          fontSize: theme.fontSize,
          fill: theme.textColor,
          fontFamily: theme.fontFamily,
          opacity: clamp01((ctx.progress - 0.3) * 2.5),
        })
      )
    }

    return group({ key: 'plot', children: [group({ key: 'ring', children })] })
  }

  /** 命中检测：指针落在环带附近即命中（索引恒 0） */
  protected hitTest(x: number, y: number): number | null {
    const lay = this.layoutCache
    if (!lay) return null
    const d = Math.hypot(x - lay.cx, y - lay.cy)
    // 环带内外各留 8px 命中余量（中心文本区不命中，避免遮挡阅读）
    return Math.abs(d - lay.r) <= lay.trackWidth / 2 + 8 ? 0 : null
  }

  protected getHoverInfo(index: number): HoverInfo {
    const lay = this.layoutCache
    if (!lay) return { index, x: 0, y: 0 }
    const tipLen = lay.r * 0.55
    return { index, x: r2(lay.cx), y: r2(lay.cy - tipLen) }
  }
}

// ============ 几何工具 ============

/** 角度 → 点（数学角：0 = 3 点方向，逆时针为正，屏幕 y 翻转） */
function polarPt(cx: number, cy: number, r: number, deg: number): { x: number; y: number } {
  const a = (deg * Math.PI) / 180
  return { x: cx + r * Math.cos(a), y: cy - r * Math.sin(a) }
}

/** 从 a0 扫到 a1 的弧线路径（cw=true 顺时针 a1<a0，SVG sweep=1；否则逆时针 a1>a0，sweep=0） */
function arcPath(cx: number, cy: number, r: number, a0: number, a1: number, cw = true): string {
  const p0 = polarPt(cx, cy, r, a0)
  const p1 = polarPt(cx, cy, r, a1)
  const delta = Math.abs(a0 - a1)
  const large = delta > 180 ? 1 : 0
  return `M ${r2(p0.x)} ${r2(p0.y)} A ${r2(r)} ${r2(r)} 0 ${large} ${cw ? 1 : 0} ${r2(p1.x)} ${r2(p1.y)}`
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
