<script setup lang="ts">
import KProgressRingChart from '@/components/k-progress-ring-chart'
import type { KProgressDatum } from '@/core/types'

/** 演示数据：三条业务线完成率并排 */
const DATAS: Array<KProgressDatum & { color: string }> = [
  { name: '研发线', value: 88, color: '#7C5CFC' },
  { name: '运营线', value: 64, color: '#2B6FFF' },
  { name: '市场线', value: 41, color: '#F5455C' },
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>多进度环并排</span>
      <span>flex 三列布局 · 各自独立颜色与数值 · 悬停分别查看明细</span>
    </div>
    <div class="demo-page__block-body" style="display: flex; height: 280px">
      <div v-for="d in DATAS" :key="d.name" style="flex: 1">
        <KProgressRingChart :data="d" :color="d.color" :track-width="12" />
      </div>
    </div>
  </section>
</template>
