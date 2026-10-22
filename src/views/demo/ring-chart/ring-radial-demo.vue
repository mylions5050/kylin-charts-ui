<script setup lang="ts">
import KRingChart from '@/components/k-ring-chart'
import type { KColor, KPieDatum } from '@/core/types'

/** 扇区径向渐变：由扇区中心向外过渡（坐标为 0~1 相对扇区包围盒，与 ECharts 一致） */
const PURPLE_RADIAL: KColor = {
  type: 'radial',
  x: 0.5,
  y: 0.5,
  r: 0.6,
  colorStops: [
    { offset: 0, color: '#A88CFF' },
    { offset: 1, color: '#6A4BE0' },
  ],
}
const CYAN_RADIAL: KColor = {
  type: 'radial',
  x: 0.5,
  y: 0.5,
  r: 0.6,
  colorStops: [
    { offset: 0, color: '#4FD8DF' },
    { offset: 1, color: '#0097A0' },
  ],
}
const ORANGE_RADIAL: KColor = {
  type: 'radial',
  x: 0.5,
  y: 0.5,
  r: 0.6,
  colorStops: [
    { offset: 0, color: '#FFC46B' },
    { offset: 1, color: '#F58B3D' },
  ],
}

/** 演示数据：三个扇区径向渐变，其余走主题色板 */
const STORES: KPieDatum[] = [
  { name: '直营店', value: 420, color: PURPLE_RADIAL },
  { name: '加盟店', value: 280, color: CYAN_RADIAL },
  { name: '线上店', value: 210, color: ORANGE_RADIAL },
  { name: '快闪店', value: 90 },
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>渐变环形图</span>
      <span>data 项 color 传径向渐变配置，图例色点同步以 CSS 渐变展示</span>
    </div>
    <div class="demo-page__block-body">
      <KRingChart :data="STORES" title="门店类型构成" legend center-title="1000 家" center-subtitle="门店总数" :height="360" />
    </div>
  </section>
</template>
