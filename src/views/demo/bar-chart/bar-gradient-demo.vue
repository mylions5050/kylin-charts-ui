<script setup lang="ts">
import KBarChart from '@/components/k-bar-chart'
import type { KBarSeries, KColor } from '@/core/types'

/** 柱条渐变：自上而下由品牌紫过渡到浅紫 */
const BAR_GRADIENT: KColor = {
  type: 'linear',
  x: 0,
  y: 0,
  x2: 0,
  y2: 1,
  colorStops: [
    { offset: 0, color: '#7C5CFC' },
    { offset: 1, color: 'rgba(124, 92, 252, 0.25)' },
  ],
}
const TEAL_GRADIENT: KColor = {
  type: 'linear',
  x: 0,
  y: 0,
  x2: 0,
  y2: 1,
  colorStops: [
    { offset: 0, color: '#00B4BE' },
    { offset: 1, color: 'rgba(0, 180, 190, 0.25)' },
  ],
}

/** 演示数据：渐变柱 + 浅灰背景带 + hover 高亮带平滑滑动 */
const LABELS = ['华东', '华南', '华北', '西南', '东北']
const SERIES: KBarSeries[] = [
  { name: '线上', data: [320, 280, 240, 180, 120], color: BAR_GRADIENT },
  { name: '线下', data: [180, 220, 260, 140, 90], color: TEAL_GRADIENT },
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>渐变柱 + 悬停高亮带</span>
      <span>柱条渐变着色；鼠标悬停时主题色高亮带平滑滑动到当前类目（默认开启，可传颜色换色或传 false 关闭）</span>
    </div>
    <div class="demo-page__block-body" style="height: 300px">
      <KBarChart :labels="LABELS" :series="SERIES" show-background :height="300" />
    </div>
  </section>
</template>
