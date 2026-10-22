<script setup lang="ts">
import KHeatmapChart from '@/components/k-heatmap-chart'
import type { KHeatmapDatum } from '@/core/types'

/** 矩阵 → [列索引, 行索引, 数值] 列表（null 跳过，形成稀疏留白） */
const toData = (matrix: (number | null)[][]): KHeatmapDatum[] =>
  matrix.flatMap((row, r) => row.flatMap((v, c) => (v === null ? [] : [[c, r, v] as KHeatmapDatum])))

/** 演示数据：一周 × 时段 的站点访问量 */
const ROWS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
const COLUMNS = ['凌晨', '早晨', '上午', '中午', '下午', '晚上']
const DATA = toData([
  [12, 45, 82, 76, 88, 95],
  [15, 52, 90, 81, 92, 88],
  [14, 48, 85, 79, 90, 102],
  [18, 55, 95, 88, 96, 110],
  [20, 60, 98, 92, 85, 118],
  [35, 72, 105, 98, 112, 126],
  [42, 80, 115, 108, 120, 98],
])
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>基础热力图</span>
      <span>周 × 时段网格 · 默认品牌蓝渐变 · 数值标签自动对比色 · 悬停高亮</span>
    </div>
    <div class="demo-page__block-body" style="height: 320px">
      <KHeatmapChart :rows="ROWS" :columns="COLUMNS" :data="DATA" />
    </div>
  </section>
</template>
