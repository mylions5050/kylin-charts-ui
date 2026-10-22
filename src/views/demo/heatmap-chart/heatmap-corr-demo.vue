<script setup lang="ts">
import KHeatmapChart from '@/components/k-heatmap-chart'
import type { KHeatmapDatum } from '@/core/types'

/** 演示数据：六项业务指标的相关性矩阵（对称，对角线为 1，取值 -1 ~ 1） */
const VARS = ['价格', '销量', '广告', '口碑', '库存', '利润']
// 上三角相关系数 [i, j, r]，含对角线自动补 1，镜像对称生成
const PAIRS: [number, number, number][] = [
  [0, 1, -0.72],
  [0, 2, 0.15],
  [0, 3, -0.35],
  [0, 4, 0.24],
  [0, 5, 0.38],
  [1, 2, 0.68],
  [1, 3, 0.55],
  [1, 4, -0.42],
  [1, 5, 0.74],
  [2, 3, 0.3],
  [2, 4, -0.18],
  [2, 5, 0.52],
  [3, 4, -0.28],
  [3, 5, 0.61],
  [4, 5, -0.33],
]

const DATA: KHeatmapDatum[] = PAIRS.flatMap(([i, j, v]) => [
  [i, j, v] as KHeatmapDatum,
  [j, i, v] as KHeatmapDatum,
])
VARS.forEach((_, i) => DATA.push([i, i, 1]))
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>相关性矩阵热力图</span>
      <span>对称矩阵 · 发散色标（蓝负相关 → 白不相关 → 红正相关）</span>
    </div>
    <div class="demo-page__block-body" style="height: 320px">
      <KHeatmapChart
        :rows="VARS"
        :columns="VARS"
        :data="DATA"
        :color-stops="['#2B6FFF', '#FFFFFF', '#F5455C']"
        :min="-1"
        :max="1"
        :cell-gap="1"
      />
    </div>
  </section>
</template>
