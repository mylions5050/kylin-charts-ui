<script setup lang="ts">
import KRadarChart from '@/components/k-radar-chart'
import type { KRadarIndicator, KRadarSeries } from '@/core/types'

/** 演示数据：三系列叠加（其中一个关闭面积填充） */
const INDICATORS: KRadarIndicator[] = [
  { name: '沟通', max: 100 },
  { name: '协作', max: 100 },
  { name: '创新', max: 100 },
  { name: '执行', max: 100 },
  { name: '学习', max: 100 },
]

const SERIES: KRadarSeries[] = [
  { name: '团队 A', data: [85, 90, 70, 95, 80] },
  { name: '团队 B', data: [70, 60, 88, 75, 92] },
  { name: '团队 C', data: [60, 75, 55, 85, 60], area: false },
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>多系列叠加</span>
      <span>三系列 · 系列级 area 关闭（仅描线）对比</span>
    </div>
    <div class="demo-page__block-body">
      <KRadarChart :indicators="INDICATORS" :series="SERIES" legend :height="380" />
    </div>
  </section>
</template>
