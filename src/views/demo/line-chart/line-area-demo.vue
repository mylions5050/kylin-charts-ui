<script setup lang="ts">
import KLineChart from '@/components/k-line-chart'
import type { KLineSeries } from '@/core/types'
import { MONTHS } from '../constants'

/** 演示数据：平滑面积（含 null 断点） */
const TREND: KLineSeries[] = [
  { name: '活跃用户', data: [820, 932, 901, null, 1290, 1330, 1520, 1420, 1600, 1780, null, 2050] },
  { name: '新增用户', data: [320, 402, 361, 434, 490, 530, 580, 520, 600, 680, 720, 850] },
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>平滑面积折线图</span>
      <span>smooth + area · 含 null 断点分段</span>
    </div>
    <div class="demo-page__block-body">
      <KLineChart :labels="MONTHS" :series="TREND" smooth area :height="300" />
    </div>
  </section>
</template>
