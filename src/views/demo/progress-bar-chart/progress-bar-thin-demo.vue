<script setup lang="ts">
import KProgressBarChart from '@/components/k-progress-bar-chart'
import type { KProgressBarDatum } from '@/core/types'

/** 演示数据：细条 + 紧凑行距 */
const DATA: KProgressBarDatum[] = [
  { name: '需求评审', value: 100, unit: '%' },
  { name: '接口联调', value: 76, unit: '%' },
  { name: '页面自测', value: 48, unit: '%' },
  { name: '回归测试', value: 12, unit: '%' },
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>细条样式</span>
      <span>barHeight 10px 细条 + labelWidth 120 名称列，适合密集行</span>
    </div>
    <div class="demo-page__block-body" style="height: 200px">
      <KProgressBarChart :data="DATA" :bar-height="10" :label-width="120" />
    </div>
  </section>
</template>
