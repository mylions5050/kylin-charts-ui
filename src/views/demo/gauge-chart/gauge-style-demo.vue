<script setup lang="ts">
import KGaugeChart from '@/components/k-gauge-chart'
import type { KGaugeDatum } from '@/core/types'

/** 演示数据：半圆造型 + 自定义轴带与刻度 */
const DATA: KGaugeDatum = { name: '内存占用', value: 68, unit: '%' }
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>自定义样式仪表盘</span>
      <span>半圆 180°~0° · axisWidth 22 加粗轴带 · tickCount 4 稀疏刻度 · radiusRatio 0.66</span>
    </div>
    <div class="demo-page__block-body" style="height: 280px">
      <KGaugeChart
        :data="DATA"
        :start-angle="180"
        :end-angle="0"
        :axis-width="22"
        :tick-count="4"
        :radius-ratio="0.66"
      />
    </div>
  </section>
</template>
