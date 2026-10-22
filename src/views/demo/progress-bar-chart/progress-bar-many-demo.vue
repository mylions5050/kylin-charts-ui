<script setup lang="ts">
import KProgressBarChart from '@/components/k-progress-bar-chart'
import type { KProgressBarDatum } from '@/core/types'

/** 演示数据：行数较多时的密集布局 */
const DATA: KProgressBarDatum[] = Array.from({ length: 9 }, (_, i) => ({
  name: `服务器 ${String(i + 1).padStart(2, '0')}`,
  value: Math.round(20 + Math.abs(Math.sin(i * 1.7)) * 78),
  max: 100,
  unit: '%',
}))
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>多行密集</span>
      <span>9 行自动均分行高，隐藏底轨道对比纯色条</span>
    </div>
    <div class="demo-page__block-body" style="height: 320px">
      <KProgressBarChart :data="DATA" :bar-height="12" :show-track="false" />
    </div>
  </section>
</template>
