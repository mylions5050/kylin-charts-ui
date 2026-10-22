<script setup lang="ts">
import KCandlestickChart from '@/components/k-candlestick-chart'
import type { KCandleDatum } from '@/core/types'

/** 演示数据：20 个交易日震荡上行行情 [开, 收, 低, 高] */
const LABELS = Array.from({ length: 20 }, (_, i) => `09-${String(i + 1).padStart(2, '0')}`)
const DATA: KCandleDatum[] = [
  [20.2, 20.8, 20.0, 21.0],
  [20.8, 20.5, 20.2, 21.2],
  [20.5, 21.3, 20.4, 21.5],
  [21.3, 21.9, 21.1, 22.2],
  [21.9, 21.6, 21.3, 22.1],
  [21.6, 22.4, 21.5, 22.6],
  [22.4, 22.1, 21.8, 22.7],
  [22.1, 22.8, 22.0, 23.0],
  [22.8, 22.5, 22.2, 23.1],
  [22.5, 23.2, 22.4, 23.5],
  [23.2, 23.8, 23.0, 24.0],
  [23.8, 23.4, 23.1, 24.1],
  [23.4, 24.0, 23.3, 24.3],
  [24.0, 23.6, 23.2, 24.2],
  [23.6, 24.2, 23.5, 24.5],
  [24.2, 24.8, 24.1, 25.0],
  [24.8, 24.5, 24.2, 25.1],
  [24.5, 25.2, 24.4, 25.5],
  [25.2, 25.8, 25.0, 26.0],
  [25.8, 25.4, 25.1, 26.1],
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>叠加均线 K 线图</span>
      <span>MA5 / MA10 / MA20 叠加 · 图例点击切换 · 均线自左向右揭示动画</span>
    </div>
    <div class="demo-page__block-body" style="height: 320px">
      <KCandlestickChart :labels="LABELS" :data="DATA" :ma="[5, 10, 20]" legend />
    </div>
  </section>
</template>
