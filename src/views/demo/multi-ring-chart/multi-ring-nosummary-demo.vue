<script setup lang="ts">
import KMultiRingChart from '@/components/k-multi-ring-chart'
import type { KProgressDatum } from '@/core/types'

/** 演示数据：关闭中心汇总，纯环展示 */
const DATA: KProgressDatum[] = [
  { name: '年度 KPI', value: 92, unit: '%' },
  { name: '季度 KPI', value: 68, unit: '%' },
  { name: '月度 KPI', value: 74, unit: '%' },
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>隐藏汇总</span>
      <span>showSummary=false 关闭中心综合完成率，各环数值走 tooltip</span>
    </div>
    <div class="demo-page__block-body" style="height: 320px">
      <KMultiRingChart :data="DATA" :show-summary="false" />
    </div>
  </section>
</template>
