<script setup lang="ts">
import KFunnelChart from '@/components/k-funnel-chart'
import type { KFunnelDatum } from '@/core/types'

/** 演示数据：align="left" 靠左对齐（右缘形成阶梯收窄，右侧留给数值引导线） */
const FUNNEL: KFunnelDatum[] = [
  { name: '曝光', value: 1200 },
  { name: '互动', value: 760 },
  { name: '留资', value: 420 },
  { name: '核销', value: 160 },
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>靠左对齐漏斗图</span>
      <span>align="left" · 左缘齐平、右侧阶梯收窄</span>
    </div>
    <div class="demo-page__block-body">
      <KFunnelChart :data="FUNNEL" align="left" title="活动效果漏斗" :height="360" />
    </div>
  </section>
</template>
