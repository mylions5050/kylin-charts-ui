<script setup lang="ts">
import KGraphChart from '@/components/k-graph-chart'
import type { KGraphCategory, KGraphLink, KGraphNode } from '@/core/types'

/** 演示数据：技术生态知识图谱（4 类目、中心枢纽节点、节点权重跨度大） */
const CATEGORIES: KGraphCategory[] = [
  { name: '人物' },
  { name: '技术' },
  { name: '项目' },
  { name: '组织' },
]
const NODES: KGraphNode[] = [
  { name: '阿凯', value: 40, category: 0 },
  { name: '大喵', value: 18, category: 0 },
  { name: '小鹿', value: 12, category: 0 },
  { name: 'Vue3', value: 26, category: 1 },
  { name: 'Node.js', value: 20, category: 1 },
  { name: 'K8s', value: 16, category: 1 },
  { name: '数据中台', value: 24, category: 2 },
  { name: '网关重构', value: 14, category: 2 },
  { name: '监控平台', value: 10, category: 2 },
  { name: '云图科技', value: 30, category: 3 },
  { name: '开源社区', value: 18, category: 3 },
]
const LINKS: KGraphLink[] = [
  { source: '阿凯', target: 'Vue3', value: 9 },
  { source: '阿凯', target: 'Node.js', value: 7 },
  { source: '阿凯', target: 'K8s', value: 5 },
  { source: '阿凯', target: '数据中台', value: 8 },
  { source: '阿凯', target: '网关重构', value: 6 },
  { source: '阿凯', target: '云图科技', value: 10 },
  { source: '大喵', target: 'Vue3', value: 4 },
  { source: '大喵', target: '监控平台', value: 5 },
  { source: '大喵', target: '云图科技', value: 6 },
  { source: '小鹿', target: 'Node.js', value: 3 },
  { source: '小鹿', target: '开源社区', value: 4 },
  { source: 'Vue3', target: '开源社区', value: 7 },
  { source: 'Node.js', target: '开源社区', value: 5 },
  { source: 'K8s', target: '云图科技', value: 4 },
  { source: '数据中台', target: '云图科技', value: 8 },
  { source: '网关重构', target: 'K8s', value: 3 },
  { source: '监控平台', target: 'K8s', value: 4 },
  { source: '开源社区', target: '云图科技', value: 5 },
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>多类目知识图谱</span>
      <span>4 类目分组配色 · 枢纽节点辐射 · node-min / node-max 半径跨度</span>
    </div>
    <div class="demo-page__block-body" style="height: 400px">
      <KGraphChart
        :nodes="NODES"
        :links="LINKS"
        :categories="CATEGORIES"
        :node-min="7"
        :node-max="24"
      />
    </div>
  </section>
</template>
