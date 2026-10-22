<script setup lang="ts">
import KCandlestickChart from '@/components/k-candlestick-chart'
import type { KCandleDatum } from '@/core/types'

/** 演示数据：30 个交易日随机游走行情（固定种子，形态稳定）[开, 收, 低, 高] */
let seed = 42
const nextRand = (): number => {
  seed = (seed * 9301 + 49297) % 233280
  return seed / 233280
}

const round2 = (v: number): number => Number(v.toFixed(2))
let price = 30
const LABELS: string[] = []
const DATA: KCandleDatum[] = []
for (let i = 0; i < 30; i++) {
  LABELS.push(`10-${String(i + 1).padStart(2, '0')}`)
  const open = price
  const close = round2(open + (nextRand() - 0.48) * 1.4)
  const low = round2(Math.min(open, close) - nextRand() * 0.6)
  const high = round2(Math.max(open, close) + nextRand() * 0.6)
  DATA.push([open, close, low, high])
  price = close
}
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>高密度日 K</span>
      <span>30 根蜡烛 · X 轴标签自动抽稀 · MA5 / MA10 叠加 · 逐根错峰入场</span>
    </div>
    <div class="demo-page__block-body" style="height: 320px">
      <KCandlestickChart :labels="LABELS" :data="DATA" :ma="[5, 10]" />
    </div>
  </section>
</template>
