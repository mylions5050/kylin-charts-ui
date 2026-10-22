<script setup lang="ts">
import KProgressBarChart from '@/components/k-progress-bar-chart'
import type { KColor, KProgressBarDatum } from '@/core/types'

/** 横向线性渐变：沿条身从左到右过渡（坐标为 0~1 相对条包围盒） */
const BAR_LINEAR: KColor = {
  type: 'linear',
  x: 0,
  y: 0,
  x2: 1,
  y2: 0,
  colorStops: [
    { offset: 0, color: '#7C5CFC' },
    { offset: 1, color: '#00B4BE' },
  ],
}
const BAR_ORANGE: KColor = {
  type: 'linear',
  x: 0,
  y: 0,
  x2: 1,
  y2: 0,
  colorStops: [
    { offset: 0, color: '#FF9A3D' },
    { offset: 1, color: '#F5455C' },
  ],
}

/** 径向渐变：由条中心向外淡出 */
const BAR_RADIAL: KColor = {
  type: 'radial',
  x: 0.5,
  y: 0.5,
  r: 0.7,
  colorStops: [
    { offset: 0, color: '#A88CFF' },
    { offset: 1, color: '#6A4BE0' },
  ],
}

/** 演示数据：不同行使用不同渐变 */
const DATA: KProgressBarDatum[] = [
  { name: '用户增长', value: 92, unit: '%', color: BAR_LINEAR },
  { name: '活跃留存', value: 74, unit: '%', color: BAR_RADIAL },
  { name: '转化漏斗', value: 48, unit: '%', color: BAR_ORANGE },
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>渐变进度条</span>
      <span>data 项 color 传 linear / radial 渐变配置（横向线性渐变沿条身方向过渡），tooltip 色点同步以 CSS 渐变展示</span>
    </div>
    <div class="demo-page__block-body" style="height: 180px">
      <KProgressBarChart :data="DATA" />
    </div>
  </section>
</template>
