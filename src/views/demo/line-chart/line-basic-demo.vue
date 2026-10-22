<script setup lang="ts">
import KLineChart from '@/components/k-line-chart'
import type { KLineSeries } from '@/core/types'
import { MONTHS } from '../constants'

/** 演示数据：多系列折线 */
const SALES: KLineSeries[] = [
  { name: '销售额', data: [120, 132, 101, 134, 190, 230, 210, 182, 191, 234, 290, 330] },
  { name: '毛利', data: [56, 68, 48, 72, 96, 118, 102, 84, 95, 128, 152, 178] },
  { name: '退款额', data: [12, 18, 22, 15, 20, 28, 32, 24, 19, 26, 30, 35] },
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>基础折线图</span>
      <span>多系列 · 从左向右入场 · 悬停十字线 + Tooltip</span>
    </div>
    <div class="demo-page__block-body">
      <KLineChart
        :labels="MONTHS"
        :series="SALES"
        :x-axis="{ name: '月份' }"
        :y-axis="{ name: '销售额' }"
        :height="340"
      />
    </div>
  </section>
</template>
