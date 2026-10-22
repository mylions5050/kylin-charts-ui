<script setup lang="ts">
import KGraphChart from '@/components/k-graph-chart'
import type { KGraphLink, KGraphNode } from '@/core/types'

/** 演示数据：微服务调用依赖（环形布局，value = 日均调用次数 / 千次） */
const NODES: KGraphNode[] = [
  { name: 'API 网关', value: 40 },
  { name: '用户服务', value: 26 },
  { name: '订单服务', value: 32 },
  { name: '商品服务', value: 28 },
  { name: '库存服务', value: 18 },
  { name: '支付服务', value: 22 },
  { name: '消息中心', value: 14 },
  { name: '日志服务', value: 10 },
  { name: '配置中心', value: 8 },
  { name: '调度中心', value: 12 },
]
const LINKS: KGraphLink[] = [
  { source: 'API 网关', target: '用户服务', value: 30 },
  { source: 'API 网关', target: '订单服务', value: 26 },
  { source: 'API 网关', target: '商品服务', value: 24 },
  { source: '订单服务', target: '库存服务', value: 16 },
  { source: '订单服务', target: '支付服务', value: 18 },
  { source: '订单服务', target: '消息中心', value: 8 },
  { source: '支付服务', target: '消息中心', value: 10 },
  { source: '库存服务', target: '商品服务', value: 12 },
  { source: '用户服务', target: '消息中心', value: 6 },
  { source: '调度中心', target: '配置中心', value: 5 },
  { source: '调度中心', target: '日志服务', value: 7 },
  { source: '消息中心', target: '日志服务', value: 9 },
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>环形布局关系图</span>
      <span>微服务调用依赖 · layout circular · 链路横穿圆心</span>
    </div>
    <div class="demo-page__block-body" style="height: 380px">
      <KGraphChart :nodes="NODES" :links="LINKS" layout="circular" />
    </div>
  </section>
</template>
