<script setup lang="ts">
import KFunnelChart from '@/components/k-funnel-chart'
import type { KFunnelDatum } from '@/core/types'

/** 演示数据：shape="square" 方形（各层同宽的纯几何矩形，轮廓与数据无关） */
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
      <span>方形漏斗图</span>
      <span>shape="square" · 各层同宽的纯几何矩形，轮廓与数据无关</span>
    </div>
    <div class="demo-page__block-body">
      <KFunnelChart :data="FUNNEL" shape="square" title="转化漏斗" :height="360" />
    </div>
  </section>
</template>
