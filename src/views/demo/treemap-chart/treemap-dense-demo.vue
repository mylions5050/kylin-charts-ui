<script setup lang="ts">
import KTreemapChart from '@/components/k-treemap-chart'
import type { KTreeDatum } from '@/core/types'

/** 演示数据：App 功能模块日活（18 个叶子，小矩形标签自动跳过） */
const DATA: KTreeDatum[] = [
  {
    name: '核心交易',
    children: [
      { name: '首页推荐', value: 920 },
      { name: '搜索', value: 610 },
      { name: '购物车', value: 380 },
      { name: '下单', value: 350 },
      { name: '订单列表', value: 290 },
    ],
  },
  {
    name: '内容社区',
    children: [
      { name: '信息流', value: 540 },
      { name: '短视频', value: 480 },
      { name: '直播', value: 260 },
      { name: '评论', value: 140 },
    ],
  },
  {
    name: '用户中心',
    children: [
      { name: '个人主页', value: 220 },
      { name: '收藏', value: 180 },
      { name: '优惠券', value: 160 },
      { name: '客服', value: 90 },
    ],
  },
  {
    name: '增值服务',
    children: [
      { name: '会员', value: 130 },
      { name: '积分商城', value: 110 },
      { name: '签到', value: 95 },
      { name: '游戏', value: 70 },
      { name: '任务', value: 60 },
    ],
  },
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>高密度矩阵树图</span>
      <span>18 个叶子模块 · 小矩形标签自动跳过 · 悬停压暗其余矩形</span>
    </div>
    <div class="demo-page__block-body" style="height: 320px">
      <KTreemapChart :data="DATA" :gap="2" />
    </div>
  </section>
</template>
