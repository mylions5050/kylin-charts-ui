<script setup lang="ts">
import KParallelChart from '@/components/k-parallel-chart'
import type { KParallelDatum, KParallelDimension } from '@/core/types'

/** 演示数据：6 款手机的硬件参数对比 */
const DIMENSIONS: KParallelDimension[] = [
  { name: '价格 (元)' },
  { name: '屏幕 (寸)' },
  { name: '电池 (mAh)' },
  { name: '重量 (g)' },
]
const DATA: KParallelDatum[] = [
  { name: '旗舰 A', values: [5999, 6.8, 5000, 210] },
  { name: '旗舰 B', values: [6499, 6.7, 4800, 195] },
  { name: '中端 C', values: [2999, 6.5, 5500, 199] },
  { name: '中端 D', values: [2499, 6.4, 5000, 188] },
  { name: '入门 E', values: [1299, 6.2, 4500, 185] },
  { name: '入门 F', values: [999, 6.1, 4000, 180] },
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>基础平行坐标</span>
      <span>四维自动量程 · 品牌色板循环 · 悬停高亮单条并显示各维取值</span>
    </div>
    <div class="demo-page__block-body" style="height: 340px">
      <KParallelChart :dimensions="DIMENSIONS" :data="DATA" />
    </div>
  </section>
</template>
