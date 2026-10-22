<script setup lang="ts">
import KScatterChart from '@/components/k-scatter-chart'
import type { KScatterSeries } from '@/core/types'

/** 演示数据：人均 GDP（千美元）与幸福指数，第三维 size = 人口规模（映射点半径） */
const SERIES: KScatterSeries[] = [
  {
    name: '国家 / 地区',
    radius: 6,
    data: [
      [8, 5.6, 5], [15, 6.2, 7], [22, 6.8, 6], [30, 7.1, 9], [38, 7.4, 5],
      [45, 7.6, 4], [52, 7.8, 6], [60, 7.9, 5], [68, 8.0, 3], [80, 8.2, 4],
      [12, 4.8, 12], [25, 5.9, 14], [40, 6.5, 10], [55, 7.2, 8], [70, 7.7, 6],
      [5, 4.2, 9], [18, 5.4, 11], [33, 6.6, 7], [48, 7.3, 5], [90, 8.4, 3],
    ],
  },
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>气泡图</span>
      <span>数据项第三维 size 映射点半径 · 悬停 Tooltip 展示 x / y / size</span>
    </div>
    <div class="demo-page__block-body" style="height: 320px">
      <KScatterChart :series="SERIES" :x-axis="{ name: '人均 GDP（千美元）' }" :y-axis="{ name: '幸福指数' }" />
    </div>
  </section>
</template>
