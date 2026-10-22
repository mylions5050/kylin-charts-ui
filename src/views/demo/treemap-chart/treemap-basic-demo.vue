<script setup lang="ts">
import KTreemapChart from '@/components/k-treemap-chart'
import type { KTreeDatum } from '@/core/types'

/** 演示数据：电商平台销售额品类分布（2 层，单位万元） */
const DATA: KTreeDatum[] = [
  {
    name: '数码家电',
    children: [
      { name: '手机', value: 860 },
      { name: '笔记本', value: 540 },
      { name: '智能穿戴', value: 320 },
      { name: '平板', value: 260 },
    ],
  },
  {
    name: '服饰鞋包',
    children: [
      { name: '女装', value: 620 },
      { name: '男装', value: 380 },
      { name: '箱包', value: 210 },
    ],
  },
  {
    name: '食品生鲜',
    children: [
      { name: '水果', value: 340 },
      { name: '零食', value: 280 },
      { name: '粮油', value: 190 },
    ],
  },
  {
    name: '美妆个护',
    children: [
      { name: '护肤', value: 450 },
      { name: '彩妆', value: 310 },
    ],
  },
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>基础矩阵树图</span>
      <span>品类销售额两层分布 · squarified 布局面积 ∝ 数值 · 悬停 Tooltip</span>
    </div>
    <div class="demo-page__block-body" style="height: 320px">
      <KTreemapChart :data="DATA" />
    </div>
  </section>
</template>
