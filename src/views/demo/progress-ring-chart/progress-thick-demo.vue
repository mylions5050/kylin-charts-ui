<script setup lang="ts">
import KProgressRingChart from '@/components/k-progress-ring-chart'
import type { KProgressDatum } from '@/core/types'

/** 演示数据：接近满载的构建缓存（粗环带 + 满圆临界） */
const DATA: KProgressDatum = { name: '构建缓存占用', value: 96 }
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>粗环带高进度</span>
      <span>trackWidth 22 粗环 · radiusRatio 0.68 · 96% 观察接近满圆的弧线闭合</span>
    </div>
    <div class="demo-page__block-body" style="height: 300px">
      <KProgressRingChart :data="DATA" :track-width="22" :radius-ratio="0.68" />
    </div>
  </section>
</template>
