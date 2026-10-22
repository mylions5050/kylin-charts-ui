<script setup lang="ts">
import KGaugeChart from '@/components/k-gauge-chart'
import type { KGaugeDatum, KGaugeStop } from '@/core/types'

/** 演示数据：服务健康分 + 阈值色标（绿 → 黄 → 红） */
const DATA: KGaugeDatum = { name: '服务健康分', value: 82 }
const STOPS: KGaugeStop[] = [
  { value: 0, color: '#2BA471' },
  { value: 0.6, color: '#F7BA1E' },
  { value: 0.8, color: '#F5455C' },
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>阈值色标仪表盘</span>
      <span>stops 三段色标 · 进度弧颜色随数值区间变化 · 健康分 82 落入红色段</span>
    </div>
    <div class="demo-page__block-body" style="height: 300px">
      <KGaugeChart :data="DATA" :stops="STOPS" />
    </div>
  </section>
</template>
