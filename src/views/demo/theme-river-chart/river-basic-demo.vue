<script setup lang="ts">
import KThemeRiverChart from '@/components/k-theme-river-chart'
import type { KThemeRiverSeries } from '@/core/types'

/** 演示数据：四条内容线的全年月度流量 */
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
      <span>基础主题河流</span>
      <span>四系列中心堆叠流带 · 平滑贝塞尔边缘 · 左→右逐列揭示入场</span>
    </div>
    <div class="demo-page__block-body" style="height: 320px">
      <KThemeRiverChart :labels="LABELS" :series="SERIES" />
    </div>
  </section>
</template>
