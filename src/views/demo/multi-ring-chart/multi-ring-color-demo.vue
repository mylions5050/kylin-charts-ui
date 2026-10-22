<script setup lang="ts">
import KMultiRingChart from '@/components/k-multi-ring-chart'
import type { KProgressDatum } from '@/core/types'

/** 演示数据：每环指定语义色 */
const DATA: KProgressDatum[] = [
  { name: '研发投入', value: 84, unit: '%', color: '#7C5CFC' },
  { name: '市场投入', value: 61, unit: '%', color: '#3D8BFF' },
  { name: '运营投入', value: 45, unit: '%', color: '#4CAF7D' },
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>自定义颜色</span>
      <span>按环指定 color，底环为同色 12% 透明轨道</span>
    </div>
    <div class="demo-page__block-body" style="height: 320px">
      <KMultiRingChart :data="DATA" />
    </div>
  </section>
</template>
