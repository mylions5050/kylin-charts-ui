<script setup lang="ts">
import KCandlestickChart from '@/components/k-candlestick-chart'
import type { KCandleDatum } from '@/core/types'

/** 演示数据：某股票 10 个交易日行情 [开, 收, 低, 高] */
const LABELS = ['09-01', '09-02', '09-03', '09-04', '09-05', '09-06', '09-07', '09-08', '09-09', '09-10']
const DATA: KCandleDatum[] = [
  [24.5, 25.2, 24.1, 25.8],
  [25.2, 24.8, 24.3, 25.6],
  [24.8, 25.6, 24.6, 25.9],
  [25.6, 26.4, 25.4, 26.8],
  [26.4, 25.9, 25.5, 26.6],
  [25.9, 26.2, 25.6, 26.7],
  [26.2, 25.4, 25.1, 26.3],
  [25.4, 24.9, 24.6, 25.7],
  [24.9, 25.8, 24.7, 26.0],
  [25.8, 26.6, 25.7, 27.0],
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>基础 K 线图</span>
      <span>红涨绿跌 · 阴阳实体 + 影线 · 悬停高亮带 + OHLC Tooltip</span>
    </div>
    <div class="demo-page__block-body" style="height: 320px">
      <KCandlestickChart :labels="LABELS" :data="DATA" :ma="[]" />
    </div>
  </section>
</template>
