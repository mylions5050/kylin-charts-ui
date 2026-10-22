<script setup lang="ts">
import KParallelChart from '@/components/k-parallel-chart'
import type { KParallelDatum, KParallelDimension } from '@/core/types'

/** 演示数据：手动指定维度值域（续航满分 6000、价格从 0 起算） */
const DIMENSIONS: KParallelDimension[] = [
  { name: '价格 (元)', min: 0, max: 8000 },
  { name: '屏幕 (寸)', min: 6.0, max: 7.0 },
  { name: '电池 (mAh)', min: 0, max: 6000 },
  { name: '性能跑分 (万)', min: 0, max: 220 },
]
const DATA: KParallelDatum[] = [
  { name: '性能怪兽', values: [6299, 6.8, 4900, 205] },
  { name: '均衡水桶', values: [3999, 6.6, 5400, 150] },
  { name: '续航长跑', values: [2799, 6.5, 5800, 92] },
  { name: '极致性价比', values: [1699, 6.4, 5100, 86] },
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>指定值域平行坐标</span>
      <span>dimensions 手动 min / max · 刻度不再随数据波动 · 便于横向对比</span>
    </div>
    <div class="demo-page__block-body" style="height: 340px">
      <KParallelChart :dimensions="DIMENSIONS" :data="DATA" />
    </div>
  </section>
</template>
