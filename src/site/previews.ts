import { h } from 'vue'
import type { FunctionalComponent } from 'vue'
import KBarChart from '@/components/k-bar-chart.tsx'
import KBulletChart from '@/components/k-bullet-chart.tsx'
import KBoxplotChart from '@/components/k-boxplot-chart.tsx'
import KCalendarChart from '@/components/k-calendar-chart.tsx'
import KCandlestickChart from '@/components/k-candlestick-chart.tsx'
import KChordChart from '@/components/k-chord-chart.tsx'
import KCirclePackingChart from '@/components/k-circle-packing-chart.tsx'
import KFunnelChart from '@/components/k-funnel-chart.tsx'
import KGaugeChart from '@/components/k-gauge-chart.tsx'
import KGraphChart from '@/components/k-graph-chart.tsx'
import KHeatmapChart from '@/components/k-heatmap-chart.tsx'
import KLineChart from '@/components/k-line-chart.tsx'
import KMapChart from '@/components/k-map-chart.tsx'
import KMultiRingChart from '@/components/k-multi-ring-chart.tsx'
import KParallelChart from '@/components/k-parallel-chart.tsx'
import KPieChart from '@/components/k-pie-chart.tsx'
import KProgressBarChart from '@/components/k-progress-bar-chart.tsx'
import KProgressRingChart from '@/components/k-progress-ring-chart.tsx'
import KRadarChart from '@/components/k-radar-chart.tsx'
import KRingChart from '@/components/k-ring-chart.tsx'
import KRoseChart from '@/components/k-rose-chart.tsx'
import KSankeyChart from '@/components/k-sankey-chart.tsx'
import KScatterChart from '@/components/k-scatter-chart.tsx'
import KSunburstChart from '@/components/k-sunburst-chart.tsx'
import KThemeRiverChart from '@/components/k-theme-river-chart.tsx'
import KTreeChart from '@/components/k-tree-chart.tsx'
import KTreemapChart from '@/components/k-treemap-chart.tsx'
import KWordcloudChart from '@/components/k-wordcloud-chart.tsx'
import chinaGeoJson from '../views/demo/map-chart/data/china.json'
import type { GeoFeatureCollection } from '@/core/utils/geo'

/** 首页卡片迷你预览统一高度 */
const H = 230

/**
 * 首页 Card 真实迷你图表：slug → 函数式组件。
 * 每类只配 3~5 个数据点的极简数据，关闭外置标签避免窄卡片挤压。
 */
