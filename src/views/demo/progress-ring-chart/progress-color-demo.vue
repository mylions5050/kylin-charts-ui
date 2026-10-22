<script setup lang="ts">
import KProgressRingChart from '@/components/k-progress-ring-chart'
import type { KProgressDatum } from '@/core/types'

/** 演示数据：磁盘使用率（自定义绿色 + 细环带） */
const DATA: KProgressDatum = { name: '磁盘使用率', value: 62, unit: '%' }
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>自定义颜色进度环</span>
      <span>color 绿色语义化 · trackWidth 10 细环带 · 单位展示在数值后</span>
    </div>
    <div class="demo-page__block-body" style="height: 300px">
      <KProgressRingChart :data="DATA" color="#2BA471" :track-width="10" />
    </div>
  </section>
</template>
