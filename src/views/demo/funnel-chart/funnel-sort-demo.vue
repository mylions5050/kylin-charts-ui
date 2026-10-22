<script setup lang="ts">
import KFunnelChart from '@/components/k-funnel-chart'
import type { KFunnelDatum } from '@/core/types'

/** 演示数据：asc 升序 → 倒置金字塔（自上而下变宽） */
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
      <span>升序漏斗图</span>
      <span>sort="asc" · 倒置金字塔形态</span>
    </div>
    <div class="demo-page__block-body">
      <KFunnelChart :data="FUNNEL" sort="asc" title="招聘漏斗" :height="360" />
    </div>
  </section>
</template>
