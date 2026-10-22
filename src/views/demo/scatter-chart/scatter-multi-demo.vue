<script setup lang="ts">
import KScatterChart from '@/components/k-scatter-chart'
import type { KScatterSeries } from '@/core/types'

/** 演示数据：三款产品价格（元）与月销量（千件）的多系列对比散点 */
const SERIES: KScatterSeries[] = [
  {
    name: '产品 A',
    data: [
      [49, 8.2], [59, 7.1], [69, 6.4], [79, 5.5], [99, 4.6], [129, 3.2], [149, 2.8],
      [55, 7.8], [89, 5.0], [119, 3.6], [65, 6.1], [139, 3.0],
    ],
  },
  {
    name: '产品 B',
    color: '#F5455C',
    data: [
      [39, 6.5], [49, 5.8], [69, 4.9], [89, 4.2], [109, 3.5], [139, 2.4], [159, 2.0],
      [45, 6.0], [99, 3.8], [79, 4.5], [129, 2.7],
    ],
  },
  {
    name: '产品 C',
    color: '#7C5CFC',
    data: [
      [199, 1.2], [249, 1.0], [299, 0.8], [349, 0.6], [399, 0.5], [459, 0.4],
      [229, 1.1], [319, 0.7], [269, 0.9],
    ],
  },
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>多系列对比散点</span>
      <span>三系列 · 图例点击切换显隐 · 自定义系列颜色</span>
    </div>
    <div class="demo-page__block-body" style="height: 320px">
      <KScatterChart :series="SERIES" legend :x-axis="{ name: '定价（元）' }" :y-axis="{ name: '月销量（千件）' }" />
    </div>
  </section>
</template>
