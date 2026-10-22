<script setup lang="ts">
import KRingChart from '@/components/k-ring-chart'
import type { KPieDatum } from '@/core/types'

/** 演示数据：细环 + 起始角旋转（进度环风格） */
const THIN: KPieDatum[] = [
  { name: '已完成', value: 68, color: '#7C5CFC' },
  { name: '进行中', value: 22, color: '#B9A5FF' },
  { name: '待开始', value: 10, color: '#E5E6EB' },
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>细环进度风格</span>
      <span>innerRadius 0.78 细环 · startAngle 90 起始 · 中心大数字</span>
    </div>
    <div class="demo-page__block-body">
      <KRingChart
        :data="THIN"
        :inner-radius="0.78"
        :start-angle="90"
        :label="false"
        legend
        center-title="68%"
        center-subtitle="任务完成率"
        :height="320"
      />
    </div>
  </section>
</template>
