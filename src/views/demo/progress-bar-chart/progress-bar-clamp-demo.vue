<script setup lang="ts">
import KProgressBarChart from '@/components/k-progress-bar-chart'
import type { KProgressBarDatum } from '@/core/types'

/** 演示数据：value 超过 max 时按 max 截断（满格封顶） */
const DATA: KProgressBarDatum[] = [
  { name: '超额任务 A', value: 128, max: 100, unit: '%' },
  { name: '正常任务 B', value: 66, max: 100, unit: '%' },
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>量程封顶</span>
      <span>value 超出 max 自动 clamp 到 100%，数值列仍展示原值</span>
    </div>
    <div class="demo-page__block-body" style="height: 140px">
      <KProgressBarChart :data="DATA" />
    </div>
  </section>
</template>
