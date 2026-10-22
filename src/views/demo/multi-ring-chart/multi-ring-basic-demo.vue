<script setup lang="ts">
import KMultiRingChart from '@/components/k-multi-ring-chart'
import type { KProgressDatum } from '@/core/types'

/** 演示数据：三个运营指标嵌套成三环（0 = 最外环） */
const DATA: KProgressDatum[] = [
  { name: '活跃率', value: 78, unit: '%' },
  { name: '留存率', value: 56, unit: '%' },
  { name: '转化率', value: 32, unit: '%' },
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>基础多层环</span>
      <span>三环由外向内嵌套 · 12 点方向顺时针扫弧 · 中心综合完成率</span>
    </div>
    <div class="demo-page__block-body" style="height: 320px">
      <KMultiRingChart :data="DATA" />
    </div>
  </section>
</template>
