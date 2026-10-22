import type { KAxisOption } from '../types'

/** 数值轴刻度结果（niceTicks 产物经轴 min/max 应用后的形态） */
export interface AxisTicksResult {
  min: number
  max: number
  ticks: number[]
}

/**
 * 应用轴固定域（对齐 ECharts axis.min / axis.max）：
 * 设置了有效数值时覆盖 niceTicks 结果，ticks 过滤到域内；
 * min >= max 等非法配置回退自适应域
 */
export function applyAxisRange(res: { min: number; max: number; ticks: number[] }, axis: KAxisOption | undefined): AxisTicksResult {
  let { min, max } = res
  if (typeof axis?.min === 'number' && Number.isFinite(axis.min)) min = axis.min
  if (typeof axis?.max === 'number' && Number.isFinite(axis.max)) max = axis.max
  if (min >= max) {
    min = res.min
    max = res.max
  }
  const ticks = res.ticks.filter((t) => t >= min && t <= max)
  return { min, max, ticks: ticks.length ? ticks : [min, max] }
}

/** inverse 轴：交换域端点（线性映射随域倒置自动翻转，刻度集合不变） */
export function inverseDomain(min: number, max: number, axis: KAxisOption | undefined): [number, number] {
  return axis?.inverse ? [max, min] : [min, max]
}

/** 数值轴网格线显隐（对齐 ECharts splitLine），缺省 true */
export function splitLineOf(axis: KAxisOption | undefined): boolean {
  return axis?.splitLine ?? true
}

/** 刻度标签文字颜色（对齐 ECharts axisLabel.color），缺省主题色 */
export function labelColorOf(axis: KAxisOption | undefined, fallback: string): string {
  return axis?.labelColor ?? fallback
}

/** 刻度标签字号（对齐 ECharts axisLabel.fontSize），缺省主题字号 */
export function labelFontSizeOf(axis: KAxisOption | undefined, fallback: number): number {
  return axis?.labelFontSize ?? fallback
}

/** 轴名锚点与对齐（对齐 ECharts nameLocation）：返回 [x 偏移参考, anchor] 由调用方结合绘图区换算 */
export function nameAnchorOf(axis: KAxisOption | undefined): 'start' | 'middle' | 'end' {
  return axis?.nameLocation ?? 'end'
}

/** 轴名文字颜色（对齐 ECharts nameTextStyle.color），缺省主题色 */
export function nameColorOf(axis: KAxisOption | undefined, fallback: string): string {
  return axis?.nameColor ?? fallback
}

/** 网格线样式（对齐 ECharts splitLine.lineStyle），缺省实线 + 主题色 */
export function splitStyleOf(axis: KAxisOption | undefined): { color?: string; dash?: number[] } {
  return axis?.splitLineStyle ?? {}
}

/**
 * 类目轴标签显示步长（对齐 ECharts axisLabel.interval）：
 * labelInterval=n 时每 n+1 个显示 1 个；未设置时用图表内置按宽度的自动抽稀步长
 */
export function labelStepOf(axis: KAxisOption | undefined, autoStep: number): number {
  const n = axis?.labelInterval
  return typeof n === 'number' && Number.isFinite(n) && n >= 0 ? Math.floor(n) + 1 : autoStep
}
