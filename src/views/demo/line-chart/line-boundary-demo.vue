<script setup lang="ts">
import KLineChart from '@/components/k-line-chart'
import type { KLineSeries } from '@/core/types'

/** 演示数据：与基础折线图同源，对比两种 x 轴对齐模式 */
const LABELS = ['1月', '2月', '3月', '4月', '5月', '6月']
const SERIES: KLineSeries[] = [
  { name: '销售额', data: [120, 132, 101, 154, 190, 220] },
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>两端对齐对比</span>
      <span>左：boundaryGap=false（缺省，首尾点贴齐轴两端）；右：boundaryGap=true（点落在类目带中心，两端留半步）</span>
    </div>
    <div class="demo-page__block-body" style="height: 260px; display: flex; gap: 24px">
      <div style="flex: 1; min-width: 0">
        <KLineChart :labels="LABELS" :series="SERIES" />
      </div>
      <div style="flex: 1; min-width: 0">
        <KLineChart :labels="LABELS" :series="SERIES" boundary-gap />
      </div>
    </div>
  </section>
</template>
