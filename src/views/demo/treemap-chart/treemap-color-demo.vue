<script setup lang="ts">
import KTreemapChart from '@/components/k-treemap-chart'
import type { KTreeDatum } from '@/core/types'

/** 演示数据：部门年度预算（分支级颜色覆盖：超支部门标红、达标标绿） */
const DATA: KTreeDatum[] = [
  {
    name: '研发部',
    color: '#2B6FFF',
    children: [
      { name: '人力', value: 420 },
      { name: '设备', value: 260 },
      { name: '云资源', value: 180 },
    ],
  },
  {
    name: '市场部',
    color: '#F5455C',
    children: [
      { name: '广告投放', value: 380 },
      { name: '活动执行', value: 220 },
    ],
  },
  {
    name: '运营部',
    color: '#00B578',
    children: [
      { name: '客服', value: 160 },
      { name: '内容', value: 140 },
      { name: '工具', value: 80 },
    ],
  },
  { name: '行政部', color: '#7C5CFC', value: 130 },
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>自定义配色矩阵树图</span>
      <span>分支级 color 覆盖 · 单节点叶根（行政部）· 语义色区分状态</span>
    </div>
    <div class="demo-page__block-body" style="height: 300px">
      <KTreemapChart :data="DATA" :gap="2" />
    </div>
  </section>
</template>
