<script setup lang="ts">
import KMultiRingChart from '@/components/k-multi-ring-chart'
import type { KProgressDatum } from '@/core/types'

/** 演示数据：双环大环带（band 更粗、间隙更大） */
const DATA: KProgressDatum[] = [
  { name: '已分配', value: 70, unit: 'GB' },
  { name: '已使用', value: 46, unit: 'GB', max: 70 },
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>宽环带</span>
      <span>仅两环时环带自动加粗，ringGap 12 拉开层次</span>
    </div>
    <div class="demo-page__block-body" style="height: 320px">
      <KMultiRingChart :data="DATA" :ring-gap="12" />
    </div>
  </section>
</template>
