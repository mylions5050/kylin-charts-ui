<script setup lang="ts">
import KRoseChart from '@/components/k-rose-chart'
import type { KPieDatum } from '@/core/types'

/** 演示数据：area 模式 + 无边框 */
const AREA_DATA: KPieDatum[] = [
  { name: 'Q1', value: 520 },
  { name: 'Q2', value: 380 },
  { name: 'Q3', value: 260 },
  { name: 'Q4', value: 140 },
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>玫瑰图 · 无边框</span>
      <span>item-border="false" 关闭扇区白色描边（area 模式）</span>
    </div>
    <div class="demo-page__block-body">
      <KRoseChart :data="AREA_DATA" title="季度营收分布" legend rose-type="area" :item-border="false" :height="340" />
    </div>
  </section>
</template>
