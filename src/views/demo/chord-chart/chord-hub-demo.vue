<script setup lang="ts">
import KChordChart from '@/components/k-chord-chart'
import type { KChordLink, KChordNode } from '@/core/types'

/** 演示数据：中心平台枢纽（枢纽流量占绝对主导，边缘节点少量互联） */
const NODES: KChordNode[] = [
  { name: '开放平台' },
  { name: '电商 App' },
  { name: '小程序' },
  { name: 'H5 商城' },
  { name: '线下门店' },
  { name: 'ERP 系统' },
  { name: '物流系统' },
  { name: '支付网关' },
]
const LINKS: KChordLink[] = [
  { source: '开放平台', target: '电商 App', value: 85 },
  { source: '开放平台', target: '小程序', value: 78 },
  { source: '开放平台', target: 'H5 商城', value: 42 },
  { source: '开放平台', target: '线下门店', value: 35 },
  { source: '开放平台', target: 'ERP 系统', value: 50 },
  { source: '开放平台', target: '物流系统', value: 46 },
  { source: '开放平台', target: '支付网关', value: 95 },
  { source: '电商 App', target: '支付网关', value: 60 },
  { source: '小程序', target: '支付网关', value: 55 },
  { source: '线下门店', target: 'ERP 系统', value: 20 },
  { source: '物流系统', target: 'ERP 系统', value: 16 },
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>枢纽型和弦图</span>
      <span>中心枢纽流量主导 · 弧长差异悬殊 · 悬停枢纽高亮全部关联弦</span>
    </div>
    <div class="demo-page__block-body" style="height: 360px">
      <KChordChart :nodes="NODES" :links="LINKS" />
    </div>
  </section>
</template>
