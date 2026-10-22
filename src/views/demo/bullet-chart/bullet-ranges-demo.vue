<script setup lang="ts">
import KBulletChart from '@/components/k-bullet-chart'
import type { KBulletDatum } from '@/core/types'

/** 演示数据：三段定性量程（差/良/优阈值） */
const DATA: KBulletDatum[] = [
  { name: '客户满意度', value: 81, target: 85, ranges: [60, 80, 100], unit: '%' },
  { name: '交付准时率', value: 74, target: 90, ranges: [50, 75, 100], unit: '%' },
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>自定义分段</span>
      <span>ranges 升序阈值切三段，底带灰阶逐段加深（差/良/优）</span>
    </div>
    <div class="demo-page__block-body" style="height: 170px">
      <KBulletChart :data="DATA" />
    </div>
  </section>
</template>
