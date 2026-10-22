<script setup lang="ts">
import KSankeyChart from '@/components/k-sankey-chart'
import type { KSankeyLink, KSankeyNode } from '@/core/types'

/** 演示数据：三级转化流（渠道 → 行为 → 结果） */
const NODES: KSankeyNode[] = [
  { name: '直接访问' },
  { name: '搜索引擎' },
  { name: '社交媒体' },
  { name: '品牌广告' },
  { name: '首页浏览' },
  { name: '商品详情' },
  { name: '会员中心' },
  { name: '流失跳出' },
  { name: '提交订单' },
  { name: '流失收藏' },
  { name: '支付成功' },
]

const LINKS: KSankeyLink[] = [
  { source: '直接访问', target: '首页浏览', value: 300 },
  { source: '搜索引擎', target: '首页浏览', value: 520 },
  { source: '社交媒体', target: '首页浏览', value: 260 },
  { source: '品牌广告', target: '首页浏览', value: 180 },
  { source: '首页浏览', target: '商品详情', value: 820 },
  { source: '首页浏览', target: '会员中心', value: 240 },
  { source: '首页浏览', target: '流失跳出', value: 200 },
  { source: '商品详情', target: '提交订单', value: 430 },
  { source: '商品详情', target: '流失收藏', value: 390 },
  { source: '会员中心', target: '提交订单', value: 180 },
  { source: '提交订单', target: '支付成功', value: 520 },
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>基础桑基图</span>
      <span>三级转化流 · 自动分层 + 重心排序 · 悬停高亮 · 节点可拖拽（draggable）</span>
    </div>
    <div class="demo-page__block-body">
      <KSankeyChart :nodes="NODES" :links="LINKS" draggable title="电商访问转化流" :height="420" />
    </div>
  </section>
</template>
