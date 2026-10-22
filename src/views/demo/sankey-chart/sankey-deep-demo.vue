<script setup lang="ts">
import KSankeyChart from '@/components/k-sankey-chart'
import type { KSankeyLink, KSankeyNode } from '@/core/types'

/** 演示数据：五层深度归因流（深层链路 + 中途发散） */
const NODES: KSankeyNode[] = [
  { name: '信息流广告' },
  { name: '搜索关键词' },
  { name: '应用商店' },
  { name: 'App 激活' },
  { name: '沉默用户' },
  { name: '完成注册' },
  { name: '注册流失' },
  { name: '试用核心功能' },
  { name: '试用流失' },
  { name: '付费转化' },
  { name: '到期续费' },
]

const LINKS: KSankeyLink[] = [
  { source: '信息流广告', target: 'App 激活', value: 480 },
  { source: '搜索关键词', target: 'App 激活', value: 380 },
  { source: '应用商店', target: 'App 激活', value: 260 },
  { source: 'App 激活', target: '完成注册', value: 640 },
  { source: 'App 激活', target: '沉默用户', value: 480 },
  { source: '完成注册', target: '试用核心功能', value: 420 },
  { source: '完成注册', target: '注册流失', value: 220 },
  { source: '试用核心功能', target: '付费转化', value: 260 },
  { source: '试用核心功能', target: '试用流失', value: 160 },
  { source: '付费转化', target: '到期续费', value: 180 },
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>深层归因桑基图</span>
      <span>五层链路 · 每层发散分支 · 悬停链路高亮两端节点</span>
    </div>
    <div class="demo-page__block-body">
      <KSankeyChart :nodes="NODES" :links="LINKS" title="渠道归因全链路" :height="440" />
    </div>
  </section>
</template>
