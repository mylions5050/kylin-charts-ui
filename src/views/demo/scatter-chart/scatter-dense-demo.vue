<script setup lang="ts">
import KScatterChart from '@/components/k-scatter-chart'
import type { KScatterDatum, KScatterSeries } from '@/core/types'

/** 演示数据：200 个采样点（正弦趋势 + 固定种子噪声），验证大量散点渲染性能 */
let seed = 7
const nextRand = (): number => {
  seed = (seed * 9301 + 49297) % 233280
  return seed / 233280
}

const DATA: KScatterDatum[] = []
for (let i = 0; i < 200; i++) {
  const x = Number((i * 0.5).toFixed(1))
  const y = Number((50 + 30 * Math.sin(x / 8) + (nextRand() - 0.5) * 16).toFixed(1))
  DATA.push([x, y])
}

const SERIES: KScatterSeries[] = [{ name: '采样点', radius: 3, data: DATA }]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>大样本散点</span>
      <span>200 个采样点 · 正弦趋势 + 噪声 · 小半径高密度渲染</span>
    </div>
    <div class="demo-page__block-body" style="height: 320px">
      <KScatterChart :series="SERIES" :x-axis="{ name: '采样序号' }" :y-axis="{ name: '观测值' }" />
    </div>
  </section>
</template>
