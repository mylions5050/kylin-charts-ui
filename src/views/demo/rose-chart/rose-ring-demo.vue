<script setup lang="ts">
import KRoseChart from '@/components/k-rose-chart'
import type { KPieDatum } from '@/core/types'

/** 演示数据：玫瑰环（rose + innerRadius 组合，南丁格尔风格） */
const ROSE_RING: KPieDatum[] = [
  { name: '服饰', value: 380 },
  { name: '美妆', value: 300 },
  { name: '数码', value: 240 },
  { name: '家居', value: 170 },
  { name: '食品', value: 110 },
  { name: '图书', value: 50 },
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>玫瑰环（南丁格尔）</span>
      <span>roseType radius + innerRadius 0.35 组合 · 中心留白</span>
    </div>
    <div class="demo-page__block-body">
      <KRoseChart :data="ROSE_RING" :inner-radius="0.35" :start-angle="45" title="品类销售额" legend :height="380" />
    </div>
  </section>
</template>
