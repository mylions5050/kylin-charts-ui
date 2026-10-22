<script setup lang="ts">
import KBarChart from '@/components/k-bar-chart'
import type { KBarSeries } from '@/core/types'

/** 演示数据：柱为销售额（左轴），线为毛利率（右轴，百分比量纲） */
const LABELS = ['1月', '2月', '3月', '4月', '5月', '6月']
const SERIES: KBarSeries[] = [
  { name: '销售额', data: [120, 132, 101, 154, 190, 220] },
  { name: '毛利率', data: [25, 28, 22, 31, 35, 42], type: 'line', yAxisIndex: 1, color: '#FFB020', smooth: true },
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>折柱混合 + 双 Y 轴</span>
      <span>系列 type='line' 叠加折线，yAxisIndex=1 挂右轴（独立 0 基线域），量纲不同的两组数据同图对比</span>
    </div>
    <div class="demo-page__block-body" style="height: 320px">
      <KBarChart :labels="LABELS" :series="SERIES" :y-axis2="{ name: '毛利率(%)' }" legend />
    </div>
  </section>
</template>
