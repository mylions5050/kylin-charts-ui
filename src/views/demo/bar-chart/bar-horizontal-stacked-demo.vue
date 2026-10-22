<script setup lang="ts">
import KBarChart from '@/components/k-bar-chart'
import type { KBarSeries } from '@/core/types'

/** 演示数据：横向堆叠条形图（horizontal + stack 组合） */
const H_STACKED: KBarSeries[] = [
  { name: '基本面', data: [70, 82, 64, 90], stack: 'score' },
  { name: '加分项', data: [15, 22, 18, 25], stack: 'score' },
]

const QUARTERS = ['一季度', '二季度', '三季度', '四季度']
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>横向堆叠条形图</span>
      <span>horizontal + stack 组合 · 自左向右堆叠生长</span>
    </div>
    <div class="demo-page__block-body">
      <KBarChart
        :labels="QUARTERS"
        :series="H_STACKED"
        horizontal
        :x-axis="{ name: '综合得分' }"
        :height="260"
      />
    </div>
  </section>
</template>
