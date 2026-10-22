<script setup lang="ts">
import KLineChart from '@/components/k-line-chart'
import type { KLineSeries } from '@/core/types'
import { MONTHS } from '../constants'

const STEP_MONTHS = MONTHS.slice(0, 9)

/** 演示数据：阶梯折线（三种转折位置对比） */
const STEP_DATA: KLineSeries[] = [
  { name: '先水平 start', data: [120, 135, 128, 142, 138, 150, 145, 158, 152], step: 'start', color: '#2B6FFF' },
  { name: '中点 middle', data: [80, 92, 85, 98, 94, 105, 100, 112, 108], step: 'middle' },
  { name: '后水平 end', data: [45, 55, 50, 62, 58, 68, 63, 74, 70], step: 'end', color: '#F5455C' },
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>阶梯折线图</span>
      <span>step: start / middle / end 三种转折位置对比</span>
    </div>
    <div class="demo-page__block-body">
      <KLineChart :labels="STEP_MONTHS" :series="STEP_DATA" :height="300" />
    </div>
  </section>
</template>
