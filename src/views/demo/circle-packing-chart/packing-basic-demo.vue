<script setup lang="ts">
import KCirclePackingChart from '@/components/k-circle-packing-chart'
import type { KTreeDatum } from '@/core/types'

/** 演示数据：三大事业部的项目人力分布（两层） */
const DATA: KTreeDatum[] = [
  {
    name: '前端组',
    children: [
      { name: '组件库', value: 120 },
      { name: '官网', value: 80 },
      { name: '运营后台', value: 65 },
    ],
  },
  {
    name: '后端组',
    children: [
      { name: '网关', value: 95 },
      { name: '订单服务', value: 110 },
      { name: '结算服务', value: 70 },
    ],
  },
  {
    name: '数据组',
    children: [
      { name: '报表平台', value: 55 },
      { name: '数仓', value: 88 },
    ],
  },
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>基础打包图</span>
      <span>两层嵌套 · 圆面积 ∝ value · 父圆聚合子圆 · 子级继承父色随层级降透明</span>
    </div>
    <div class="demo-page__block-body" style="height: 360px">
      <KCirclePackingChart :data="DATA" />
    </div>
  </section>
</template>
