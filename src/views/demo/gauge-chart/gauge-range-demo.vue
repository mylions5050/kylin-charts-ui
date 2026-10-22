<script setup lang="ts">
import KGaugeChart from '@/components/k-gauge-chart'
import type { KGaugeDatum } from '@/core/types'

/** 演示数据：冷库温度，负量程 -20 ~ 40 ℃ */
const DATA: KGaugeDatum = { name: '冷库温度', value: 18, min: -20, max: 40, unit: '℃' }
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>负量程仪表盘</span>
      <span>min / max 自定义量程 · 指针按 -20~40 区间映射角度 · 中心显示单位</span>
    </div>
    <div class="demo-page__block-body" style="height: 300px">
      <KGaugeChart :data="DATA" />
    </div>
  </section>
</template>
