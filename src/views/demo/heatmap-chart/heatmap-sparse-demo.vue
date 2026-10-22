<script setup lang="ts">
import KHeatmapChart from '@/components/k-heatmap-chart'
import type { KHeatmapDatum } from '@/core/types'

/** 矩阵 → [列索引, 行索引, 数值] 列表（null 跳过，形成稀疏留白） */
const toData = (matrix: (number | null)[][]): KHeatmapDatum[] =>
  matrix.flatMap((row, r) => row.flatMap((v, c) => (v === null ? [] : [[c, r, v] as KHeatmapDatum])))

/** 演示数据：成员 × 任务的进度（%），未参与的组合留白（缺失单元格不绘制） */
const ROWS = ['张伟', '李娜', '王强', '刘洋', '陈晨']
const COLUMNS = ['需求分析', '原型设计', '前端开发', '后端开发', '测试验收', '部署上线']
const DATA = toData([
  [100, 100, 86, null, null, 64],
  [100, 92, null, 78, null, null],
  [null, null, 95, 100, 88, 70],
  [100, 85, null, null, 92, 100],
  [null, 100, 74, 81, null, null],
])
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>稀疏热力图</span>
      <span>缺失组合留白不绘制 · 适合人员分工 / 完课率等非全量矩阵</span>
    </div>
    <div class="demo-page__block-body" style="height: 300px">
      <KHeatmapChart :rows="ROWS" :columns="COLUMNS" :data="DATA" />
    </div>
  </section>
</template>
