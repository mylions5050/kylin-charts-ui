<script setup lang="ts">
import KParallelChart from '@/components/k-parallel-chart'
import type { KParallelDatum, KParallelDimension } from '@/core/types'

/** 演示数据：18 条传感器记录的压力场景（细线） */
const DIMENSIONS: KParallelDimension[] = [
  { name: '温度 (℃)' },
  { name: '湿度 (%)' },
  { name: 'PM2.5' },
  { name: '噪声 (dB)' },
]
const DATA: KParallelDatum[] = Array.from({ length: 18 }, (_, i) => ({
  name: `测点 ${i + 1}`,
  values: [
    14 + ((i * 37) % 22),
    35 + ((i * 53) % 45),
    12 + ((i * 89) % 70),
    38 + ((i * 71) % 30),
  ],
}))
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>多条细线平行坐标</span>
      <span>18 条记录 lineWidth 1.2 · 观察密集线束下的悬停命中精度</span>
    </div>
    <div class="demo-page__block-body" style="height: 340px">
      <KParallelChart :dimensions="DIMENSIONS" :data="DATA" :line-width="1.2" />
    </div>
  </section>
</template>
