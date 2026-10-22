<script setup lang="ts">
import KCandlestickChart from '@/components/k-candlestick-chart'
import type { KCandleDatum } from '@/core/types'

/** 演示数据：含十字星（开 = 收）与长上下影线的特殊形态 [开, 收, 低, 高] */
const LABELS = ['11-01', '11-02', '11-03', '11-04', '11-05', '11-06', '11-07']
const DATA: KCandleDatum[] = [
  [15.0, 15.1, 14.2, 15.8],
  [15.1, 15.1, 14.6, 15.6],
  [15.1, 14.3, 14.2, 15.2],
  [14.3, 14.3, 13.8, 14.9],
  [14.3, 15.5, 14.1, 15.6],
  [15.5, 15.5, 15.0, 16.2],
  [15.5, 16.4, 15.4, 16.6],
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>十字星与长影线</span>
      <span>开 = 收退化为一字横线 · 长上下影线形态 · 多空拉锯可视化</span>
    </div>
    <div class="demo-page__block-body" style="height: 300px">
      <KCandlestickChart :labels="LABELS" :data="DATA" :ma="[]" />
    </div>
  </section>
</template>
