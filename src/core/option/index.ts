import type { LineChartOption } from '../chart/line-chart'
import type { MapChartOption } from '../chart/map-chart'

/**
 * 图表类型 → Option 类型映射表
 *
 * 每实现一种图表，在这里注册一行。KChartOption<'line'> 即可拿到
 * 该图表的专属强类型 Option，字段级提示与编译期校验全靠这张表。
 */
export interface OptionMap {
  line: LineChartOption
  map: MapChartOption
  // bar: BarChartOption      // 柱形图实现后注册
  // pie: PieChartOption      // 饼图实现后注册
}

/** 已实现的图表类型（随 OptionMap 增长） */
export type ImplementedChartType = keyof OptionMap

/** 按图表类型参数化的强类型 Option */
export type KChartOption<T extends ImplementedChartType> = OptionMap[T]
