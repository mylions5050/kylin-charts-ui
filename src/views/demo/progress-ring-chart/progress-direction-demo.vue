<script setup lang="ts">
import KProgressRingChart from '@/components/k-progress-ring-chart'
import type { KProgressDatum } from '@/core/types'

/** 演示数据：同值进度对照扫描方向 */
const DATA: KProgressDatum = { name: '学习进度', value: 70, unit: '%' }
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>顺时针（默认）</span>
      <span>进度弧从 12 点方向向右顺时针扫描（clockwise 缺省 true）</span>
    </div>
    <div class="demo-page__block-body" style="height: 260px">
      <KProgressRingChart :data="DATA" :height="260" />
    </div>
  </section>

  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>逆时针</span>
      <span>:clockwise="false" 进度弧从 12 点方向向左逆时针扫描</span>
    </div>
    <div class="demo-page__block-body" style="height: 260px">
      <KProgressRingChart :data="DATA" :clockwise="false" :height="260" />
    </div>
  </section>
</template>
