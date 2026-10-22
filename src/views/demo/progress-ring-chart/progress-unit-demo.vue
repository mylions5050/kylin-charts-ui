<script setup lang="ts">
import KProgressRingChart from '@/components/k-progress-ring-chart'
import type { KProgressDatum } from '@/core/types'

/** 演示数据：自定义量程与单位（本周打包 42 / 60 件） */
const DATA: KProgressDatum = { name: '本周打包任务', value: 42, max: 60, unit: '件' }
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>自定义量程进度环</span>
      <span>max 60 自定义上限 · 中心展示 42 / 60件 · 百分比按量程换算 70%</span>
    </div>
    <div class="demo-page__block-body" style="height: 300px">
      <KProgressRingChart :data="DATA" color="#F7BA1E" />
    </div>
  </section>
</template>
