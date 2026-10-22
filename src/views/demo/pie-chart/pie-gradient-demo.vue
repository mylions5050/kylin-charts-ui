<script setup lang="ts">
import KPieChart from '@/components/k-pie-chart'
import type { KColor, KPieDatum } from '@/core/types'

/** 扇区渐变：径向渐变由扇区中心向外淡出（坐标为 0~1 相对扇区包围盒） */
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

/** 演示数据：两个扇区用径向渐变，其余走主题色板 */
const DATA: KPieDatum[] = [
  { name: '直接访问', value: 335, color: PURPLE_RADIAL },
  { name: '搜索引擎', value: 310, color: CYAN_RADIAL },
  { name: '外部链接', value: 234 },
  { name: '社交媒体', value: 155 },
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>渐变扇区饼图</span>
      <span>data 项 color 传 radial 渐变配置，图例色点同步以 CSS 渐变展示</span>
    </div>
    <div class="demo-page__block-body" style="height: 300px">
      <KPieChart :data="DATA" legend :height="300" />
    </div>
  </section>
</template>
