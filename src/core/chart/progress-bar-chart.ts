import { BaseChart } from './base-chart'
import { clamp } from '../utils/math'
import { withAlpha } from '../utils/color'
import { defaultTheme } from '../theme'
import type { KChartTheme } from '../theme'
import { group, rect, text } from '../scene/nodes'
import type { GroupNode } from '../scene/nodes'
import type { HoverInfo, KColor, KProgressBarDatum, Padding, RenderContext } from '../types'

/** 线性进度条配置 */
export interface ProgressBarChartOption {
  /** 数据列表（每行一条） */
  data: KProgressBarDatum[]
  /** 条高 px，缺省 18 */
  barHeight?: number
  /** 左侧名称列宽 px，缺省 88 */
  labelWidth?: number
  /** 是否显示底槽，缺省 true */
  showTrack?: boolean
  theme?: Partial<KChartTheme>
  padding?: Partial<Padding>
  emptyText?: string
}

const DEFAULT_PADDING: Padding = { top: 20, right: 64, bottom: 20, left: 20 }
/** 右侧数值列保留宽度 */
const VALUE_W = 56

/** 行布局（命中检测 / tooltip 定位共用） */
interface BarRow {
  x0: number
  barW: number
  cy: number
  pitch: number
  valueT: number
  datum: KProgressBarDatum
  /** 条色：纯色或渐变配置 */
  color: KColor
}

/**
 * 线性进度条（Progress Bar）
 * 多行水平进度条：左名称、中条身（底槽 + 值条圆角）、右数值。
 * 入场：各行值条错峰从 0 长到目标宽度。悬停索引 = 行下标。
 */
export class ProgressBarChart extends BaseChart<ProgressBarChartOption> {
  private rows: BarRow[] = []
  private cacheSig = ''

  protected build(option: ProgressBarChartOption, ctx: RenderContext): GroupNode {
    const theme: KChartTheme = { ...defaultTheme, ...option.theme }
    const pad: Padding = { ...DEFAULT_PADDING, ...option.padding }
    const plotW = Math.max(0, ctx.width - pad.left - pad.right)
    const plotH = Math.max(0, ctx.height - pad.top - pad.bottom)
    if (option.data.length === 0 || plotW <= 0 || plotH <= 0) {
      this.rows = []
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

    const barH = option.barHeight ?? 18
    const labelW = option.labelWidth ?? 88
    this.buildModel(option, theme, plotH, pad, labelW, plotW)

    const children: GroupNode['children'] = []
    const n = this.rows.length

    this.rows.forEach((row, i) => {
      // 入场：各行错峰生长
      const local = clamp01(ctx.progress * 1.4 - i * 0.12)
      const radius = barH / 2

      // 底槽
      if (option.showTrack ?? true) {
        children.push(
          rect(row.x0, row.cy - barH / 2, row.barW, barH, {
            key: `track/${i}`,
            radius,
            fill: withAlpha(theme.textColor, 0.08),
            opacity: clamp01(ctx.progress * 2),
            cursor: 'pointer',
          })
        )
      }

      // 值条（宽度按入场进度生长，最小半条高保证圆角不退化）
      if (row.valueT > 0 && local > 0.001) {
        const w = Math.max(row.barW * row.valueT * local, barH * 0.5)
        children.push(
          rect(row.x0, row.cy - barH / 2, w, barH, {
            key: `bar/${i}`,
            radius,
            fill: this.resolvePaint(row.color),
            opacity: clamp01(ctx.progress * 2),
            cursor: 'pointer',
          })
        )
      }

      // 行名称
      children.push(
        text(pad.left, row.cy + theme.fontSize / 3, row.datum.name, {
          key: `label/${i}`,
          anchor: 'start',
          fontSize: theme.fontSize,
          fill: theme.textColor,
          fontFamily: theme.fontFamily,
          opacity: clamp01(ctx.progress * 2),
        })
      )

      // 右侧数值
      children.push(
        text(ctx.width - pad.right, row.cy + theme.fontSize / 3, `${formatNum(row.datum.value)}${row.datum.unit ?? ''}`, {
          key: `value/${i}`,
          anchor: 'end',
          fontSize: theme.fontSize,
          fill: theme.textColor,
          fontFamily: theme.fontFamily,
          opacity: clamp01((ctx.progress - 0.2) * 2),
        })
      )
    })

    return group({ key: 'plot', children: [group({ key: 'bars', children })] })
  }

  /** 命中检测：按 y 找最近行 */
  protected hitTest(x: number, y: number): number | null {
    if (this.rows.length === 0) return null
    for (let i = 0; i < this.rows.length; i++) {
      const row = this.rows[i]
      if (Math.abs(y - row.cy) <= row.pitch / 2) return i
    }
    return null
  }

  protected getHoverInfo(index: number): HoverInfo {
    const row = this.rows[index]
    if (!row) return { index, x: 0, y: 0 }
    return { index, x: r2(row.x0 + row.barW * row.valueT), y: r2(row.cy) }
  }

  // ============ 布局（签名缓存） ============

  private buildModel(
    option: ProgressBarChartOption,
    theme: KChartTheme,
    plotH: number,
    pad: Padding,
    labelW: number,
    plotW: number
  ): void {
    const sig = JSON.stringify([option.data, plotH, plotW, labelW])
    if (this.rows.length > 0 && sig === this.cacheSig) return
    this.cacheSig = sig

    const n = option.data.length
    const pitch = plotH / n
    const x0 = pad.left + labelW
    const barW = plotW - labelW - VALUE_W
    this.rows = option.data.map((datum, i) => {
      const max = datum.max ?? 100
      const value = clamp(datum.value, 0, max)
      return {
        x0,
        barW: Math.max(0, barW),
        cy: pad.top + pitch * (i + 0.5),
        pitch,
        valueT: max > 0 ? value / max : 0,
        datum,
        color: datum.color ?? theme.colors[i % theme.colors.length],
      }
    })
  }
}

// ============ 纯函数工具 ============

function formatNum(v: number): string {
  return Number.isInteger(v) ? String(v) : String(Math.round(v * 100) / 100)
}

function clamp01(v: number): number {
  return clamp(v, 0, 1)
}

function r2(v: number): number {
  return Math.round(v * 100) / 100
}
