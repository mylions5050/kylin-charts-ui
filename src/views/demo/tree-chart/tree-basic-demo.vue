<script setup lang="ts">
import KTreeChart from '@/components/k-tree-chart'
import type { KTreeDatum } from '@/core/types'

/** 演示数据：公司组织架构（3 层，叶节点带人数，父节点自动汇总） */
const DATA: KTreeDatum[] = [
  {
    name: '云岭科技',
    children: [
      {
        name: '研发中心',
        children: [
          { name: '后端组', value: 32 },
          { name: '前端组', value: 24 },
          { name: '测试组', value: 15 },
        ],
      },
      {
        name: '产品中心',
        children: [
          { name: '产品组', value: 12 },
          { name: '设计组', value: 9 },
        ],
      },
      {
        name: '市场中心',
        children: [
          { name: '品牌组', value: 8 },
          { name: '渠道组', value: 14 },
        ],
      },
    ],
  },
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>横向树图</span>
      <span>组织架构 3 层 · 平滑贝塞尔连线 · 父节点数值自动汇总 · 悬停 Tooltip</span>
    </div>
    <div class="demo-page__block-body" style="height: 320px">
      <KTreeChart :data="DATA" />
    </div>
  </section>
</template>
