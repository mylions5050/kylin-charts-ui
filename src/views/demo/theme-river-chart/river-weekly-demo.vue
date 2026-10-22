<script setup lang="ts">
import KThemeRiverChart from '@/components/k-theme-river-chart'
import type { KThemeRiverSeries } from '@/core/types'

/** 演示数据：半年 26 周的渠道消耗（周粒度，列数更多） */
const LABELS = Array.from({ length: 26 }, (_, i) => `W${i + 1}`)
const SERIES: KThemeRiverSeries[] = [
  {
    name: '信息流',
    data: LABELS.map((_, i) => 200 + Math.round(80 * Math.sin(i / 2.4)) + i * 3),
  },
  {
    name: '搜索',
    data: LABELS.map((_, i) => 160 + Math.round(50 * Math.cos(i / 3)) + Math.round(i * 1.5)),
  },
  {
    name: '应用商店',
    data: LABELS.map((_, i) => 120 + ((i * 37) % 60)),
  },
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>周粒度主题河流</span>
      <span>26 个时间列 · 锯齿波动形态 · x 轴标签自动抽稀防重叠</span>
    </div>
    <div class="demo-page__block-body" style="height: 320px">
      <KThemeRiverChart :labels="LABELS" :series="SERIES" />
    </div>
  </section>
</template>
