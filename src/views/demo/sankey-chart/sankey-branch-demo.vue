<script setup lang="ts">
import KSankeyChart from '@/components/k-sankey-chart'
import type { KSankeyLink, KSankeyNode } from '@/core/types'

/** 演示数据：一层汇聚 + 一层发散（预算先按部门切分，再按小组二次拆分） */
const NODES: KSankeyNode[] = [
  { name: '年度预算' },
  { name: '研发部' },
  { name: '市场部' },
  { name: '运营部' },
  { name: '行政部' },
  { name: '前端组' },
  { name: '后端组' },
  { name: '广告投放' },
  { name: '市场活动' },
  { name: '客服团队' },
  { name: '内容运营' },
  { name: '综合事务' },
]

const LINKS: KSankeyLink[] = [
  { source: '年度预算', target: '研发部', value: 350 },
  { source: '年度预算', target: '市场部', value: 300 },
  { source: '年度预算', target: '运营部', value: 200 },
  { source: '年度预算', target: '行政部', value: 150 },
  { source: '研发部', target: '前端组', value: 180 },
  { source: '研发部', target: '后端组', value: 170 },
  { source: '市场部', target: '广告投放', value: 200 },
  { source: '市场部', target: '市场活动', value: 100 },
  { source: '运营部', target: '客服团队', value: 120 },
  { source: '运营部', target: '内容运营', value: 80 },
  { source: '行政部', target: '综合事务', value: 150 },
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>汇聚发散桑基图</span>
      <span>一对多切分 + 二次拆分 · 同层多节点等比布局</span>
    </div>
    <div class="demo-page__block-body">
      <KSankeyChart :nodes="NODES" :links="LINKS" title="年度预算分配" :height="440" />
    </div>
  </section>
</template>
