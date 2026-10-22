<script setup lang="ts">
import KLineChart from '@/components/k-line-chart'
import type { KLineSeries } from '@/core/types'

/** 演示数据：气温（左轴 ℃）与客流量（右轴 人），另开顶部次类目轴 */
const LABELS = ['1月', '2月', '3月', '4月', '5月', '6月']
const SERIES: KLineSeries[] = [
  { name: '气温', data: [8, 12, 18, 24, 29, 33], smooth: true },
  { name: '客流', data: [820, 932, 901, 1290, 1330, 1520], smooth: true, yAxisIndex: 1, color: '#FFB020' },
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>多 x 轴 / 多 y 轴</span>
      <span>yAxisIndex=1 挂右侧次数值轴（独立 0 基线域），xAxis2 在顶部展示同组类目</span>
    </div>
    <div class="demo-page__block-body" style="height: 300px">
      <KLineChart
        :labels="LABELS"
        :series="SERIES"
        :y-axis2="{ name: '客流(人)' }"
        :x-axis2="{ name: '月份' }"
        legend
      />
    </div>
  </section>
</template>
