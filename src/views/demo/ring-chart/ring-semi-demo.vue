<script setup lang="ts">
import KRingChart from '@/components/k-ring-chart'
import type { KPieDatum } from '@/core/types'

/** 演示数据：半环形图（sweep-angle 180°，平底拱形，中心汇总） */
const STORES: KPieDatum[] = [
  { name: '直营店', value: 420 },
  { name: '加盟店', value: 280 },
  { name: '线上店', value: 210 },
  { name: '快闪店', value: 90 },
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>半环形图</span>
      <span>sweep-angle 180° + start-angle 270°（平底半拱）+ 中心标题/副标题 + 外部标签</span>
    </div>
    <div class="demo-page__block-body">
      <KRingChart
        :data="STORES"
        title="门店类型构成"
        :start-angle="270"
        :sweep-angle="180"
        center-title="1000 家"
        center-subtitle="门店总数"
        :height="360"
      />
    </div>
  </section>
</template>
