<script setup lang="ts">
import KBarChart from '@/components/k-bar-chart'
import type { KBarSeries } from '@/core/types'

/** 演示数据：单系列 + null 断点跳柱 + 点级颜色/标签 */
const MARKED: KBarSeries[] = [
  {
    name: '访问量',
    data: [
      820,
      932,
      null,
      { value: 1134, label: { show: true } },
      1250,
      { value: 720, color: '#F5455C', label: { show: true } },
    ],
  },
]

const MONTHS = ['1月', '2月', '3月', '4月', '5月', '6月']
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>数据点携带配置</span>
      <span>单系列 · null 断点跳柱 · 点级颜色覆盖 · 点级标签</span>
    </div>
    <div class="demo-page__block-body">
      <KBarChart :labels="MONTHS" :series="MARKED" :height="280" />
    </div>
  </section>
</template>
