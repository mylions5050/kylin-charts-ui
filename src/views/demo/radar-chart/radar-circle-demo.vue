<script setup lang="ts">
import KRadarChart from '@/components/k-radar-chart'
import type { KRadarIndicator, KRadarSeries } from '@/core/types'

/** 演示数据：圆形网格 + 圈数调整 */
const INDICATORS: KRadarIndicator[] = [
  { name: '力量', max: 100 },
  { name: '速度', max: 100 },
  { name: '防守', max: 100 },
  { name: '耐力', max: 100 },
  { name: '技巧', max: 100 },
]

const SERIES: KRadarSeries[] = [
  { name: '战士', data: [90, 55, 85, 70, 40] },
  { name: '刺客', data: [45, 95, 40, 60, 90], color: '#2B6FFF' },
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>圆形网格雷达</span>
      <span>shape circle · splitNumber 4 · 系列级颜色覆盖</span>
    </div>
    <div class="demo-page__block-body">
      <KRadarChart :indicators="INDICATORS" :series="SERIES" shape="circle" :split-number="4" legend :height="360" />
    </div>
  </section>
</template>
