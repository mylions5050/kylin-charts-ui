<script setup lang="ts">
import KBarChart from '@/components/k-bar-chart'
import type { KBarSeries } from '@/core/types'

/** 演示数据：三渠道占比，堆叠归一化后各柱总高 100% */
const LABELS = ['Q1', 'Q2', 'Q3', 'Q4']
const SERIES: KBarSeries[] = [
  { name: '直营', data: [320, 280, 360, 400], stack: 'total' },
  { name: '分销', data: [180, 240, 200, 220], stack: 'total' },
  { name: '电商', data: [100, 180, 240, 280], stack: 'total' },
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>堆叠归一化</span>
      <span>stackMode='percent' 按类目把堆叠组归一化为百分比，柱高 0~100%，看结构占比不看绝对值</span>
    </div>
    <div class="demo-page__block-body" style="height: 300px">
      <KBarChart :labels="LABELS" :series="SERIES" stack-mode="percent" />
    </div>
  </section>
</template>
