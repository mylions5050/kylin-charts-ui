<script setup lang="ts">
import KHeatmapChart from '@/components/k-heatmap-chart'
import type { KHeatmapDatum } from '@/core/types'

/** 矩阵 → [列索引, 行索引, 数值] 列表 */
const toData = (matrix: number[][]): KHeatmapDatum[] =>
  matrix.flatMap((row, r) => row.map((v, c) => [c, r, v] as KHeatmapDatum))

/** 演示数据：五城市上半年月均气温（℃），冷蓝 → 暖红的双向色标 */
const ROWS = ['哈尔滨', '北京', '上海', '广州', '成都']
const COLUMNS = ['1月', '2月', '3月', '4月', '5月', '6月']
const DATA = toData([
  [-18, -12, -2, 8, 16, 22],
  [-4, 0, 8, 16, 22, 27],
  [4, 6, 11, 17, 22, 26],
  [14, 16, 20, 24, 28, 30],
  [6, 9, 14, 19, 23, 26],
])
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>自定义色标热力图</span>
      <span>多段渐变（蓝 → 黄 → 红）· 温度场可视化 · colorStops 覆盖默认配色</span>
    </div>
    <div class="demo-page__block-body" style="height: 300px">
      <KHeatmapChart :rows="ROWS" :columns="COLUMNS" :data="DATA" :color-stops="['#2B6FFF', '#FADF63', '#F5455C']" />
    </div>
  </section>
</template>
