import { BaseChart } from './base-chart'
import { clamp } from '../utils/math'
import { withAlpha } from '../utils/color'
import { defaultTheme } from '../theme'
import type { KChartTheme } from '../theme'
import { group, path, rect, text } from '../scene/nodes'
import type { GroupNode } from '../scene/nodes'
import { sampleHeatColor } from './heatmap-chart'
import type { HoverInfo, KCalendarDatum, Padding, RenderContext } from '../types'

/** 日历热力图配置 */
export interface CalendarChartOption {
  /** 数据（date 格式 'YYYY-MM-DD'） */
  data: KCalendarDatum[]
  /** 单元格边长 px，缺省 15 */
  cellSize?: number
  /** 周起始：0 = 周日（GitHub 风格）/ 1 = 周一，缺省 0 */
  weekStart?: 0 | 1
  /** 单元格间距 px，缺省 3 */
  gap?: number
  /** 色标梯度（低 → 高），缺省品牌紫渐变 */
  colorStops?: string[]
  /** 值域下限覆盖，缺省按数据自动推算 */
  min?: number
  /** 值域上限覆盖，缺省按数据自动推算 */
  max?: number
  /** 是否显示月份标签，缺省 true */
  monthLabel?: { show?: boolean }
  theme?: Partial<KChartTheme>
  padding?: Partial<Padding>
  emptyText?: string
}

const DEFAULT_PADDING: Padding = { top: 28, right: 24, bottom: 24, left: 40 }

const WEEK_LABELS_SUN = ['日', '一', '二', '三', '四', '五', '六']
const MONTH_LABELS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
const DAY_MS = 24 * 60 * 60 * 1000

/** 内部单元格模型（绘制与命中检测共用） */
interface CalendarCell {
  index: number
  date: string
  value: number
  col: number
  row: number
  x: number
  y: number
  size: number
}

/**
 * 日历热力图（Calendar Heatmap）
 * GitHub 贡献图风格：列 = 周、行 = 星期，色深映射热度值，顶部标月份。
 * 悬停索引 = 数据下标；入场按周列错峰浮现。
 */
export class CalendarChart extends BaseChart<CalendarChartOption> {
  private model: CalendarCell[] | null = null
  private monthMarks: { x: number; label: string }[] = []
  /** 网格起始 y（垂直居中后），供标签行使用 */
  private originY = DEFAULT_PADDING.top
  private cacheSig = ''

