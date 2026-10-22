<script setup lang="ts">
import KBarChart from '@/components/k-bar-chart'
import type { KBarSeries } from '@/core/types'

/**
 * 标注扩展（对齐 ECharts 常用配置）：
 * markPoint 最大/最小值标注、markArea 数值带标域、
 * splitLineStyle 网格样式、系列 color 覆盖、legend 位置
 */
const SERIES_A: KBarSeries[] = [
  {
    name: '销量',
    data: [320, 410, 380, 260, 290],
    markPoint: [{ type: 'max' }, { type: 'min' }],
    markArea: [{ yAxis: 150, yAxis2: 300, label: '目标区间' }],
  },
]

const SERIES_B: KBarSeries[] = [
  { name: '自定义色', color: '#F53F3F', data: [180, 240, 210, 150, 190] },
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>标注点 / 数值标域</span>
      <span>markPoint 最大最小值水滴标注 · markArea yAxis~yAxis2 数值带（目标区间）· splitLineStyle 网格虚线</span>
    </div>
    <div class="demo-page__block-body" style="height: 320px">
      <KBarChart
        :labels="['华东', '华南', '华北', '西南', '东北']"
        :series="SERIES_A"
        :y-axis="{ splitLineStyle: { color: '#C9CDD4', dash: [6, 4] } }"
      />
    </div>
  </section>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>系列颜色 / 图例位置</span>
      <span>series.color 系列级换色 · legend position bottom</span>
    </div>
    <div class="demo-page__block-body" style="height: 320px">
      <KBarChart
        :labels="['华东', '华南', '华北', '西南', '东北']"
        :series="SERIES_B"
        :legend="{ position: 'bottom' }"
      />
    </div>
  </section>
</template>
