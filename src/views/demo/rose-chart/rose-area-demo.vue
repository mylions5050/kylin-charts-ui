<script setup lang="ts">
import KRoseChart from '@/components/k-rose-chart'
import type { KPieDatum } from '@/core/types'

/** 演示数据：area 模式（面积映射数值，半径差异更平缓） */
const AREA_DATA: KPieDatum[] = [
  { name: 'Q1', value: 520 },
  { name: 'Q2', value: 310 },
  { name: 'Q3', value: 150 },
  { name: 'Q4', value: 60 },
  { name: 'Q5', value: 20 },
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>玫瑰图 · area 模式</span>
      <span>面积映射数值 · 与 radius 模式对比半径差异更平缓</span>
    </div>
    <div class="demo-page__block-body">
      <KRoseChart :data="AREA_DATA" rose-type="area" title="季度差异（area）" :height="340" />
    </div>
  </section>
</template>
