<script setup lang="ts">
import KSankeyChart from '@/components/k-sankey-chart'
import type { KSankeyLink, KSankeyNode } from '@/core/types'

/**
 * 演示数据：节点级 / 链路级颜色覆盖
 * - 节点显式指定品牌色板四色
 * - 链路缺省继承源节点色（带透明度），「工资收入 → 储蓄」显式指定链路色
 */
const NODES: KSankeyNode[] = [
  { name: '工资收入', color: '#7C5CFC' },
  { name: '理财收益', color: '#2B6FFF' },
  { name: '副业收入', color: '#B9A5FF' },
  { name: '日常消费', color: '#F5455C' },
  { name: '储蓄账户', color: '#2B6FFF' },
]

const LINKS: KSankeyLink[] = [
  { source: '工资收入', target: '日常消费', value: 450 },
  { source: '工资收入', target: '储蓄账户', value: 350, color: '#B9A5FF' },
  { source: '理财收益', target: '储蓄账户', value: 220 },
  { source: '副业收入', target: '日常消费', value: 120 },
  { source: '副业收入', target: '储蓄账户', value: 30 },
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>颜色定制桑基图</span>
      <span>节点级颜色覆盖 · 链路缺省继承源节点色 · 链路级颜色覆盖</span>
    </div>
    <div class="demo-page__block-body">
      <KSankeyChart :nodes="NODES" :links="LINKS" title="个人收入流向" :height="340" />
    </div>
  </section>
</template>
