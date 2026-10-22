<script setup lang="ts">
import KBulletChart from '@/components/k-bullet-chart'
import type { KBulletDatum } from '@/core/types'

/** 演示数据：不传 target，仅分段量程 + 实际值 */
const DATA: KBulletDatum[] = [
  { name: '带宽占用', value: 640, ranges: [500, 800], unit: 'Mbps' },
  { name: '存储占用', value: 1.8, ranges: [2, 4], unit: 'TB' },
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>无目标线</span>
      <span>target 缺省时不画竖线，仅展示实际值相对分段量程的位置</span>
    </div>
    <div class="demo-page__block-body" style="height: 170px">
      <KBulletChart :data="DATA" />
    </div>
  </section>
</template>
