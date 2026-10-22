<script setup lang="ts">
import KBoxplotChart from '@/components/k-boxplot-chart'
import type { KBoxplotSeries } from '@/core/types'

/** 演示数据：三个渠道转化率分布（窄盒 + 点级颜色覆盖，绿色标注达标渠道） */
const LABELS = ['搜索引流', '信息流', '私域推荐']
const SERIES: KBoxplotSeries[] = [
  {
    name: '转化率',
    data: [
      { value: [2.1, 3.2, 4.0, 5.1, 6.8] },
      { value: [1.4, 2.2, 3.1, 4.0, 5.5], outliers: [7.2] },
      { value: [4.5, 6.0, 7.2, 8.5, 10.2], color: '#00B578' },
    ],
  },
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>样式定制盒须图</span>
      <span>boxWidth 窄盒 · 点级 color 覆盖（达标渠道标绿）</span>
    </div>
    <div class="demo-page__block-body" style="height: 300px">
      <KBoxplotChart :labels="LABELS" :series="SERIES" :box-width="0.45" :y-axis="{ name: '转化率（%）' }" />
    </div>
  </section>
</template>