  protected build(option: CalendarChartOption, ctx: RenderContext): GroupNode {
    const theme: KChartTheme = { ...defaultTheme, ...option.theme }
    const pad: Padding = { ...DEFAULT_PADDING, ...option.padding }
    const plotW = Math.max(0, ctx.width - pad.left - pad.right)
    const plotH = Math.max(0, ctx.height - pad.top - pad.bottom)
    const model = this.getModel(option, plotW, plotH, pad)
    if (model.length === 0) {
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

    const showMonth = option.monthLabel?.show ?? true
    const hover = ctx.hoverIndex
    const children: GroupNode['children'] = []
    const cols = model[model.length - 1].col + 1

    // ---- 星期行标签（格子足够大时每行都标，过密时隔行标） ----
    const weekStart = option.weekStart ?? 0
    const pitch0 = model[0].size + (option.gap ?? 3)
    for (let i = 0; i < 7; i++) {
      if (pitch0 < 14 && i % 2 === 1) continue
      const label = WEEK_LABELS_SUN[(i + weekStart) % 7]
      const y = this.originY + i * pitch0 + model[0].size / 2 + 4
      children.push(
        text(pad.left - 8, y, label, {
          key: `weeklabel/${i}`,
          anchor: 'end',
          fontSize: theme.fontSize,
          fill: theme.textColor,
          fontFamily: theme.fontFamily,
        })
      )
    }

    // ---- 月份标签 ----
    if (showMonth) {
      this.monthMarks.forEach((m, i) => {
        children.push(
          text(m.x, Math.max(12, this.originY - 8), m.label, {
            key: `month/${i}`,
            anchor: 'start',
            fontSize: theme.fontSize,
            fill: theme.textColor,
            fontFamily: theme.fontFamily,
          })
        )
      })
    }

    // ---- 单元格（按周列错峰浮现） ----
    const cellSize = model[0].size
    model.forEach((cell) => {
      const local = clamp01(ctx.progress * (cols + 4) - cell.col)
      if (local <= 0) return
      const hovered = hover === cell.index
      children.push(
        rect(cell.x, cell.y, cellSize * local, cellSize * local, {
          key: `cell/${cell.index}`,
          radius: 3,
          fill: cellColor(option, cell.value),
          cursor: 'pointer',
          opacity: 0.3 + 0.7 * local,
          ...(hovered ? { stroke: theme.colors[0], strokeWidth: 2 } : {}),
        })
      )
    })

    // ---- 悬停描边框（放在最后保证在最上层） ----
    if (hover !== null && model[hover]) {
      const c = model[hover]
      children.push(
        path(
          `M ${c.x - 2} ${c.y - 2} h ${c.size + 4} v ${c.size + 4} h ${-(c.size + 4)} Z`,
          { key: 'hover-outline', fill: 'none', stroke: withAlpha(theme.colors[0], 0.9), strokeWidth: 1.5 }
        )
      )
    }

    return group({ key: 'plot', children: [group({ key: 'calendar', children })] })
  }

  /** 命中检测：指针所在单元格 */
  protected hitTest(x: number, y: number): number | null {
    const model = this.model
    if (!model) return null
    for (const cell of model) {
      if (x >= cell.x && x <= cell.x + cell.size && y >= cell.y && y <= cell.y + cell.size) {
        return cell.index
      }
    }
    return null
  }

  protected getHoverInfo(index: number): HoverInfo {
    const cell = this.model?.[index]
    if (!cell) return { index, x: 0, y: 0 }
    return { index, x: r2(cell.x + cell.size / 2), y: r2(cell.y + cell.size / 2) }
  }

  // ============ 布局（签名缓存） ============

  private getModel(option: CalendarChartOption, plotW: number, plotH: number, pad: Padding): CalendarCell[] {
    const sig = JSON.stringify([option.data, option.cellSize, option.weekStart, option.gap, plotW, plotH])
    if (this.model && sig === this.cacheSig) return this.model
    this.cacheSig = sig

    if (option.data.length === 0 || plotW <= 0 || plotH <= 0) {
      this.model = []
      this.monthMarks = []
      return this.model
    }

    // 解析日期（手动拆分避免时区偏移），过滤非法项后按日期排序
    const parsed = option.data
      .map((d, index) => ({ ...d, index, ts: parseDate(d.date) }))
      .filter((d) => d.ts !== null)
      .sort((a, b) => (a.ts as number) - (b.ts as number))
    if (parsed.length === 0) {
      this.model = []
      this.monthMarks = []
      return this.model
    }

    const weekStart = option.weekStart ?? 0
    const gap = option.gap ?? 3
    const firstTs = parsed[0].ts as number
    const lastTs = parsed[parsed.length - 1].ts as number
    const firstDow = new Date(firstTs).getDay() // 0 = 周日
    // 对齐到周起始行的列偏移（首日期所在列）
    const firstOffset = (firstDow - weekStart + 7) % 7

    // 自适应：未指定 cellSize 时在宽度 / 高度约束内取最优并封顶；指定时超宽则整体收缩
    const totalWeeks = Math.ceil((firstOffset + (lastTs - firstTs) / DAY_MS + 1) / 7)
    let cellSize = option.cellSize
    const maxCellW = plotW / totalWeeks - gap
    const maxCellH = plotH / 7 - gap
    if (cellSize == null) cellSize = Math.min(maxCellW, maxCellH, 20)
    if (cellSize > maxCellW) cellSize = Math.max(4, maxCellW)
    cellSize = Math.max(4, cellSize)
    const pitch = cellSize + gap
    const originX = pad.left
    // 垂直居中：网格总高不足绘图区时上下留白均分
    this.originY = pad.top + Math.max(0, (plotH - (7 * pitch - gap)) / 2)
    const originY = this.originY

    const cells: CalendarCell[] = []
    this.monthMarks = []
    let lastMonth = -1
    for (const d of parsed) {
      const dayIndex = Math.round((d.ts as number - firstTs) / DAY_MS)
      const col = Math.floor((firstOffset + dayIndex) / 7)
      const dow = new Date(d.ts as number).getDay()
      const row = (dow - weekStart + 7) % 7
      cells.push({
        index: d.index,
        date: d.date,
        value: d.value,
        col,
        row,
        x: originX + col * pitch,
        y: originY + row * pitch,
        size: cellSize,
      })
      // 月份标签：每月第一次出现的列；过密时跳过，避免文字叠压
      const month = Number(d.date.slice(5, 7)) - 1
      if (month !== lastMonth && (row === 0 || cells.length === 1)) {
        const mx = originX + col * pitch
        const last = this.monthMarks[this.monthMarks.length - 1]
        if (!last || mx - last.x >= 30) {
          this.monthMarks.push({ x: mx, label: MONTH_LABELS[month] })
          lastMonth = month
        }
      }
    }

    this.model = cells
    return this.model
  }
}

// ============ 纯函数工具 ============

/** 取值域归一化后的热力色（复用热力图取色器） */
function cellColor(option: CalendarChartOption, value: number): string {
  const stops = option.colorStops ?? ['#EBEDF5', '#B9A5FF', '#7C5CFC', '#4B2FD6']
  let min = option.min
  let max = option.max
  if (min == null || max == null) {
    let vmin = Infinity
    let vmax = -Infinity
    for (const d of option.data) {
      vmin = Math.min(vmin, d.value)
      vmax = Math.max(vmax, d.value)
    }
    if (min == null) min = vmin
    if (max == null) max = vmax
  }
  const t = max > min ? clamp((value - min) / (max - min), 0, 1) : 0.5
  return sampleHeatColor(stops, t)
}

/** 'YYYY-MM-DD' → 本地时区时间戳（非法返回 null） */
function parseDate(date: string): number | null {
  const m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(date)
  if (!m) return null
  const ts = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])).getTime()
  return Number.isFinite(ts) ? ts : null
}

function r2(v: number): number {
  return Math.round(v * 100) / 100
}

function clamp01(v: number): number {
  return clamp(v, 0, 1)
}
