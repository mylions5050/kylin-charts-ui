<script setup lang="ts">
import KSunburstChart from '@/components/k-sunburst-chart'
import type { KSunburstDatum } from '@/core/types'

/**
 * 演示数据：长尾小扇区兜底
 * - minAngle 1：小到 1° 的扇区仍绘制
 * - 标签默认 minAngle 8：小于 8° 的扇区自动隐藏径向标签，避免文字重叠
 */
const DATA: KSunburstDatum[] = [
  {
    name: '主流分类',
    children: [
      { name: '热点 A', value: 400 },
      { name: '热点 B', value: 260 },
    ],
  },
  {
    name: '长尾分布',
    children: [
      { name: '细分一', value: 120 },
      { name: '细分二', value: 80 },
      { name: '细分三', value: 50 },
      { name: '细分四', value: 30 },
      { name: '细分五', value: 18 },
      { name: '细分六', value: 10 },
      { name: '细分七', value: 6 },
      { name: '细分八', value: 3 },
    ],
  },
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>长尾兜底旭日图</span>
      <span>minAngle 1 · 小扇区仍绘制 · 标签小于 8° 自动隐藏防重叠</span>
    </div>
    <div class="demo-page__block-body" style="height: 280px">
      <KSunburstChart :data="DATA" :min-angle="1" title="访问内容长尾分布" />
    </div>
  </section>
</template>
