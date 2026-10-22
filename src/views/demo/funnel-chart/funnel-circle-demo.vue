<script setup lang="ts">
import KFunnelChart from '@/components/k-funnel-chart'
import type { KFunnelDatum } from '@/core/types'

/** 演示数据：shape="circle" 圆泡漏斗（每层一个圆，直径按本层值占比，圆心等距垂直排列） */
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
      <span>圆泡漏斗图</span>
      <span>shape="circle" · 每层一个圆，直径按本层值占比，圆心等距垂直排列</span>
    </div>
    <div class="demo-page__block-body">
      <KFunnelChart :data="FUNNEL" shape="circle" title="转化漏斗" :height="360" />
    </div>
  </section>
</template>
