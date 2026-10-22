<script setup lang="ts">
import KBarChart from '@/components/k-bar-chart'
import type { KBarSeries } from '@/core/types'

/** 演示数据：一周销量，均值线 / 阈值线 / 类目标线 */
const LABELS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

const SERIES: KBarSeries[] = [
  {
    name: '销量',
    data: [120, 200, 150, 80, 270, 310, 240],
    markLine: { data: [{ type: 'average' }, { xAxis: '周四', label: '促销日' }] },
  },
  {
    name: '退货量',
    data: [20, 32, 18, 25, 40, 55, 38],
    markLine: { data: [{ yAxis: 50, label: '警戒线 50', color: '#F5455C' }] },
  },
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>markLine 标线</span>
      <span>均值线（全量数据计算）/ 数值阈值线 / 类目垂直标线，文案贴线端部</span>
    </div>
    <div class="demo-page__block-body" style="height: 320px">
      <KBarChart :labels="LABELS" :series="SERIES" legend />
    </div>
  </section>
</template>
