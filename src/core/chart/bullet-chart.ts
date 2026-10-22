import { BaseChart } from './base-chart'
import { clamp } from '../utils/math'
import { withAlpha } from '../utils/color'
import { defaultTheme } from '../theme'
import type { KChartTheme } from '../theme'
import { group, path, rect, text } from '../scene/nodes'
import type { GroupNode } from '../scene/nodes'
import type { HoverInfo, KBulletDatum, Padding, RenderContext } from '../types'

/** 子弹图配置 */
export interface BulletChartOption {
  /** 数据列表（每行一条） */
  data: KBulletDatum[]
  /** 分段带高 px，缺省 22 */
  rangeHeight?: number
  /** 值条高 px，缺省 12 */
  barHeight?: number
  /** 左侧名称列宽 px，缺省 88 */
  labelWidth?: number
  theme?: Partial<KChartTheme>
  padding?: Partial<Padding>
  emptyText?: string
}

const DEFAULT_PADDING: Padding = { top: 20, right: 64, bottom: 20, left: 20 }
/** 右侧数值列保留宽度 */
const VALUE_W = 56

/** 行布局（命中检测 / tooltip 定位共用） */
interface BulletRow {
  x0: number
  plotW: number
  cy: number
  pitch: number
  rangeH: number
  barH: number
  scaleMax: number
  datum: KBulletDatum
  color: string
  bands: Array<{ from: number; to: number; alpha: number }>
}

/**
 * 子弹图（Bullet Chart）
 * 每行 = 定性分段底带（灰阶渐深）+ 实际值条 + 目标值竖线，
 * 一行同时表达「实际 vs 目标 vs 分段量程」。悬停索引 = 行下标。
 */
export class BulletChart extends BaseChart<BulletChartOption> {
  private rows: BulletRow[] = []
  private cacheSig = ''

  protected build(option: BulletChartOption, ctx: RenderContext): GroupNode {
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

    const rangeH = option.rangeHeight ?? 22
    const barH = option.barHeight ?? 12
    const labelW = option.labelWidth ?? 88
    this.buildModel(option, theme, plotH, pad, labelW, plotW, rangeH, barH)

    const children: GroupNode['children'] = []

    this.rows.forEach((row, i) => {
      const local = clamp01(ctx.progress * 1.4 - i * 0.12)
      const fade = clamp01(ctx.progress * 2)

      // ---- 定性分段底带 ----
      row.bands.forEach((band, k) => {
        const x1 = row.x0 + row.plotW * clamp01(band.to / row.scaleMax) * clamp01(ctx.progress * 1.4 - i * 0.12)
        const x0 = row.x0 + row.plotW * clamp01(band.from / row.scaleMax)
        if (x1 - x0 <= 0.5) return
        children.push(
          rect(x0, row.cy - row.rangeH / 2, x1 - x0, row.rangeH, {
            key: `band/${i}/${k}`,
            radius: 2,
            fill: withAlpha(theme.textColor, band.alpha),
            opacity: fade,
            cursor: 'pointer',
          })
        )
      })

      // ---- 实际值条 ----
      if (local > 0.001) {
        children.push(
          rect(row.x0, row.cy - row.barH / 2, Math.max(row.plotW * clamp01(row.datum.value / row.scaleMax) * local, 1), row.barH, {
            key: `bar/${i}`,
            radius: 2,
            fill: row.color,
            opacity: fade,
            cursor: 'pointer',
          })
        )
      }

      // ---- 目标值竖线 ----
      if (row.datum.target != null) {
        const tx = row.x0 + row.plotW * clamp01(row.datum.target / row.scaleMax)
        children.push(
          path(`M ${r2(tx)} ${r2(row.cy - row.rangeH / 2 - 3)} L ${r2(tx)} ${r2(row.cy + row.rangeH / 2 + 3)}`, {
            key: `target/${i}`,
            stroke: theme.textColor,
            strokeWidth: 2,
            opacity: clamp01((ctx.progress - 0.3) * 2),
            cursor: 'pointer',
          })
        )
      }

      // ---- 行名称 ----
      children.push(
        text(pad.left, row.cy + theme.fontSize / 3, row.datum.name, {
          key: `label/${i}`,
          anchor: 'start',
          fontSize: theme.fontSize,
          fill: theme.textColor,
          fontFamily: theme.fontFamily,
          opacity: fade,
        })
      )

      // ---- 右侧数值 ----
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

    return group({ key: 'plot', children: [group({ key: 'bullets', children })] })
  }

  /** 命中检测：按 y 找最近行 */
  protected hitTest(x: number, y: number): number | null {
    if (this.rows.length === 0) return null
    for (let i = 0; i < this.rows.length; i++) {
      if (Math.abs(y - this.rows[i].cy) <= this.rows[i].pitch / 2) return i
    }
    return null
  }

  protected getHoverInfo(index: number): HoverInfo {
    const row = this.rows[index]
    if (!row) return { index, x: 0, y: 0 }
    return { index, x: r2(row.x0 + row.plotW * clamp01(row.datum.value / row.scaleMax)), y: r2(row.cy) }
  }

  // ============ 布局（签名缓存） ============

  private buildModel(
    option: BulletChartOption,
    theme: KChartTheme,
    plotH: number,
    pad: Padding,
    labelW: number,
    plotW: number,
    rangeH: number,
    barH: number
  ): void {
    const sig = JSON.stringify([option.data, plotH, plotW, labelW])
    if (this.rows.length > 0 && sig === this.cacheSig) return
    this.cacheSig = sig

    const n = option.data.length
    const pitch = plotH / n
    const x0 = pad.left + labelW
    const barPlotW = plotW - labelW - VALUE_W

    this.rows = option.data.map((datum, i) => {
      // 分段：缺省按实际值 1.25 倍单段
      const ranges = datum.ranges && datum.ranges.length > 0 ? [...datum.ranges].sort((a, b) => a - b) : [Math.max(datum.value, 1) * 1.25]
      const scaleMax = Math.max(ranges[ranges.length - 1], datum.value, datum.target ?? 0)
      const bands: BulletRow['bands'] = []
      let prev = 0
      ranges.forEach((to, k) => {
        bands.push({ from: prev, to, alpha: 0.07 + k * 0.05 })
        prev = to
      })
      return {
        x0,
        plotW: Math.max(0, barPlotW),
        cy: pad.top + pitch * (i + 0.5),
        pitch,
        rangeH,
        barH,
        scaleMax: Math.max(scaleMax, 1e-9),
        datum,
        color: datum.color ?? theme.colors[i % theme.colors.length],
        bands,
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
