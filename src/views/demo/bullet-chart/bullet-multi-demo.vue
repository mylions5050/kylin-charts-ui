<script setup lang="ts">
import KBulletChart from '@/components/k-bullet-chart'
import type { KBulletDatum } from '@/core/types'

/** 演示数据：多行部门 KPI，按行指定语义色 */
const DATA: KBulletDatum[] = [
  { name: '销售部', value: 88, target: 85, unit: '%', color: '#4CAF7D' },
  { name: '市场部', value: 63, target: 75, unit: '%', color: '#3D8BFF' },
  { name: '客服部', value: 52, target: 70, unit: '%', color: '#F5A623' },
  { name: '研发部', value: 95, target: 90, unit: '%', color: '#7C5CFC' },
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>多行对比</span>
      <span>四行部门 KPI 各带语义色，目标线直观对比超额/欠额</span>
    </div>
    <div class="demo-page__block-body" style="height: 280px">
      <KBulletChart :data="DATA" />
    </div>
  </section>
</template>
