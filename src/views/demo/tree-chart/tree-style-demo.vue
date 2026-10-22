<script setup lang="ts">
import KTreeChart from '@/components/k-tree-chart'
import type { KTreeDatum } from '@/core/types'

/** 演示数据：自定义节点半径 / 层间距 / 叶距 / 分支颜色覆盖（告警分支标红） */
const DATA: KTreeDatum[] = [
  {
    name: '服务监控',
    children: [
      {
        name: '网关',
        children: [
          { name: '限流', value: 96 },
          { name: '路由', value: 88 },
        ],
      },
      {
        name: '告警',
        color: '#F5455C',
        children: [
          { name: 'CPU 飙升', value: 62 },
          { name: '超时增多', value: 41 },
          { name: '错误率上涨', value: 23 },
        ],
      },
      {
        name: '数据库',
        children: [
          { name: '慢查询', value: 75 },
          { name: '连接池', value: 90 },
        ],
      },
    ],
  },
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>样式定制树图</span>
      <span>nodeRadius=9 · levelGap=150 · nodeGap=32 · color 分支级颜色覆盖</span>
    </div>
    <div class="demo-page__block-body" style="height: 300px">
      <KTreeChart :data="DATA" :node-radius="9" :level-gap="150" :node-gap="32" />
    </div>
  </section>
</template>
