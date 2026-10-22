<script setup lang="ts">
import KLineChart from '@/components/k-line-chart'
import type { KColor, KLineSeries } from '@/core/types'
import { MONTHS } from '../constants'

/** 渐变配置：对齐 ECharts LinearGradient 形态，坐标为 0~1 相对值 */
const PURPLE_GRADIENT: KColor = {
  type: 'linear',
  x: 0,
  y: 0,
  x2: 0,
  y2: 1,
  colorStops: [
    { offset: 0, color: 'rgba(124, 92, 252, 0.55)' },
    { offset: 1, color: 'rgba(124, 92, 252, 0.02)' },
  ],
}
const CYAN_GRADIENT: KColor = {
  type: 'linear',
  x: 0,
  y: 0,
  x2: 0,
  y2: 1,
  colorStops: [
    { offset: 0, color: 'rgba(0, 180, 190, 0.5)' },
    { offset: 1, color: 'rgba(0, 180, 190, 0.02)' },
  ],
}

/** 演示数据：两系列渐变面积（渐变写在 series.color，线与面积同色系） */
const SERIES: KLineSeries[] = [
  { name: '销售额', data: [820, 932, 901, 1034, 1290, 1330, 1520], color: PURPLE_GRADIENT, lineWidth: 2 },
  { name: '利润', data: [320, 402, 361, 490, 530, 580, 640], color: CYAN_GRADIENT, lineWidth: 2 },
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>渐变面积折线图</span>
      <span>series.color 传渐变配置：折线描边与面积填充共用一套渐变，透明度在 colorStops 中自带</span>
    </div>
    <div class="demo-page__block-body">
      <KLineChart :labels="MONTHS.slice(0, 7)" :series="SERIES" smooth area :height="300" />
    </div>
  </section>
</template>
