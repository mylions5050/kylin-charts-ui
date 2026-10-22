<script setup lang="ts">
import KProgressRingChart from '@/components/k-progress-ring-chart'
import type { KProgressDatum } from '@/core/types'

/** 演示数据：项目完成率 */
const DATA: KProgressDatum = { name: '项目完成率', value: 76 }
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>基础进度环</span>
      <span>12 点方向顺时针扫弧 · 中心大百分比 + 数值/上限 · 品牌紫进度</span>
    </div>
    <div class="demo-page__block-body" style="height: 300px">
      <KProgressRingChart :data="DATA" />
    </div>
  </section>
</template>
