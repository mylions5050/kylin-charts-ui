<script setup lang="ts">
import KFunnelChart from '@/components/k-funnel-chart'
import type { KFunnelDatum } from '@/core/types'

/** 演示数据：shape="pyramid" 正金字塔（严格等腰，上尖下宽；轮廓按层数线性展开，与数据无关） */
const FUNNEL: KFunnelDatum[] = [
  { name: '简历投递', value: 500 },
  { name: '初筛通过', value: 320 },
  { name: '面试', value: 180 },
  { name: 'Offer', value: 60 },
  { name: '入职', value: 30 },
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>正金字塔图</span>
      <span>shape="pyramid" · 严格等腰金字塔，轮廓按层数线性展开、与数据无关</span>
    </div>
    <div class="demo-page__block-body">
      <KFunnelChart :data="FUNNEL" sort="asc" shape="pyramid" title="招聘漏斗" :height="360" />
    </div>
  </section>
</template>
