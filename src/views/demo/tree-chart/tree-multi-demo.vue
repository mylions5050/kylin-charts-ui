<script setup lang="ts">
import KTreeChart from '@/components/k-tree-chart'
import type { KTreeDatum } from '@/core/types'

/** 演示数据：两棵独立子系统（多根森林，各占一个色板色） */
const DATA: KTreeDatum[] = [
  {
    name: '用户中心',
    children: [
      { name: '账号', children: [{ name: '注册' }, { name: '登录' }] },
      { name: '资料', children: [{ name: '实名' }, { name: '头像' }] },
    ],
  },
  {
    name: '订单中心',
    children: [
      { name: '交易', children: [{ name: '下单' }, { name: '支付' }, { name: '退款' }] },
      { name: '履约', children: [{ name: '发货' }, { name: '签收' }] },
    ],
  },
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>多根森林树图</span>
      <span>顶层多项并排布局 · 每棵树独立取色板色 · 子级继承降透明度</span>
    </div>
    <div class="demo-page__block-body" style="height: 300px">
      <KTreeChart :data="DATA" />
    </div>
  </section>
</template>
