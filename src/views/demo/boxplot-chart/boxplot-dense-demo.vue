<script setup lang="ts">
import KBoxplotChart from '@/components/k-boxplot-chart'
import { computeBoxStats } from '@/core/chart/boxplot-chart'
import type { KBoxplotDatum, KBoxplotSeries } from '@/core/types'

/** 演示数据：全年 12 个月的日最高气温样本分布（固定种子，形态稳定） */
let seed = 23
const nextRand = (): number => {
  seed = (seed * 9301 + 49297) % 233280
  return seed / 233280
}

const BASE_TEMPS = [-2, 1, 6, 13, 19, 24, 27, 26, 21, 14, 6, 0]
const LABELS = BASE_TEMPS.map((_, i) => `${i + 1}月`)
const groups = BASE_TEMPS.map((base) =>
  Array.from({ length: 14 }, () => Math.round((base + (nextRand() - 0.5) * 10) * 10) / 10)
)
const DATA: KBoxplotDatum[] = groups.map(computeBoxStats).filter((b): b is NonNullable<typeof b> => b !== null)
const SERIES: KBoxplotSeries[] = [{ name: '气温', data: DATA }]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>多类目盒须图</span>
      <span>12 个月气温分布 · X 轴标签自动抽稀 · 逐盒错峰入场</span>
    </div>
    <div class="demo-page__block-body" style="height: 320px">
      <KBoxplotChart :labels="LABELS" :series="SERIES" :y-axis="{ name: '日最高气温（℃）' }" />
    </div>
  </section>
</template>
