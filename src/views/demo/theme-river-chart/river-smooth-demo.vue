<script setup lang="ts">
import KThemeRiverChart from '@/components/k-theme-river-chart'
import type { KThemeRiverSeries } from '@/core/types'

/** 演示数据：与基础用例同源，关闭平滑观察折线边缘 */
const LABELS = Array.from({ length: 12 }, (_, i) => `${i + 1}月`)
const SERIES: KThemeRiverSeries[] = [
  { name: '短视频', data: [320, 380, 420, 460, 510, 560, 610, 660, 700, 760, 820, 900] },
  { name: '图文', data: [260, 250, 240, 235, 220, 210, 205, 200, 195, 190, 185, 180] },
  { name: '直播', data: [150, 170, 200, 240, 300, 360, 430, 470, 520, 580, 640, 720] },
  { name: '音频', data: [90, 95, 100, 105, 110, 118, 125, 130, 138, 145, 152, 160] },
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>直边主题河流</span>
      <span>smooth false · Catmull-Rom 平滑关闭 · 边缘为折线段</span>
    </div>
    <div class="demo-page__block-body" style="height: 320px">
      <KThemeRiverChart :labels="LABELS" :series="SERIES" :smooth="false" />
    </div>
  </section>
</template>
