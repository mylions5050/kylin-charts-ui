<script setup lang="ts">
import KRadarChart from '@/components/k-radar-chart'
import type { KRadarIndicator, KRadarSeries } from '@/core/types'

/** 演示数据：双系列六维对比（全部显式 max） */
const INDICATORS: KRadarIndicator[] = [
  { name: '销售', max: 420 },
  { name: '管理', max: 420 },
  { name: '技术', max: 420 },
  { name: '客服', max: 420 },
  { name: '研发', max: 420 },
  { name: '市场', max: 420 },
]

const SERIES: KRadarSeries[] = [
  { name: '预算分配', data: [320, 300, 240, 280, 200, 350] },
  { name: '实际开销', data: [280, 260, 300, 230, 260, 300] },
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>基础雷达图</span>
      <span>双系列六维 · 可点击图例 · 悬停虚线半径线 + Tooltip</span>
    </div>
    <div class="demo-page__block-body">
      <KRadarChart :indicators="INDICATORS" :series="SERIES" title="预算 vs 实际" legend :height="380" />
    </div>
  </section>
</template>
