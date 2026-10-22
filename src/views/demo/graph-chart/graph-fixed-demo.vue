<script setup lang="ts">
import KGraphChart from '@/components/k-graph-chart'
import type { KGraphLink, KGraphNode } from '@/core/types'

/**
 * 演示数据：星型接入拓扑（layout none，节点用 x / y 固定坐标）
 * 坐标为容器内像素（相对绘图区，含内边距前），缺省居中
 */
const NODES: KGraphNode[] = [
  { name: 'API 网关', value: 50, x: 420, y: 170, color: '#7C5CFC' },
  { name: 'Web 端', value: 22, x: 200, y: 60 },
  { name: 'App 端', value: 26, x: 200, y: 280 },
  { name: '小程序', value: 30, x: 420, y: 40 },
  { name: '开放平台', value: 16, x: 640, y: 60 },
  { name: '内部系统', value: 12, x: 640, y: 280 },
  { name: '合作伙伴', value: 9, x: 420, y: 300 },
]
const LINKS: KGraphLink[] = [
  { source: 'Web 端', target: 'API 网关', value: 20 },
  { source: 'App 端', target: 'API 网关', value: 24 },
  { source: '小程序', target: 'API 网关', value: 28 },
  { source: 'API 网关', target: '开放平台', value: 10 },
  { source: 'API 网关', target: '内部系统', value: 8 },
  { source: '合作伙伴', target: 'API 网关', value: 6 },
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>固定坐标关系图</span>
      <span>星型接入拓扑 · layout none · 节点 x / y 定位 · 单点自定义色</span>
    </div>
    <div class="demo-page__block-body" style="height: 360px">
      <KGraphChart :nodes="NODES" :links="LINKS" layout="none" />
    </div>
  </section>
</template>
