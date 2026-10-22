<script setup lang="ts">
import KFunnelChart from '@/components/k-funnel-chart'
import type { KFunnelDatum } from '@/core/types'

/** 演示数据：标准转化漏斗（desc 降序，自上而下收窄） */
const FUNNEL: KFunnelDatum[] = [
  { name: '展现', value: 1000 },
  { name: '点击', value: 800 },
  { name: '访问', value: 600 },
  { name: '咨询', value: 300 },
  { name: '成交', value: 100 },
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>基础漏斗图</span>
      <span>desc 降序 · 层内名称 + 层外数值引导线 · 可点击图例 · 悬停淡化其余层级</span>
    </div>
    <div class="demo-page__block-body">
      <KFunnelChart :data="FUNNEL" title="转化漏斗" legend :height="380" />
    </div>
  </section>
</template>