export const MINI_PREVIEWS: Record<string, FunctionalComponent> = {
  'line-chart': () =>
    h(KLineChart, {
      labels: ['一月', '二月', '三月', '四月'],
      series: [{ name: '销售额', data: [120, 200, 150, 180] }],
      height: H,
    }),
  'bar-chart': () =>
    h(KBarChart, {
      labels: ['Q1', 'Q2', 'Q3'],
      series: [{ name: '销量', data: [86, 120, 95] }],
      height: H,
    }),
  'radar-chart': () =>
    h(KRadarChart, {
      indicators: [
        { name: '销售', max: 100 },
        { name: '服务', max: 100 },
        { name: '质量', max: 100 },
        { name: '物流', max: 100 },
      ],
      series: [{ name: '门店A', data: [80, 70, 90, 60] }],
      height: H,
    }),
  'candlestick-chart': () =>
    h(KCandlestickChart, {
      labels: ['01-01', '01-02', '01-03', '01-04'],
      data: [
        [20, 24, 18, 26],
        [24, 22, 20, 25],
        [22, 28, 21, 30],
        [28, 26, 24, 29],
      ],
      ma: [],
      height: H,
    }),
  'parallel-chart': () =>
    h(KParallelChart, {
      dimensions: [{ name: '价格' }, { name: '销量' }, { name: '评分' }],
      data: [
        { name: '商品A', values: [50, 200, 4.5] },
        { name: '商品B', values: [80, 120, 4.0] },
        { name: '商品C', values: [65, 160, 4.8] },
      ],
      height: H,
    }),
  'theme-river-chart': () =>
    h(KThemeRiverChart, {
      labels: ['周一', '周二', '周三', '周四'],
      series: [
        { name: '新闻', data: [10, 20, 15, 25] },
        { name: '视频', data: [30, 25, 40, 35] },
      ],
      height: H,
    }),
  'pie-chart': () =>
    h(KPieChart, {
      data: [
        { name: '邮件', value: 120 },
        { name: '短信', value: 80 },
        { name: '推送', value: 150 },
      ],
      label: false,
      height: H,
    }),
  'ring-chart': () =>
    h(KRingChart, {
      data: [
        { name: '直接访问', value: 400 },
        { name: '邮件', value: 200 },
        { name: '广告', value: 150 },
      ],
      label: false,
      height: H,
    }),
  'rose-chart': () =>
    h(KRoseChart, {
      data: [
        { name: '玫瑰A', value: 60 },
        { name: '玫瑰B', value: 40 },
        { name: '玫瑰C', value: 20 },
        { name: '玫瑰D', value: 80 },
      ],
      label: false,
      height: H,
    }),
  'sunburst-chart': () =>
    h(KSunburstChart, {
      data: [
        { name: '研发', children: [{ name: '前端', value: 30 }, { name: '后端', value: 20 }] },
        { name: '设计', children: [{ name: 'UI', value: 15 }] },
        { name: '运营', value: 10 },
      ],
      label: false,
      height: H,
    }),
  'tree-chart': () =>
    h(KTreeChart, {
      // 纵向：横向布局左右各预留 140px 标签区，窄卡片下绘图区会被压没
      orient: 'vertical',
      data: [
        {
          name: '根节点',
          children: [
            { name: '分支A', value: 30 },
            { name: '分支B', children: [{ name: '叶子B1', value: 20 }] },
          ],
        },
      ],
      height: H,
    }),
  'treemap-chart': () =>
    h(KTreemapChart, {
      data: [
        { name: '华南', children: [{ name: '广东', value: 80 }, { name: '福建', value: 40 }] },
        { name: '华北', children: [{ name: '北京', value: 60 }] },
      ],
      height: H,
    }),
  'circle-packing-chart': () =>
    h(KCirclePackingChart, {
      data: [
        { name: 'A', children: [{ name: 'A1', value: 30 }, { name: 'A2', value: 20 }] },
        { name: 'B', children: [{ name: 'B1', value: 40 }] },
      ],
      height: H,
    }),
  'funnel-chart': () =>
    h(KFunnelChart, {
      data: [
        { name: '访问', value: 1000 },
        { name: '加购', value: 600 },
        { name: '下单', value: 300 },
      ],
      height: H,
    }),
  'sankey-chart': () =>
    h(KSankeyChart, {
      nodes: [{ name: '来源' }, { name: '加购' }, { name: '下单' }],
      links: [
        { source: '来源', target: '加购', value: 300 },
        { source: '加购', target: '下单', value: 150 },
      ],
      height: H,
    }),
  'chord-chart': () =>
    h(KChordChart, {
      nodes: [{ name: 'A' }, { name: 'B' }, { name: 'C' }],
      links: [
        { source: 'A', target: 'B', value: 30 },
        { source: 'B', target: 'C', value: 20 },
      ],
      height: H,
    }),
  'graph-chart': () =>
    h(KGraphChart, {
      layout: 'circular',
      nodes: [
        { name: 'A', value: 30 },
        { name: 'B', value: 20 },
        { name: 'C', value: 10 },
        { name: 'D', value: 15 },
      ],
      links: [
        { source: 'A', target: 'B', value: 3 },
        { source: 'B', target: 'C', value: 1 },
        { source: 'A', target: 'D', value: 2 },
      ],
      height: H,
    }),
  'scatter-chart': () =>
    h(KScatterChart, {
      series: [
        { name: '组A', data: [[10, 8], [20, 15], [30, 22]] },
        { name: '组B', data: [[15, 5], [25, 18], [35, 12]] },
      ],
      height: H,
    }),
  'heatmap-chart': () =>
    h(KHeatmapChart, {
      rows: ['周一', '周二'],
      columns: ['上午', '下午', '晚上'],
      data: [[0, 0, 30], [1, 0, 50], [2, 0, 10], [0, 1, 60], [1, 1, 40], [2, 1, 20]],
      height: H,
    }),
  'boxplot-chart': () =>
    h(KBoxplotChart, {
      labels: ['组A', '组B'],
      series: [{ name: '样本', data: [[10, 30, 50, 70, 90], [5, 20, 40, 65, 85]] }],
      height: H,
    }),
  'gauge-chart': () =>
    h(KGaugeChart, {
      data: { name: '完成率', value: 76, unit: '%' },
      height: H,
    }),
  'bullet-chart': () =>
    h(KBulletChart, {
      data: [
        { name: '营收', value: 78, target: 90, ranges: [50, 85, 100] },
        { name: '利润', value: 55, target: 70, ranges: [40, 70, 100] },
      ],
      height: H,
    }),
  'progress-ring-chart': () =>
    h(KProgressRingChart, {
      data: { name: '完成', value: 68, unit: '%' },
      height: H,
    }),
  'progress-bar-chart': () =>
    h(KProgressBarChart, {
      data: [
        { name: '渠道A', value: 76 },
        { name: '渠道B', value: 45 },
      ],
      height: H,
    }),
  'multi-ring-chart': () =>
    h(KMultiRingChart, {
      data: [{ name: 'A', value: 80 }, { name: 'B', value: 60 }, { name: 'C', value: 40 }],
      height: H,
    }),
  'wordcloud-chart': () =>
    h(KWordcloudChart, {
      data: [
        { name: '图表', value: 100 },
        { name: '数据', value: 80 },
        { name: '可视化', value: 60 },
        { name: 'SVG', value: 50 },
        { name: '渲染', value: 40 },
      ],
      height: H,
    }),
  'calendar-chart': () =>
    h(KCalendarChart, {
      data: [
        { date: '2024-01-01', value: 30 },
        { date: '2024-01-05', value: 60 },
        { date: '2024-01-09', value: 90 },
        { date: '2024-01-15', value: 45 },
        { date: '2024-01-20', value: 70 },
        { date: '2024-01-26', value: 25 },
      ],
      height: H,
    }),
  'map-chart': () =>
    h(KMapChart, {
      geoJson: chinaGeoJson as GeoFeatureCollection,
      data: [
        { name: '广东省', value: 95 },
        { name: '四川省', value: 70 },
        { name: '浙江省', value: 60 },
        { name: '山东省', value: 45 },
        { name: '新疆维吾尔自治区', value: 30 },
        { name: '黑龙江省', value: 20 },
      ],
      height: H,
    }),
}
