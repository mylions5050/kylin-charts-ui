<script setup lang="ts">
import KPieChart from '@/components/k-pie-chart'
import type { KPieDatum } from '@/core/types'

/** 演示数据：单一数据项占 100%（整圆边界保护） */
const ONLY: KPieDatum[] = [{ name: '唯一来源', value: 1000 }]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>边界示例：单一数据占 100%</span>
      <span>整圆绘制保护 · 悬停强调与 Tooltip 正常工作</span>
    </div>
    <div class="demo-page__block-body">
      <KPieChart :data="ONLY" title="单一数据边界" :height="300" />
    </div>
  </section>
</template>
