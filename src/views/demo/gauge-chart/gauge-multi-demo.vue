<script setup lang="ts">
import KGaugeChart from '@/components/k-gauge-chart'
import type { KGaugeDatum } from '@/core/types'

/** 演示数据：三条业务线完成率并排 */
const DATAS: KGaugeDatum[] = [
  { name: '研发线', value: 88, unit: '%' },
  { name: '运营线', value: 64, unit: '%' },
  { name: '市场线', value: 41, unit: '%' },
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>多仪表并排</span>
      <span>flex 三列布局 · 各自独立量程与配色 · 悬停分别查看明细</span>
    </div>
    <div class="demo-page__block-body" style="display: flex; height: 280px">
      <div v-for="d in DATAS" :key="d.name" style="flex: 1">
        <KGaugeChart :data="d" />
      </div>
    </div>
  </section>
</template>
