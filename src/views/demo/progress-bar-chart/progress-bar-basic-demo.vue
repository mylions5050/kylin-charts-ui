<script setup lang="ts">
import KProgressBarChart from '@/components/k-progress-bar-chart'
import type { KProgressBarDatum } from '@/core/types'

/** 演示数据：各渠道销售目标完成进度 */
const DATA: KProgressBarDatum[] = [
  { name: '直营门店', value: 82, unit: '%' },
  { name: '电商平台', value: 64, unit: '%' },
  { name: '分销渠道', value: 47, unit: '%' },
  { name: '私域社群', value: 91, unit: '%' },
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>基础进度条</span>
      <span>左名称 · 中轨道圆角条 · 右数值 · 各行错峰生长入场</span>
    </div>
    <div class="demo-page__block-body" style="height: 220px">
      <KProgressBarChart :data="DATA" />
    </div>
  </section>
</template>
