<script setup lang="ts">
import KProgressBarChart from '@/components/k-progress-bar-chart'
import type { KProgressBarDatum } from '@/core/types'

/** 演示数据：每行指定语义色 */
const DATA: KProgressBarDatum[] = [
  { name: '库存周转', value: 88, unit: '%', color: '#4CAF7D' },
  { name: '资金回款', value: 62, unit: '%', color: '#F5A623' },
  { name: '客诉处理', value: 35, unit: '%', color: '#F0604D' },
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>自定义颜色</span>
      <span>按行指定 color，表达健康度语义（绿/橙/红）</span>
    </div>
    <div class="demo-page__block-body" style="height: 180px">
      <KProgressBarChart :data="DATA" />
    </div>
  </section>
</template>
