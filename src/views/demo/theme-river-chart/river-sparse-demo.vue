<script setup lang="ts">
import KThemeRiverChart from '@/components/k-theme-river-chart'
import type { KThemeRiverSeries } from '@/core/types'

/** 演示数据：服务回归期「新功能」归零，观察凹陷形态与悬停压暗逻辑 */
const LABELS = Array.from({ length: 14 }, (_, i) => `D${i + 1}`)
const SERIES: KThemeRiverSeries[] = [
  { name: '核心交易', data: LABELS.map((_, i) => 180 + ((i * 29) % 50)) },
  { name: '新功能', data: [90, 110, 130, 150, 160, 120, 60, 0, 0, 0, 20, 70, 120, 160] },
  { name: '营销活动', data: LABELS.map((_, i) => 100 + ((i * 47) % 80)) },
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>归零凹陷主题河流</span>
      <span>中段系列归零形成凹陷 · 悬停时零值系列自动压暗 · 河道厚度变化直观</span>
    </div>
    <div class="demo-page__block-body" style="height: 320px">
      <KThemeRiverChart :labels="LABELS" :series="SERIES" />
    </div>
  </section>
</template>
