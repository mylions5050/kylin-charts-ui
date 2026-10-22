import { BaseChart } from './base-chart'
import { clamp } from '../utils/math'
import { defaultTheme } from '../theme'
import type { KChartTheme } from '../theme'
import { group, rect, text } from '../scene/nodes'
import type { GroupNode } from '../scene/nodes'
import type { HoverInfo, KHeatmapDatum, Padding, RenderContext } from '../types'

/** 热力图配置（注册于 OptionMap['heatmap']） */
export interface HeatmapChartOption {
  /** 行类目（第一行绘制在顶部，自上而下） */
  rows: string[]
  /** 列类目（自左向右） */
  columns: string[]
  /** 热力数据：[列索引, 行索引, 数值]；缺失组合不绘制 */
  data: KHeatmapDatum[]
  /** 数值 → 颜色的渐变色标（>=2 个，按值域线性分段插值） */
  colorStops?: string[]
  /** 单元格数值标签配置（空间不足时自动跳过） */
  label?: { show?: boolean }
  /** 单元格间距 px */
  cellGap?: number
  /** 值域下界覆盖（缺省取数据最小值） */
  min?: number
  /** 值域上界覆盖（缺省取数据最大值） */
  max?: number
  /** 主题覆盖 */
  theme?: Partial<KChartTheme>
  /** 画布内边距覆盖 */
  padding?: Partial<Padding>
  /** 空数据提示文案 */
  emptyText?: string
}

interface Layout {
  pad: Padding
  plotX: number
  plotY: number
  plotW: number
  plotH: number
  theme: KChartTheme
  rows: string[]
  columns: string[]
  /** key = `${row}/${col}` → 数值 */
  values: Map<string, number>
  min: number
  max: number
  colorStops: string[]
  cellW: number
  cellH: number
}

const DEFAULT_PADDING: Padding = { top: 24, right: 24, bottom: 36, left: 52 }

const DEFAULT_COLOR_STOPS = ['#EAF1FF', '#8FB3FF', '#2B6FFF']

/**
 * 热力图
 * 支持：行 × 列类目网格、值域多段渐变色标（默认品牌蓝浅→深）、
 * 稀疏数据留白（缺失组合不绘制）、单元格数值标签（自动对比色 + 空间不足跳过）、
 * 悬停单元格高亮描边、单元格逐个错峰入场动画。
 * 悬停索引 = 行优先全网格序号（row * 列数 + col）。
 */
export class HeatmapChart extends BaseChart<HeatmapChartOption> {
  private layout: Layout | null = null

  constructor(container: HTMLElement, option: HeatmapChartOption) {
    super(container, option)
  }

