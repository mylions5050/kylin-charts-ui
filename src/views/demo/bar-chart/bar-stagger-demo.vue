<script setup lang="ts">
import KBarChart from '@/components/k-bar-chart'
import type { KBarSeries } from '@/core/types'

/** 演示数据：含正负值的利润数据，类目标签交错两行避让 */
const LABELS = ['一月', '二月', '三月', '四月', '五月', '六月']
const SERIES: KBarSeries[] = [{ name: '利润', data: [120, -80, 95, -45, 160, -30] }]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>交错轴标签</span>
      <span>staggerLabels 开启后类目标签两行交错，正负柱场景下避免标签与柱体重叠</span>
    </div>
    <div class="demo-page__block-body" style="height: 300px">
      <KBarChart :labels="LABELS" :series="SERIES" stagger-labels />
    </div>
  </section>
</template>
