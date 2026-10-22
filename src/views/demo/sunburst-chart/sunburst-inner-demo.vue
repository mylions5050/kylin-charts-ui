<script setup lang="ts">
import KSunburstChart from '@/components/k-sunburst-chart'
import type { KSunburstDatum } from '@/core/types'

/** 演示数据：innerRadius 0.35 大中孔形态（中心留白，可叠加说明文案） */
const DATA: KSunburstDatum[] = [
  {
    name: '科技',
    children: [
      { name: 'AI', value: 260 },
      { name: '芯片', value: 180 },
    ],
  },
  {
    name: '财经',
    children: [
      { name: '股市', value: 220 },
      { name: '基金', value: 140 },
    ],
  },
  {
    name: '生活',
    children: [
      { name: '美食', value: 160 },
      { name: '旅行', value: 120 },
    ],
  },
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>大中孔旭日图</span>
      <span>innerRadius 0.35 · 内圈环形带形态 · 径向标签沿环排布</span>
    </div>
    <div class="demo-page__block-body" style="height: 260px">
      <KSunburstChart :data="DATA" :inner-radius="0.35" title="内容分类占比" />
    </div>
  </section>
</template>
