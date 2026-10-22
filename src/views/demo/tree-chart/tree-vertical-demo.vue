<script setup lang="ts">
import KTreeChart from '@/components/k-tree-chart'
import type { KTreeDatum } from '@/core/types'

/** 演示数据：产品分类树（纵向自上而下生长） */
const DATA: KTreeDatum[] = [
  {
    name: '全品类',
    children: [
      {
        name: '数码家电',
        children: [
          { name: '手机', value: 420 },
          { name: '笔记本', value: 260 },
          { name: '智能穿戴', value: 180 },
        ],
      },
      {
        name: '家居生活',
        children: [
          { name: '厨具', value: 150 },
          { name: '家纺', value: 120 },
        ],
      },
      {
        name: '食品生鲜',
        children: [
          { name: '水果', value: 210 },
          { name: '零食', value: 190 },
        ],
      },
    ],
  },
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>纵向树图</span>
      <span>自上而下生长 · orient="vertical" · 分支标签上置 / 叶标签下置</span>
    </div>
    <div class="demo-page__block-body" style="height: 340px">
      <KTreeChart :data="DATA" orient="vertical" />
    </div>
  </section>
</template>
