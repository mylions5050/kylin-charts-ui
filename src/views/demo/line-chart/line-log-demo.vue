<script setup lang="ts">
import KLineChart from '@/components/k-line-chart'
import type { KLineSeries } from '@/core/types'

/** 演示数据：跨 4 个数量级的病毒传播量，对数轴下均匀展开 */
const LABELS = ['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7']
const SERIES: KLineSeries[] = [
  { name: '传播量', data: [3, 12, 45, 260, 1800, 9500, 42000], color: '#F5455C' },
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>对数轴</span>
      <span>yAxis type='log'（以 10 为底），刻度落在 10 的整数次幂上，指数增长数据呈直线</span>
    </div>
    <div class="demo-page__block-body" style="height: 300px">
      <KLineChart :labels="LABELS" :series="SERIES" :y-axis="{ type: 'log', name: '传播量' }" legend />
    </div>
  </section>
</template>
