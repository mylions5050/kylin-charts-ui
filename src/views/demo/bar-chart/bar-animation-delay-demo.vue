<script setup lang="ts">
import KBarChart from '@/components/k-bar-chart'
import type { KBarSeries } from '@/core/types'

/** 演示数据：12 个月销量，配合逐柱延迟观察错峰生长（参考 ECharts bar-animation-delay 官方示例） */
const LABELS = Array.from({ length: 12 }, (_, i) => `${i + 1}月`)
const SERIES: KBarSeries[] = [{ name: '销量', data: [120, 95, 160, 140, 180, 210, 240, 220, 190, 230, 260, 300] }]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>默认入场</span>
      <span>所有柱子同时生长（animationDelay 缺省 0）</span>
    </div>
    <div class="demo-page__block-body" style="height: 280px">
      <KBarChart :labels="LABELS" :series="SERIES" :height="280" />
    </div>
  </section>

  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>逐柱延迟入场</span>
      <span>animation-delay="90" 每根柱依次错峰生长（单位 ms，也支持传函数按类目下标自定义）</span>
    </div>
    <div class="demo-page__block-body" style="height: 280px">
      <KBarChart :labels="LABELS" :series="SERIES" :animation-delay="90" :height="280" />
    </div>
  </section>
</template>