  protected build(option: HeatmapChartOption, ctx: RenderContext): GroupNode {
    const theme: KChartTheme = { ...defaultTheme, ...option.theme }
    const pad: Padding = { ...DEFAULT_PADDING, ...option.padding }
    const plotX = pad.left
    const plotY = pad.top
    const plotW = Math.max(0, ctx.width - pad.left - pad.right)
    const plotH = Math.max(0, ctx.height - pad.top - pad.bottom)

    const rows = option.rows
    const columns = option.columns
    const values = new Map<string, number>()
    for (const [c, r, v] of option.data) {
      if (c < 0 || c >= columns.length || r < 0 || r >= rows.length) continue
      values.set(`${r}/${c}`, v)
    }

    // ============ 空数据兜底 ============
    if (rows.length === 0 || columns.length === 0 || values.size === 0) {
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

    // ============ 值域与颜色标尺 ============
    let min = option.min ?? Infinity
    let max = option.max ?? -Infinity
    if (option.min === undefined || option.max === undefined) {
      for (const v of values.values()) {
        if (option.min === undefined) min = Math.min(min, v)
        if (option.max === undefined) max = Math.max(max, v)
      }
    }
    if (!Number.isFinite(min)) min = 0
    if (!Number.isFinite(max)) max = 1
    const colorStops = option.colorStops && option.colorStops.length >= 2 ? option.colorStops : DEFAULT_COLOR_STOPS

    const cellW = plotW / columns.length
    const cellH = plotH / rows.length

    this.layout = { pad, plotX, plotY, plotW, plotH, theme, rows, columns, values, min, max, colorStops, cellW, cellH }

    const children: GroupNode['children'] = []

    // ============ 行 / 列类目标签 ============
    const axisBottom = plotY + plotH
    const rowLabelNodes: GroupNode['children'] = []
    for (let r = 0; r < rows.length; r++) {
      rowLabelNodes.push(
        text(plotX - 8, r2(plotY + (r + 0.5) * cellH + theme.fontSize / 2 - 1), rows[r], {
          key: `rowlabel/${r}`,
          anchor: 'end',
          fontSize: theme.fontSize,
          fill: theme.textColor,
          fontFamily: theme.fontFamily,
        })
      )
    }
    const colLabelNodes: GroupNode['children'] = []
    for (let c = 0; c < columns.length; c++) {
      colLabelNodes.push(
        text(r2(plotX + (c + 0.5) * cellW), axisBottom + 20, columns[c], {
          key: `collabel/${c}`,
          anchor: 'middle',
          fontSize: theme.fontSize,
          fill: theme.textColor,
          fontFamily: theme.fontFamily,
        })
      )
    }
    children.push(group({ key: 'rowlabel', children: rowLabelNodes }))
    children.push(group({ key: 'collabel', children: colLabelNodes }))

    // ============ 单元格（逐个错峰入场：自中心缩放） ============
    const gap = Math.max(0, option.cellGap ?? 2)
    const showLabel = option.label?.show ?? true
    const cellNodes: GroupNode['children'] = []
    const labelNodes: GroupNode['children'] = []
    const total = values.size
    let gi = 0
    for (let r = 0; r < rows.length; r++) {
      for (let c = 0; c < columns.length; c++) {
        const v = values.get(`${r}/${c}`)
        if (v === undefined) continue
        const color = sampleHeatColor(colorStops, (v - min) / Math.max(1e-6, max - min))
        const local = clamp01(ctx.progress * total - gi)
        gi++
        // 自中心缩放：入场期间向格子中心收缩
        const inset = ((1 - local) * Math.min(cellW, cellH)) / 2 + gap / 2
        const x = plotX + c * cellW + inset
        const y = plotY + r * cellH + inset
        const w = Math.max(1, cellW - inset * 2)
        const h = Math.max(1, cellH - inset * 2)
        cellNodes.push(
          rect(r2(x), r2(y), r2(w), r2(h), { key: `cell/${r}/${c}`, fill: color })
        )

        // 数值标签：空间充足才绘制，深色底用白字、浅色底用正文色
        if (showLabel && cellW >= 30 && cellH >= 18) {
          labelNodes.push(
            text(r2(plotX + (c + 0.5) * cellW), r2(plotY + (r + 0.5) * cellH + theme.fontSize / 2 - 1), formatNumber(v), {
              key: `celllabel/${r}/${c}`,
              anchor: 'middle',
              fontSize: theme.fontSize,
              fill: isDarkColor(color) ? '#FFFFFF' : theme.textColor,
              fontFamily: theme.fontFamily,
            })
          )
        }
      }
    }
    children.push(group({ key: 'series', children: [...cellNodes, ...labelNodes] }))

    // ============ 悬停单元格高亮描边 ============
    if (ctx.hoverIndex !== null && this.layout) {
      const hr = Math.floor(ctx.hoverIndex / columns.length)
      const hc = ctx.hoverIndex % columns.length
      if (hr < rows.length && hc < columns.length && values.has(`${hr}/${hc}`)) {
        const hx = r2(plotX + hc * cellW + gap / 2)
        const hy = r2(plotY + hr * cellH + gap / 2)
        children.push(
          rect(hx, hy, r2(cellW - gap), r2(cellH - gap), {
            key: 'hover-cell',
            fill: 'none',
            stroke: theme.colors[0],
            strokeWidth: 2,
          })
        )
      }
    }

    return group({ key: 'plot', children })
  }

  /** 网格命中：指针所在行列，且有数据的单元格才返回（索引 = 行优先全网格序号） */
  protected hitTest(x: number, y: number): number | null {
    const layout = this.layout
    if (!layout) return null
    const { pad, plotW, plotH, columns, rows, cellW, cellH, values } = layout
    if (x < pad.left || x > pad.left + plotW || y < pad.top || y > pad.top + plotH) {
      return null
    }
    const c = Math.floor((x - pad.left) / Math.max(1e-6, cellW))
    const r = Math.floor((y - pad.top) / Math.max(1e-6, cellH))
    if (c < 0 || c >= columns.length || r < 0 || r >= rows.length) return null
    return values.has(`${r}/${c}`) ? r * columns.length + c : null
  }

  protected getHoverInfo(index: number): HoverInfo {
    const layout = this.layout
    if (!layout) return { index, x: 0, y: 0 }
    const { plotX, plotY, columns, cellW, cellH } = layout
    const r = Math.floor(index / columns.length)
    const c = index % columns.length
    return {
      index,
      x: r2(plotX + (c + 0.5) * cellW),
      y: r2(plotY + (r + 0.5) * cellH),
    }
  }
}

// ============ 纯函数工具（core 与组件层共用） ============

function r2(v: number): number {
  return Math.round(v * 100) / 100
}

function clamp01(v: number): number {
  return clamp(v, 0, 1)
}

function formatNumber(v: number): string {
  if (Number.isInteger(v)) return String(v)
  return String(Number(v.toFixed(2)))
}

function parseHex(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}

/** 按值域比例 t（0 ~ 1）从多段色标中取样插值颜色（core 与组件 tooltip 共用） */
export function sampleHeatColor(stops: string[], t: number): string {
  const tt = clamp01(t)
  const segCount = stops.length - 1
  const seg = Math.min(segCount - 1, Math.floor(tt * segCount))
  const local = tt * segCount - seg
  const a = parseHex(stops[seg])
  const b = parseHex(stops[seg + 1])
  const toHex = (v: number): string => Math.round(v).toString(16).padStart(2, '0')
  return `#${toHex(a[0] + (b[0] - a[0]) * local)}${toHex(a[1] + (b[1] - a[1]) * local)}${toHex(a[2] + (b[2] - a[2]) * local)}`
}

/** 亮度判断（标签自动对比色用）：亮度 < 0.55 视为深色底 */
function isDarkColor(hex: string): boolean {
  const [r, g, b] = parseHex(hex)
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.55
}
