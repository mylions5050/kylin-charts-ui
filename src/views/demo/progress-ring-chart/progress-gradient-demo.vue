<script setup lang="ts">
import KProgressRingChart from '@/components/k-progress-ring-chart'
import type { KProgressDatum } from '@/core/types'

/** 演示数据：进度弧用线性渐变（12 点方向起始，沿弧包围盒向下过渡） */
const DATA: KProgressDatum = {
  name: '年度目标',
  value: 76,
  unit: '%',
  color: {
    type: 'linear',
    x: 0,
    y: 0,
    x2: 0,
    y2: 1,
    colorStops: [
      { offset: 0, color: '#7C5CFC' },
      { offset: 1, color: '#00B4BE' },
    ],
  },
}
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>渐变进度环</span>
      <span>data.color 传线性渐变，进度弧由品牌紫过渡到青色</span>
    </div>
    <div class="demo-page__block-body" style="height: 260px">
      <KProgressRingChart :data="DATA" :height="260" />
    </div>
  </section>
</template>
