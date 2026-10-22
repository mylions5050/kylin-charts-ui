import type { Component } from 'vue'

/** 图表元信息（slug 同时是 demo 目录名与路由参数） */
export interface ChartMeta {
  slug: string
  title: string
}

/** 首页分区 / 左侧菜单分组 */
export interface ChartGroup {
  label: string
  charts: ChartMeta[]
}

export const CHART_GROUPS: ChartGroup[] = [
  {
    label: '趋势与比较',
    charts: [
      { slug: 'line-chart', title: '折线图' },
      { slug: 'bar-chart', title: '柱形图' },
      { slug: 'radar-chart', title: '雷达图' },
      { slug: 'candlestick-chart', title: 'K线图' },
      { slug: 'parallel-chart', title: '平行坐标' },
      { slug: 'theme-river-chart', title: '主题河流' },
    ],
  },
  {
    label: '占比构成',
    charts: [
      { slug: 'pie-chart', title: '饼图' },
      { slug: 'ring-chart', title: '环形图' },
      { slug: 'rose-chart', title: '玫瑰图' },
      { slug: 'sunburst-chart', title: '旭日图' },
      { slug: 'tree-chart', title: '树图' },
      { slug: 'treemap-chart', title: '矩阵树图' },
      { slug: 'circle-packing-chart', title: '打包图' },
      { slug: 'funnel-chart', title: '漏斗图' },
    ],
  },
  {
    label: '关系网络',
    charts: [
      { slug: 'sankey-chart', title: '桑基图' },
      { slug: 'chord-chart', title: '和弦图' },
      { slug: 'graph-chart', title: '关系图' },
    ],
  },
  {
    label: '分布与密度',
    charts: [
      { slug: 'scatter-chart', title: '散点图' },
      { slug: 'heatmap-chart', title: '热力图' },
      { slug: 'boxplot-chart', title: '盒须图' },
      { slug: 'map-chart', title: '地图' },
    ],
  },
  {
    label: '状态指标',
    charts: [
      { slug: 'gauge-chart', title: '仪表盘' },
      { slug: 'bullet-chart', title: '子弹图' },
      { slug: 'progress-ring-chart', title: '进度环' },
      { slug: 'progress-bar-chart', title: '进度条' },
      { slug: 'multi-ring-chart', title: '多层环' },
    ],
  },
  {
    label: '文字与时间',
    charts: [
      { slug: 'wordcloud-chart', title: '词云' },
      { slug: 'calendar-chart', title: '日历图' },
    ],
  },
]

export const ALL_CHARTS: ChartMeta[] = CHART_GROUPS.flatMap((g) => g.charts)

export function findChart(slug: string): ChartMeta | undefined {
  return ALL_CHARTS.find((c) => c.slug === slug)
}

/** 单个测试用例元信息：标题/描述从 demo 源码头部解析，源码用于代码展示 */
export interface DemoMeta {
  key: string
  title: string
  desc: string
  component: Component
  source: string
}

// 自动收集全部 demo 组件与源码：新增 demo 文件即自动进入站点，无需手工登记
const demoComponents = import.meta.glob<Component>('../views/demo/*/*.vue', {
  eager: true,
  import: 'default',
})
const demoSources = import.meta.glob<string>('../views/demo/*/*.vue', {
  eager: true,
  query: '?raw',
  import: 'default',
})

// demo 内部块头：<span>标题</span><span>描述</span>
const HEADER_RE = /demo-page__block-header[\s\S]*?<span>([^<]*)<\/span>\s*<span>([^<]*)<\/span>/

const demoCache = new Map<string, DemoMeta[]>()

/** 收集某图表目录下全部用例（basic 排最前），结果按目录缓存 */
export function getDemos(slug: string): DemoMeta[] {
  const cached = demoCache.get(slug)
  if (cached) return cached

  const prefix = `../views/demo/${slug}/`
  const list: DemoMeta[] = []
  for (const [key, component] of Object.entries(demoComponents)) {
    if (!key.startsWith(prefix) || !component) continue
    const source = demoSources[key] ?? ''
    const file = key.slice(prefix.length, -'.vue'.length)
    const m = source.match(HEADER_RE)
    list.push({
      key: file,
      title: m ? m[1].trim() : file,
      desc: m ? m[2].trim() : '',
      component,
      source,
    })
  }
  list.sort((a, b) => {
    const pa = a.key.includes('-basic') ? 0 : 1
    const pb = b.key.includes('-basic') ? 0 : 1
    return pa !== pb ? pa - pb : a.key.localeCompare(b.key)
  })
  demoCache.set(slug, list)
  return list
}
