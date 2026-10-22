<script setup lang="ts">
import KChordChart from '@/components/k-chord-chart'
import type { KChordLink, KChordNode } from '@/core/types'

/** 演示数据：供应链上下游物料流（节点按角色语义配色） */
const NODES: KChordNode[] = [
  { name: '原材料', color: '#F5A623' },
  { name: '零部件', color: '#F5455C' },
  { name: '整装厂', color: '#2B6FFF' },
  { name: '分销商', color: '#7C5CFC' },
  { name: '零售终端', color: '#00B578' },
]
const LINKS: KChordLink[] = [
  { source: '原材料', target: '零部件', value: 65 },
  { source: '原材料', target: '整装厂', value: 30 },
  { source: '零部件', target: '整装厂', value: 58 },
  { source: '整装厂', target: '分销商', value: 72 },
  { source: '分销商', target: '零售终端', value: 66 },
  { source: '整装厂', target: '零售终端', value: 18 },
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>自定义配色和弦图</span>
      <span>节点按角色语义着色 · 弦继承源端节点色 · 上游 → 下游方向流</span>
    </div>
    <div class="demo-page__block-body" style="height: 320px">
      <KChordChart :nodes="NODES" :links="LINKS" />
    </div>
  </section>
</template>
