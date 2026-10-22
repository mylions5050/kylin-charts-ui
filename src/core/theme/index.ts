/**
 * KCharts 默认主题
 *
 * 与 src/styles/tokens.scss 中的 SCSS Token 保持同一套色值。
 * 后续支持 theme 对象整体替换以实现暗色模式 / 换肤。
 */

export interface KChartTheme {
  /** 系列色板（按系列顺序循环取用） */
  colors: string[]
  /** 轴标签文字色 */
  textColor: string
  /** 轴线颜色 */
  axisLineColor: string
  /** 网格线颜色 */
  gridColor: string
  /** 空状态文字色 */
  emptyColor: string
  /** 字体 */
  fontFamily: string
  /** 基础字号 */
  fontSize: number
}

export const defaultTheme: KChartTheme = {
  colors: [
    '#7C5CFC', // 紫色（主色）
    '#2B6FFF', // 蓝
    '#00C48C', // 翠绿
    '#FFB020', // 琥珀
    '#F5455C', // 红
    '#00B8D9', // 青
    '#FF7D4D', // 橙
    '#B24BF3', // 亮紫红
    '#A0D911', // 黄绿
    '#F759AB', // 玫粉
  ],
  // 轴体系色值对齐 ECharts 5 默认值（实测基础折线图）
  textColor: '#6E7079',
  axisLineColor: '#6E7079',
  gridColor: '#E0E6F1',
  emptyColor: '#C9CDD4',
  fontFamily:
    "'PingFang SC', 'Helvetica Neue', 'Microsoft YaHei', sans-serif",
  fontSize: 12,
}

/** 取系列颜色：优先用系列自带色，否则按索引从色板循环取 */
export function getSeriesColor(
  colors: string[],
  index: number,
  color?: string
): string {
  return color ?? colors[index % colors.length]
}

/**
 * 暗色主题
 *
 * 系列色板与亮色共用（在深色背景上依然成立），
 * 仅切换轴体系 / 文本 / 网格等中性色；
 * 组件层通过 useTheme() 的 chartTheme 透传给核心层。
 */
export const darkTheme: KChartTheme = {
  colors: defaultTheme.colors,
  // 中性色对齐 ECharts 5 暗色系实测值
  textColor: '#A9AEB8',
  axisLineColor: '#4E5969',
  gridColor: '#2E3240',
  emptyColor: '#4E5969',
  fontFamily: defaultTheme.fontFamily,
  fontSize: defaultTheme.fontSize,
}
