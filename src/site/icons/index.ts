import { h } from 'vue'
import type { FunctionalComponent } from 'vue'

/**
 * 站点侧边栏图表类型小图标
 *
 * 通用图标库（lucide / tabler 等）缺少旭日、和弦、主题河流、打包图等
 * 图表专属造型，且引入依赖与项目轻量定位冲突，故手绘 24×24 stroke 风格
 * SVG 并统一汇总于此：stroke 使用 currentColor，自动继承菜单项文字颜色
 * （含悬停 / 激活态主色）。key 与 registry 的 chart slug 一一对应。
 */
const ICONS: Record<string, string> = {
  // 图表总览（宫格）
  overview: '<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/>',
  home: '<path d="M4 11 12 4l8 7"/><path d="M6 10v10h12V10"/><path d="M10 20v-5h4v5"/>',
  // 趋势与比较
  'line-chart': '<path d="M3 17 8.5 10.5 13.5 14 21 6"/>',
  'bar-chart': '<path d="M5 20V10M12 20V4M19 20V13"/>',
  'radar-chart': '<path d="M12 3 20 8.5 17 18H7L4 8.5Z"/><path d="M12 12V3M12 12l8-3.5M12 12l5 6M12 12l-5 6M12 12 4 8.5"/>',
  'candlestick-chart': '<path d="M7 4v4M7 16v4M5 8h4v8H5zM17 3v4M17 13v5M15 7h4v6h-4z"/>',
  'parallel-chart': '<path d="M5 4v16M12 4v16M19 4v16"/><path d="M5 8l7 6 7-7M5 16l7-6 7 5"/>',
  'theme-river-chart': '<path d="M3 8c5-3 13 3 18-1M3 13c5-3 13 3 18-1M3 18c5-3 13 3 18-1"/>',
  // 占比构成
  'pie-chart': '<path d="M12 4a8 8 0 1 0 8 8"/><path d="M12 12V4M12 12h8"/>',
  'ring-chart': '<path d="M16.9 6.3A8 8 0 1 0 20 12"/><path d="M14.7 9.3a4 4 0 1 0 1.3 2.7"/>',
  'rose-chart': '<path d="M12 12V4a8 8 0 0 1 5 1.8Z"/><path d="M12 12 6.2 5.4A5.2 5.2 0 0 1 12 12"/><path d="M12 12H4.5"/>',
  'sunburst-chart': '<path d="M20 12A8 8 0 1 0 4 12"/><path d="M7.5 12A4.5 4.5 0 0 1 12 7.5"/><path d="M12 12V4M12 12h8"/>',
  'tree-chart': '<path d="M12 4v6M12 10H5v7M12 10h7v7M12 10v7"/><path d="M10.5 4h3"/>',
  'treemap-chart': '<path d="M4 4h16v16H4z"/><path d="M12 4v9M12 13h8M4 14h5M9 13v7"/>',
  'circle-packing-chart': '<path d="M4 12a8 8 0 1 0 16 0 8 8 0 1 0-16 0"/><path d="M7.5 9.5a3 3 0 1 0 6 0 3 3 0 1 0-6 0"/><path d="M10.5 15a3 3 0 1 0 6 0 3 3 0 1 0-6 0"/>',
  // 关系网络
  'funnel-chart': '<path d="M5 5h14l-3.5 5.5h-7Z"/><path d="M8.5 10.5h7L13 15.5h-2Z"/><path d="M11 15.5h2l-1 4Z"/>',
  'sankey-chart': '<path d="M4 6c8 0 8 3 16 3M4 12c8 0 8 .5 16 1M4 18c8 0 8-1.5 16-1"/>',
  'graph-chart': '<path d="M6.5 6.5 17 9M17.5 6.5 7 17M17 6.5V17"/><circle cx="6.5" cy="6.5" r="2"/><circle cx="17.5" cy="6.5" r="2"/><circle cx="17" cy="17" r="2"/><circle cx="7" cy="17" r="2"/>',
  'chord-chart': '<path d="M20 12a8 8 0 1 0-8 8"/><path d="M8 6c6 4 6 8 0 12M16 6c-6 4-6 8 0 12"/>',
  // 分布与密度
  'scatter-chart': '<path d="M6 17h.01M10 10h.01M13 14h.01M16 7h.01M19 12h.01M8 6h.01M18 18h.01"/>',
  'heatmap-chart': '<rect x="4" y="4" width="5" height="5" rx="1"/><rect x="15" y="4" width="5" height="5" rx="1"/><rect x="9.5" y="10" width="5" height="5" rx="1"/><rect x="4" y="15" width="5" height="5" rx="1"/><rect x="15" y="15" width="5" height="5" rx="1"/>',
  'boxplot-chart': '<path d="M6 4v4M6 16v4M4.5 8h3v8h-3zM4.5 11h3M15 3v3M15 13v5M13.5 6h3v7h-3zM13.5 9h3"/>',
  'map-chart': '<path d="M9 4 3.5 6v14L9 18l6 2 5.5-2V4L15 6 9 4Z"/><path d="M9 4v14M15 6v14"/>',
  'calendar-chart': '<path d="M4 6h16v14H4zM4 10h16M8 3v5M16 3v5"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 17h.01M12 17h.01M16 17h.01"/>',
  // 状态指标
  'gauge-chart': '<path d="M4 18a8 8 0 1 1 16 0"/><path d="M12 18l4.5-6.5"/><path d="M12 18h.01"/>',
  'bullet-chart': '<path d="M3 9h18v6H3z"/><path d="M3 12h11M17 7v10"/>',
  'progress-ring-chart': '<path d="M4 12a8 8 0 1 0 16 0 8 8 0 1 0-16 0"/><path d="M12 4a8 8 0 0 1 8 8"/>',
  'progress-bar-chart': '<path d="M3 8h18v8H3z"/><path d="M5.5 12h8"/>',
  'multi-ring-chart': '<path d="M20 12a8 8 0 1 0-8 8"/><path d="M16.5 12a4.5 4.5 0 1 0-4.5 4.5"/>',
  'wordcloud-chart': '<path d="M4 6h11M17 6h3M4 10h5M11 10h9M4 14h12M18 14h2M4 18h7M13 18h6"/>',
  // 通用动作
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
}

export interface ChartIconProps {
  /** 图标名：图表 slug 或 overview */
  name: string
}

/** 站点图表小图标（24×24 stroke，currentColor 着色，尺寸由外层 CSS 控制） */
export const ChartIcon: FunctionalComponent<ChartIconProps> = (props) =>
  h('svg', {
    viewBox: '0 0 24 24',
    class: 'chart-icon',
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': 1.7,
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
    'aria-hidden': 'true',
    innerHTML: ICONS[props.name] ?? '',
  })

ChartIcon.props = { name: { type: String, required: true } }
