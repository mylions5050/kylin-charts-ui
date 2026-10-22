<script setup lang="ts">
import KLineChart from '@/components/k-line-chart'
import type { KLineSeries } from '@/core/types'
import { MONTHS } from '../constants'

/** 演示数据：数据点携带配置（点级颜色 + 标签） */
const MARKED: KLineSeries[] = [
  {
    name: '转化率',
    data: [
      32,
      36,
      34,
      { value: 41, label: { show: true } },
      38,
      { value: 18, color: '#F5455C', label: { show: true } },
      29,
      33,
      37,
      40,
      42,
      45,
    ],
  },
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>数据点携带配置</span>
      <span>点级颜色覆盖 · 点级标签 · 裸值与对象混用</span>
    </div>
    <div class="demo-page__block-body">
      <KLineChart :labels="MONTHS" :series="MARKED" :height="280" />
    </div>
  </section>
</template>
