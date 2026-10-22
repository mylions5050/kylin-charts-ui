<script setup lang="ts">
import KCirclePackingChart from '@/components/k-circle-packing-chart'
import type { KTreeDatum } from '@/core/types'

/** 演示数据：与基础用例同源，加大圆间距形成呼吸感 */
const DATA: KTreeDatum[] = [
  {
    name: '华东',
    children: [
      { name: '上海', value: 160 },
      { name: '杭州', value: 120 },
      { name: '南京', value: 90 },
    ],
  },
  {
    name: '华南',
    children: [
      { name: '深圳', value: 140 },
      { name: '广州', value: 105 },
    ],
  },
  {
    name: '华北',
    children: [
      { name: '北京', value: 175 },
      { name: '天津', value: 60 },
    ],
  },
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>大间距打包图</span>
      <span>gap 14 宽间距 · 父圆半径随间距增大 · 城市标签仍可见</span>
    </div>
    <div class="demo-page__block-body" style="height: 360px">
      <KCirclePackingChart :data="DATA" :gap="14" />
    </div>
  </section>
</template>
