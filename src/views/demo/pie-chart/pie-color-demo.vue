<script setup lang="ts">
import KPieChart from '@/components/k-pie-chart'
import type { KPieDatum } from '@/core/types'

/** 演示数据：点级颜色覆盖 + 起始角旋转 */
const MARKED: KPieDatum[] = [
  { name: '总部', value: 420 },
  { name: '华东', value: 260, color: '#B9A5FF' },
  { name: '华南', value: 180 },
  { name: '西南', value: 90, color: '#F5455C' },
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>点级颜色与起始角</span>
      <span>点级颜色覆盖 · startAngle 从 3 点方向起始 · 关闭标签</span>
    </div>
    <div class="demo-page__block-body">
      <KPieChart :data="MARKED" :start-angle="90" :label="false" legend :height="320" />
    </div>
  </section>
</template>
