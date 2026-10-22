<script setup lang="ts">
import KThemeRiverChart from '@/components/k-theme-river-chart'
import type { KThemeRiverSeries } from '@/core/types'

/** 演示数据：高不透明度 + 自定义系列色（暖色系情绪带） */
const LABELS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
const SERIES: KThemeRiverSeries[] = [
  { name: '喜悦', data: [42, 55, 48, 60, 72, 88, 92], color: '#F7BA1E' },
  { name: '平静', data: [66, 60, 63, 58, 55, 60, 64], color: '#7C5CFC' },
  { name: '焦虑', data: [30, 38, 35, 42, 50, 22, 18], color: '#F5455C' },
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>高不透明度情绪河流</span>
      <span>fillOpacity 0.95 · 一周情绪波动 · 系列自定义语义色 · 悬停竖向参考线 + 明细</span>
    </div>
    <div class="demo-page__block-body" style="height: 300px">
      <KThemeRiverChart :labels="LABELS" :series="SERIES" :fill-opacity="0.95" />
    </div>
  </section>
</template>
