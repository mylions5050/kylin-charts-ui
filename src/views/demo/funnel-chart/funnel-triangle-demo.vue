<script setup lang="ts">
import KFunnelChart from '@/components/k-funnel-chart'
import type { KFunnelDatum } from '@/core/types'

/** 演示数据：shape="triangle" 倒三角（严格等腰，上宽下尖；轮廓按层数线性收缩，与数据无关） */
const FUNNEL: KFunnelDatum[] = [
  { name: '曝光', value: 1000 },
  { name: '点击', value: 800 },
  { name: '访问', value: 600 },
  { name: '咨询', value: 300 },
  { name: '成交', value: 100 },
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>倒三角漏斗图</span>
      <span>shape="triangle" · 严格等腰三角形，轮廓按层数线性收缩、与数据无关</span>
    </div>
    <div class="demo-page__block-body">
      <KFunnelChart :data="FUNNEL" shape="triangle" title="转化漏斗" :height="360" />
    </div>
  </section>
</template>
