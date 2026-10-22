<script setup lang="ts">
import KGraphChart from '@/components/k-graph-chart'
import type { KGraphCategory, KGraphLink, KGraphNode } from '@/core/types'

/** 演示数据：社群信息传播（链路权重跨度大突出线宽差异，类目自定义色） */
const CATEGORIES: KGraphCategory[] = [
  { name: '意见领袖', color: '#7C5CFC' },
  { name: '社群', color: '#2B6FFF' },
  { name: '普通用户', color: '#00C6A2' },
]
const NODES: KGraphNode[] = [
  { name: 'KOL 老白', value: 60, category: 0 },
  { name: 'KOL 阿紫', value: 45, category: 0 },
  { name: '前端群', value: 30, category: 1 },
  { name: '后端群', value: 26, category: 1 },
  { name: '设计群', value: 18, category: 1 },
  { name: '用户小陈', value: 10, category: 2 },
  { name: '用户小何', value: 8, category: 2 },
  { name: '用户小唐', value: 9, category: 2 },
  { name: '用户小周', value: 7, category: 2 },
  { name: '用户小吴', value: 6, category: 2 },
]
const LINKS: KGraphLink[] = [
  { source: 'KOL 老白', target: '前端群', value: 100 },
  { source: 'KOL 老白', target: '后端群', value: 46 },
  { source: 'KOL 阿紫', target: '设计群', value: 38 },
  { source: 'KOL 阿紫', target: '前端群', value: 22 },
  { source: '前端群', target: '用户小陈', value: 14 },
  { source: '前端群', target: '用户小何', value: 9 },
  { source: '后端群', target: '用户小唐', value: 11 },
  { source: '后端群', target: '用户小周', value: 6 },
  { source: '设计群', target: '用户小吴', value: 5 },
  { source: '用户小陈', target: '用户小何', value: 3 },
  { source: '用户小唐', target: '用户小周', value: 2 },
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>样式定制关系图</span>
      <span>类目自定义色 · 链路权重 2 ~ 100 突出线宽梯度 · 大半径跨度</span>
    </div>
    <div class="demo-page__block-body" style="height: 400px">
      <KGraphChart
        :nodes="NODES"
        :links="LINKS"
        :categories="CATEGORIES"
        :node-min="9"
        :node-max="30"
      />
    </div>
  </section>
</template>
