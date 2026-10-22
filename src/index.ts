/**
 * KCharts 库入口
 *
 * 全量引入：`import KCharts from 'kcharts'` → `app.use(KCharts)`
 * 按需引入：`import { KLineChart } from 'kcharts'`（组件级独立导出，配合 ESM tree-shaking）
 * 样式引入：`import 'kcharts/style.css'`（全量 / 按需都需要引入一次）
 */

import type { App } from 'vue'
import { withInstall } from './utils/with-install'

// ============ 组件（每个都挂载 install 方法，支持全量 / 按需两种用法） ============
import KBarChartRaw from './components/k-bar-chart'
import KBoxplotChartRaw from './components/k-boxplot-chart'
import KBulletChartRaw from './components/k-bullet-chart'
import KCalendarChartRaw from './components/k-calendar-chart'
import KCandlestickChartRaw from './components/k-candlestick-chart'
import KChordChartRaw from './components/k-chord-chart'
import KCirclePackingChartRaw from './components/k-circle-packing-chart'
import KFunnelChartRaw from './components/k-funnel-chart'
import KGaugeChartRaw from './components/k-gauge-chart'
import KGraphChartRaw from './components/k-graph-chart'
import KHeatmapChartRaw from './components/k-heatmap-chart'
import KLineChartRaw from './components/k-line-chart'
import KMapChartRaw from './components/k-map-chart'
import KMultiRingChartRaw from './components/k-multi-ring-chart'
import KParallelChartRaw from './components/k-parallel-chart'
import KPieChartRaw from './components/k-pie-chart'
import KProgressBarChartRaw from './components/k-progress-bar-chart'
import KProgressRingChartRaw from './components/k-progress-ring-chart'
import KRadarChartRaw from './components/k-radar-chart'
import KRingChartRaw from './components/k-ring-chart'
import KRoseChartRaw from './components/k-rose-chart'
import KSankeyChartRaw from './components/k-sankey-chart'
import KScatterChartRaw from './components/k-scatter-chart'
import KSunburstChartRaw from './components/k-sunburst-chart'
import KThemeRiverChartRaw from './components/k-theme-river-chart'
import KTreeChartRaw from './components/k-tree-chart'
import KTreemapChartRaw from './components/k-treemap-chart'
import KWordcloudChartRaw from './components/k-wordcloud-chart'

export const KBarChart = withInstall(KBarChartRaw)
export const KBoxplotChart = withInstall(KBoxplotChartRaw)
export const KBulletChart = withInstall(KBulletChartRaw)
export const KCalendarChart = withInstall(KCalendarChartRaw)
export const KCandlestickChart = withInstall(KCandlestickChartRaw)
export const KChordChart = withInstall(KChordChartRaw)
export const KCirclePackingChart = withInstall(KCirclePackingChartRaw)
export const KFunnelChart = withInstall(KFunnelChartRaw)
export const KGaugeChart = withInstall(KGaugeChartRaw)
export const KGraphChart = withInstall(KGraphChartRaw)
export const KHeatmapChart = withInstall(KHeatmapChartRaw)
export const KLineChart = withInstall(KLineChartRaw)
export const KMapChart = withInstall(KMapChartRaw)
export const KMultiRingChart = withInstall(KMultiRingChartRaw)
export const KParallelChart = withInstall(KParallelChartRaw)
export const KPieChart = withInstall(KPieChartRaw)
export const KProgressBarChart = withInstall(KProgressBarChartRaw)
export const KProgressRingChart = withInstall(KProgressRingChartRaw)
export const KRadarChart = withInstall(KRadarChartRaw)
export const KRingChart = withInstall(KRingChartRaw)
export const KRoseChart = withInstall(KRoseChartRaw)
export const KSankeyChart = withInstall(KSankeyChartRaw)
export const KScatterChart = withInstall(KScatterChartRaw)
export const KSunburstChart = withInstall(KSunburstChartRaw)
export const KThemeRiverChart = withInstall(KThemeRiverChartRaw)
export const KTreeChart = withInstall(KTreeChartRaw)
export const KTreemapChart = withInstall(KTreemapChartRaw)
export const KWordcloudChart = withInstall(KWordcloudChartRaw)

// ============ 全量安装插件（app.use 注册全部图表组件） ============
const components = [
  KBarChart,
  KBoxplotChart,
  KBulletChart,
  KCalendarChart,
  KCandlestickChart,
  KChordChart,
  KCirclePackingChart,
  KFunnelChart,
  KGaugeChart,
  KGraphChart,
  KHeatmapChart,
  KLineChart,
  KMapChart,
  KMultiRingChart,
  KParallelChart,
  KPieChart,
  KProgressBarChart,
  KProgressRingChart,
  KRadarChart,
  KRingChart,
  KRoseChart,
  KSankeyChart,
  KScatterChart,
  KSunburstChart,
  KThemeRiverChart,
  KTreeChart,
  KTreemapChart,
  KWordcloudChart,
]

/** 全量安装插件：`import KCharts from 'kcharts'; app.use(KCharts)` */
const KCharts = {
  install(app: App): void {
    components.forEach((c) => app.use(c))
  },
}
export default KCharts

/** withInstall 工具（自定义组件复用同一安装模式） */
export { withInstall } from './utils/with-install'
export type { WithInstall } from './utils/with-install'

// ============ 核心（进阶用法 / 自定义图表可直接复用底层设施） ============
export { BaseChart } from './core/chart/base-chart'
export { LineChart } from './core/chart/line-chart'
export { BarChart } from './core/chart/bar-chart'
export { toPath } from './core/chart/line-chart'
export type { LineChartOption, CurveMode, KValueBand } from './core/chart/line-chart'
export type { BarChartOption } from './core/chart/bar-chart'
export { BandScale, LinearScale, LogScale } from './core/scale'
export { niceTicks, clamp, clamp01 } from './core/utils/math'
export { formatCnNumber, formatThousand } from './core/utils/format'
export { sampleFunction } from './core/utils/function'
export { defaultTheme } from './core/theme'
export { getSeriesColor } from './core/theme'
export type { KChartTheme } from './core/theme'

/** 全局亮暗主题：toggleTheme 切换 html.dark + localStorage 持久化，图表实例自动联动 */
export { useTheme } from './composables/use-theme'

// ============ 类型 ============
export type {
  KLineSeries,
  KLineSymbol,
  KBarSeries,
  KAxisOption,
  KColor,
  KGradient,
  KGradientStop,
  KLinearGradient,
  KRadialGradient,
  KMarkLineDatum,
  KMarkLineGroup,
  KMarkPointDatum,
  KMarkPointGroup,
  KMarkAreaDatum,
  KMarkAreaGroup,
  KDataZoomOption,
  SeriesDatum,
  SeriesDataItem,
  StepPosition,
} from './core/types'
