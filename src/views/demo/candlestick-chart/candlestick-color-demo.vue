<script setup lang="ts">
import KCandlestickChart from '@/components/k-candlestick-chart'
import type { KCandleDatum } from '@/core/types'

/** 演示数据：8 个交易日宽幅震荡行情 [开, 收, 低, 高] */
const LABELS = ['10-08', '10-09', '10-10', '10-11', '10-12', '10-13', '10-14', '10-15']
const DATA: KCandleDatum[] = [
  [18.2, 17.4, 17.1, 18.5],
  [17.4, 18.1, 17.2, 18.4],
  [18.1, 17.6, 17.3, 18.3],
  [17.6, 16.8, 16.5, 17.9],
  [16.8, 17.7, 16.6, 18.0],
  [17.7, 18.5, 17.5, 18.8],
  [18.5, 17.9, 17.6, 18.7],
  [17.9, 18.8, 17.8, 19.1],
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>自定义阴阳配色</span>
      <span>美式习惯（绿涨红跌）· bullColor / bearColor 覆盖默认红涨绿跌</span>
    </div>
    <div class="demo-page__block-body" style="height: 280px">
      <KCandlestickChart :labels="LABELS" :data="DATA" :ma="[]" bull-color="#00B578" bear-color="#F5455C" />
    </div>
  </section>
</template>
