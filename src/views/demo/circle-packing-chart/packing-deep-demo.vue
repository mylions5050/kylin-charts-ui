<script setup lang="ts">
import KCirclePackingChart from '@/components/k-circle-packing-chart'
import type { KTreeDatum } from '@/core/types'

/** 演示数据：三层深度（集团 → 事业部 → 产品线） */
const DATA: KTreeDatum[] = [
  {
    name: '电商事业部',
    children: [
      {
        name: '交易平台',
        children: [
          { name: '购物车', value: 60 },
          { name: '结算', value: 48 },
          { name: '支付', value: 72 },
        ],
      },
      {
        name: '营销平台',
        children: [
          { name: '优惠券', value: 40 },
          { name: '秒杀', value: 55 },
        ],
      },
    ],
  },
  {
    name: '内容事业部',
    children: [
      {
        name: '社区',
        children: [
          { name: '动态', value: 38 },
          { name: '评论', value: 30 },
        ],
      },
      { name: '短视频', value: 66 },
    ],
  },
  { name: '客服平台', value: 44 },
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>三层深度打包图</span>
      <span>集团 → 事业部 → 产品线 递归聚合 · 透明度随层级递减 · 悬停展示占父级百分比</span>
    </div>
    <div class="demo-page__block-body" style="height: 380px">
      <KCirclePackingChart :data="DATA" />
    </div>
  </section>
</template>
