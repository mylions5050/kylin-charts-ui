<script setup lang="ts">
import KSankeyChart from '@/components/k-sankey-chart'
import type { KSankeyLink, KSankeyNode } from '@/core/types'

/** 演示数据：三级转化流（渠道 → 行为 → 结果），纵向布局，层从上到下展开 */
const NODES: KSankeyNode[] = [
  { name: '直接访问' },
  { name: '广告投放' },
  { name: '站内访问' },
  { name: '加入购物车' },
  { name: '流失跳出' },
]

const LINKS: KSankeyLink[] = [
  { source: '直接访问', target: '站内访问', value: 400 },
  { source: '广告投放', target: '站内访问', value: 600 },
  { source: '站内访问', target: '加入购物车', value: 350 },
  { source: '站内访问', target: '流失跳出', value: 650 },
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>纵向桑基图</span>
      <span>orient="vertical" · 2-1-2 三层结构 · 节点可拖拽（draggable）· 悬停高亮关联链路（平滑过渡）</span>
    </div>
    <div class="demo-page__block-body">
      <KSankeyChart :nodes="NODES" :links="LINKS" orient="vertical" draggable title="电商访问转化流（纵向）" :height="560" />
    </div>
  </section>
</template>
