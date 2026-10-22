<script setup lang="ts">
import KLineChart from '@/components/k-line-chart'
import type { KLineSeries } from '@/core/types'

/** 演示数据：对齐 ECharts line-stack 示例（Stacked Line），同 stack 组按系列顺序累加 */
const LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const SERIES: KLineSeries[] = [
  { name: 'Email', data: [120, 132, 101, 134, 90, 230, 210], stack: 'total' },
  { name: 'Union Ads', data: [220, 182, 191, 234, 290, 330, 310], stack: 'total' },
  { name: 'Video Ads', data: [150, 232, 201, 154, 190, 330, 410], stack: 'total' },
  { name: 'Direct', data: [320, 332, 301, 334, 390, 330, 320], stack: 'total' },
  { name: 'Search Engine', data: [820, 932, 901, 934, 1290, 1330, 1320], stack: 'total' },
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>堆叠折线图</span>
      <span>系列 stack 同组累加 · 参考 ECharts line-stack 示例</span>
    </div>
    <div class="demo-page__block-body">
      <KLineChart :labels="LABELS" :series="SERIES" legend :height="300" />
    </div>
  </section>
</template>
