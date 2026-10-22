<script setup lang="ts">
import KPieChart from '@/components/k-pie-chart'
import type { KPieDatum } from '@/core/types'

/** 演示数据：多小占比相邻扇区，展示 aligned 布局的纵向防重叠能力 */
const CHANNELS: KPieDatum[] = [
  { name: '直接访问', value: 335 },
  { name: '搜索引擎', value: 310 },
  { name: '外部链接', value: 234 },
  { name: '社交媒体', value: 155 },
  { name: '广告投放', value: 98 },
  { name: '邮件营销', value: 76 },
  { name: '联盟推广', value: 54 },
  { name: '其他', value: 12 },
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>标签对齐</span>
      <span>label-layout="aligned" · 左右分侧定 x 对齐 + 同侧纵向分布防重叠 + 引导线折线接入</span>
    </div>
    <div class="demo-page__block-body">
      <KPieChart :data="CHANNELS" title="访问渠道来源" legend label-layout="aligned" :height="360" />
    </div>
  </section>
</template>
