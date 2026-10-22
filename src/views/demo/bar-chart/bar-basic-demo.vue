<script setup lang="ts">
import KBarChart from '@/components/k-bar-chart'
import type { KBarSeries } from '@/core/types'

/** 演示数据：基础多系列分组柱 */
const BASIC: KBarSeries[] = [
  { name: '2024 年', data: [88, 102, 95, 130, 118, 145] },
  { name: '2025 年', data: [96, 110, 108, 122, 140, 160] },
]

const QUARTERS = ['一季度', '二季度', '三季度', '四季度']
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>基础柱形图</span>
      <span>多系列分组 · 自下而上入场生长 · 悬停十字线 + Tooltip</span>
    </div>
    <div class="demo-page__block-body">
      <KBarChart :labels="QUARTERS" :series="BASIC" :height="300" />
    </div>
  </section>
</template>
