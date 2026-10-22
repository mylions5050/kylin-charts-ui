<script setup lang="ts">
import KBarChart from '@/components/k-bar-chart'
import type { KBarSeries } from '@/core/types'

/** 演示数据：横向分组条形图 */
const HORIZONTAL: KBarSeries[] = [
  { name: '2024 年', data: [88, 102, 95, 130] },
  { name: '2025 年', data: [96, 110, 108, 122] },
]

const QUARTERS = ['一季度', '二季度', '三季度', '四季度']
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>横向条形图</span>
      <span>horizontal · 类目轴在 y · 柱子自左向右生长</span>
    </div>
    <div class="demo-page__block-body">
      <KBarChart
        :labels="QUARTERS"
        :series="HORIZONTAL"
        horizontal
        :x-axis="{ name: '销量（件）' }"
        :height="300"
      />
    </div>
  </section>
</template>
