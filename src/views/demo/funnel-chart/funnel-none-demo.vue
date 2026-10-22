<script setup lang="ts">
import KFunnelChart from '@/components/k-funnel-chart'
import type { KFunnelDatum } from '@/core/types'

/**
 * 演示数据：sort="none" 保持原始顺序绘制
 * 注意第二项故意比第一项小、第三项又比第二项大——验证不排序时逐层按给定值绘制
 */
const FUNNEL: KFunnelDatum[] = [
  { name: '新品发布', value: 400 },
  { name: '首周热度', value: 280 },
  { name: '口碑发酵', value: 350 },
  { name: '长尾销售', value: 150 },
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>原始顺序漏斗图</span>
      <span>sort="none" · 不排序，宽度严格按数据值绘制</span>
    </div>
    <div class="demo-page__block-body">
      <KFunnelChart :data="FUNNEL" sort="none" title="新品生命周期" :height="360" />
    </div>
  </section>
</template>
