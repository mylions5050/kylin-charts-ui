<script setup lang="ts">
import KScatterChart from '@/components/k-scatter-chart'
import type { KScatterSeries } from '@/core/types'

/** 演示数据：广告投入（万元）与销售额（万元）的单系列相关性散点 */
const SERIES: KScatterSeries[] = [
  {
    name: '销售额',
    radius: 5,
    data: [
      [12, 96], [18, 132], [25, 168], [30, 205], [36, 228],
      [42, 265], [48, 282], [55, 318], [60, 342], [68, 372],
      [75, 401], [82, 428], [15, 118], [33, 215], [51, 296],
      [64, 355], [71, 388], [88, 447], [95, 462], [100, 486],
    ],
  },
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>基础散点图</span>
      <span>单系列 · 双数值轴 · 正相关分布 · 悬停最近点 + 十字参考线</span>
    </div>
    <div class="demo-page__block-body" style="height: 320px">
      <KScatterChart
        :series="SERIES"
        :x-axis="{ name: '广告投入（万元）' }"
        :y-axis="{ name: '销售额（万元）' }"
      />
    </div>
  </section>
</template>
