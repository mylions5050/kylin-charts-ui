<script setup lang="ts">
import KBarChart from '@/components/k-bar-chart'
import type { KBarSeries } from '@/core/types'

/** 演示数据：三个系列堆叠（相同 stack 值堆到同一根柱上） */
const STACKED: KBarSeries[] = [
  { name: '线上', data: [120, 132, 101, 134, 190, 230], stack: 'total' },
  { name: '线下', data: [60, 72, 91, 88, 110, 132], stack: 'total' },
  { name: '分销', data: [30, 42, 40, 56, 64, 78], stack: 'total' },
]

const HALF_YEAR = ['1月', '2月', '3月', '4月', '5月', '6月']
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>堆叠柱形图</span>
      <span>series.stack 相同值的系列堆叠 · 图例可点击切换</span>
    </div>
    <div class="demo-page__block-body">
      <KBarChart
        :labels="HALF_YEAR"
        :series="STACKED"
        title="渠道销量构成"
        legend
        :x-axis="{ name: '月份' }"
        :y-axis="{ name: '销量（件）' }"
        :height="340"
      />
    </div>
  </section>
</template>
