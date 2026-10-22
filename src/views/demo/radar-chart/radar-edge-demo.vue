<script setup lang="ts">
import KRadarChart from '@/components/k-radar-chart'
import type { KRadarIndicator, KRadarSeries } from '@/core/types'

/** 演示数据：缺省 max（自动取各维度系列最大值）+ 起始角旋转 + 关闭维度名 */
const INDICATORS: KRadarIndicator[] = [
  { name: '营收' },
  { name: '利润' },
  { name: '用户' },
  { name: '留存' },
  { name: '转化' },
]

const SERIES: KRadarSeries[] = [
  { name: '2024 年', data: [860, 420, 730, 65, 38] },
  { name: '2025 年', data: [920, 510, 690, 72, 45] },
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>缺省 max 与起始角</span>
      <span>indicator 不传 max 自动推断 · startAngle 90 起始 · 关闭维度名</span>
    </div>
    <div class="demo-page__block-body">
      <KRadarChart :indicators="INDICATORS" :series="SERIES" :start-angle="90" :axis-name="false" legend :height="340" />
    </div>
  </section>
</template>
