<script setup lang="ts">
import KLineChart from '@/components/k-line-chart'
import type { KLineSeries } from '@/core/types'

/**
 * 标注扩展（对齐 ECharts 常用配置）：
 * markPoint 最大/最小值标注、markArea 区间标域、
 * labelInterval 类目稀疏、splitLineStyle 网格样式、nameColor 轴名颜色
 */
const SERIES_A: KLineSeries[] = [
  {
    name: '销售额',
    data: [120, 210, 160, 300, 250, 380, 200, 170, 260, 310],
    markPoint: [{ type: 'max' }, { type: 'min' }],
    markArea: [{ xAxis: '周三', xAxis2: '周四', label: '促销期' }],
  },
]

/** 系列 color 覆盖 + labelInterval 显式稀疏 */
const SERIES_B: KLineSeries[] = [
  { name: '自定义色', color: '#F7BA1E', data: [90, 110, 85, 130, 120, 150, 100, 95, 140, 125] },
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>标注点 / 标域 / 网格样式</span>
      <span>markPoint 最大最小值水滴标注 · markArea 类目带区间 · splitLineStyle 网格虚线与颜色 · nameColor 轴名颜色</span>
    </div>
    <div class="demo-page__block-body" style="height: 320px">
      <KLineChart
        :labels="['周一', '周二', '周三', '周四', '周五', '周六', '周日', '次一', '次二', '次三']"
        :series="SERIES_A"
        :y-axis="{ name: '万元', nameColor: '#86909C', splitLineStyle: { color: '#C9CDD4', dash: [6, 4] } }"
      />
    </div>
  </section>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>系列颜色 / 类目稀疏 / 图例位置</span>
      <span>series.color 系列级换色 · labelInterval 每 3 个显示 1 个 · legend position bottom · valueFormatter tooltip 格式化</span>
    </div>
    <div class="demo-page__block-body" style="height: 320px">
      <KLineChart
        :labels="['周一', '周二', '周三', '周四', '周五', '周六', '周日', '次一', '次二', '次三']"
        :series="SERIES_B"
        :x-axis="{ labelInterval: 2 }"
        :legend="{ position: 'bottom' }"
        :value-formatter="(v: number) => `¥${v} 万`"
      />
    </div>
  </section>
</template>
