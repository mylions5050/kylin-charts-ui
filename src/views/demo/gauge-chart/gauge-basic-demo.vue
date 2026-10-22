<script setup lang="ts">
import KGaugeChart from '@/components/k-gauge-chart'
import type { KGaugeDatum } from '@/core/types'

/** 演示数据：项目完成率 */
const DATA: KGaugeDatum = { name: '项目完成率', value: 76, unit: '%' }
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>基础仪表盘</span>
      <span>默认 220° ~ -40° 扫角 · 品牌紫进度弧 · 指针 + 中心数值 · 刻度自动标注</span>
    </div>
    <div class="demo-page__block-body" style="height: 300px">
      <KGaugeChart :data="DATA" />
    </div>
  </section>
</template>
