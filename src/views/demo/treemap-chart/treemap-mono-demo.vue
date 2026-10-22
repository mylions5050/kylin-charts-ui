<script setup lang="ts">
import KTreemapChart from '@/components/k-treemap-chart'
import type { KTreeDatum } from '@/core/types'

/** 演示数据：服务器集群资源占用（单色系深浅表达分支层级，gap 加大白缝风格） */
const DATA: KTreeDatum[] = [
  {
    name: '在线集群',
    color: '#7C5CFC',
    children: [
      { name: '网关 ×12', value: 240 },
      { name: '业务 ×46', value: 860 },
      { name: '缓存 ×20', value: 320 },
    ],
  },
  {
    name: '大数据集群',
    color: '#2B6FFF',
    children: [
      { name: '计算 ×36', value: 540 },
      { name: '存储 ×28', value: 460 },
    ],
  },
  {
    name: '测试集群',
    color: '#F5455C',
    children: [
      { name: '回归 ×8', value: 150 },
      { name: '压测 ×4', value: 90 },
    ],
  },
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>单色系矩阵树图</span>
      <span>集群维度单色 + 子级透明度衰减 · gap=4 白缝分组视觉</span>
    </div>
    <div class="demo-page__block-body" style="height: 300px">
      <KTreemapChart :data="DATA" :gap="4" />
    </div>
  </section>
</template>
