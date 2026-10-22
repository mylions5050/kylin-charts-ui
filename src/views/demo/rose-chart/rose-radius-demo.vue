<script setup lang="ts">
import KRoseChart from '@/components/k-rose-chart'
import type { KPieDatum } from '@/core/types'

/** 演示数据：radius 模式（半径线性映射数值） */
const RADIUS_DATA: KPieDatum[] = [
  { name: '北京', value: 420 },
  { name: '上海', value: 380 },
  { name: '广州', value: 300 },
  { name: '深圳', value: 260 },
  { name: '杭州', value: 180 },
  { name: '成都', value: 120 },
  { name: '武汉', value: 70 },
  { name: '西安', value: 30 },
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>玫瑰图 · radius 模式</span>
      <span>半径线性映射数值 · 等角均分 · 可点击图例</span>
    </div>
    <div class="demo-page__block-body">
      <KRoseChart :data="RADIUS_DATA" title="城市销量对比" legend :height="380" />
    </div>
  </section>
</template>
