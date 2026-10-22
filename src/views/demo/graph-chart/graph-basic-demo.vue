<script setup lang="ts">
import KGraphChart from '@/components/k-graph-chart'
import type { KGraphCategory, KGraphLink, KGraphNode } from '@/core/types'

/** 演示数据：技术团队协作网络（3 类目，节点 value = 参与项目数） */
const CATEGORIES: KGraphCategory[] = [
  { name: '前端组' },
  { name: '后端组' },
  { name: '产品组' },
]
const NODES: KGraphNode[] = [
  { name: '小林', value: 20, category: 0 },
  { name: '阿哲', value: 16, category: 0 },
  { name: '雯雯', value: 12, category: 0 },
  { name: '小满', value: 7, category: 0 },
  { name: '大鹏', value: 24, category: 1 },
  { name: '老周', value: 18, category: 1 },
  { name: '小凯', value: 10, category: 1 },
  { name: '阿福', value: 8, category: 1 },
  { name: '楠楠', value: 22, category: 2 },
  { name: '一鸣', value: 14, category: 2 },
  { name: '小鹿', value: 10, category: 2 },
  { name: '天宇', value: 6, category: 2 },
]
const LINKS: KGraphLink[] = [
  { source: '小林', target: '大鹏', value: 9 },
  { source: '小林', target: '楠楠', value: 7 },
  { source: '小林', target: '老周', value: 4 },
  { source: '阿哲', target: '大鹏', value: 6 },
  { source: '阿哲', target: '一鸣', value: 5 },
  { source: '雯雯', target: '老周', value: 5 },
  { source: '雯雯', target: '小鹿', value: 3 },
  { source: '小满', target: '阿福', value: 2 },
  { source: '小满', target: '天宇', value: 2 },
  { source: '大鹏', target: '楠楠', value: 8 },
  { source: '老周', target: '一鸣', value: 4 },
  { source: '小凯', target: '楠楠', value: 5 },
  { source: '小凯', target: '小鹿', value: 3 },
  { source: '阿福', target: '天宇', value: 1 },
  { source: '楠楠', target: '一鸣', value: 6 },
  { source: '小鹿', target: '天宇', value: 2 },
  { source: '阿哲', target: '小凯', value: 3 },
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>基础关系图</span>
      <span>技术团队协作网络 · 力导向布局 · 类目配色 · 半径 √value 映射</span>
    </div>
    <div class="demo-page__block-body" style="height: 380px">
      <KGraphChart :nodes="NODES" :links="LINKS" :categories="CATEGORIES" />
    </div>
  </section>
</template>
