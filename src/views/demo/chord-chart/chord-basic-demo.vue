<script setup lang="ts">
import KChordChart from '@/components/k-chord-chart'
import type { KChordLink, KChordNode } from '@/core/types'

/** 演示数据：六个部门之间的跨团队协作频次（季度） */
const NODES: KChordNode[] = [
  { name: '产品' },
  { name: '研发' },
  { name: '设计' },
  { name: '测试' },
  { name: '运营' },
  { name: '市场' },
]
const LINKS: KChordLink[] = [
  { source: '产品', target: '研发', value: 48 },
  { source: '产品', target: '设计', value: 26 },
  { source: '产品', target: '运营', value: 18 },
  { source: '研发', target: '测试', value: 40 },
  { source: '研发', target: '设计', value: 14 },
  { source: '研发', target: '运营', value: 9 },
  { source: '设计', target: '测试', value: 8 },
  { source: '设计', target: '市场', value: 6 },
  { source: '测试', target: '运营', value: 11 },
  { source: '运营', target: '市场', value: 22 },
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>基础和弦图</span>
      <span>部门协作频次 · 弧长按流量自动分配 · 弦宽随流量缩放</span>
    </div>
    <div class="demo-page__block-body" style="height: 340px">
      <KChordChart :nodes="NODES" :links="LINKS" />
    </div>
  </section>
</template>
