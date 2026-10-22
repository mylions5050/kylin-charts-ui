<script setup lang="ts">
import KScatterChart from '@/components/k-scatter-chart'
import type { KScatterSeries } from '@/core/types'

/** 演示数据：二维特征空间中的三簇样本（聚类分析场景） */
const SERIES: KScatterSeries[] = [
  {
    name: '簇 A',
    data: [
      [2.1, 3.2], [2.6, 2.8], [1.8, 3.6], [2.4, 4.1], [3.0, 3.4], [2.2, 2.5],
      [1.6, 2.9], [2.8, 3.8], [3.2, 2.9], [2.5, 3.1],
    ],
  },
  {
    name: '簇 B',
    color: '#F5455C',
    data: [
      [7.2, 7.8], [7.8, 8.4], [6.8, 7.2], [8.2, 7.6], [7.5, 8.8], [8.5, 8.2],
      [6.5, 8.0], [7.9, 7.4], [8.8, 8.6], [7.4, 7.0],
    ],
  },
  {
    name: '簇 C',
    color: '#7C5CFC',
    data: [
      [4.2, 8.2], [4.8, 8.8], [3.8, 7.6], [5.2, 8.4], [4.5, 9.2], [5.5, 7.9],
      [3.5, 8.6], [4.9, 7.4], [5.8, 8.9], [4.4, 8.0],
    ],
  },
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>聚类散点</span>
      <span>三簇样本分组 · 簇间色彩区分 · 特征空间分布可视化</span>
    </div>
    <div class="demo-page__block-body" style="height: 300px">
      <KScatterChart :series="SERIES" :x-axis="{ name: '特征 1' }" :y-axis="{ name: '特征 2' }" />
    </div>
  </section>
</template>
