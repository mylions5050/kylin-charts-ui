<script setup lang="ts">
import KWordcloudChart from '@/components/k-wordcloud-chart'
import type { KWordcloudDatum } from '@/core/types'

/** 演示数据：全横排（rotateRatio 0）+ 自定义色板循环 */
const PALETTE = ['#7C5CFC', '#2B6FFF', '#2BA471', '#F7BA1E', '#F5455C', '#B9A5FF']
const DATA: KWordcloudDatum[] = [
  { name: '咖啡', value: 900 },
  { name: '拿铁', value: 780 },
  { name: '美式', value: 720 },
  { name: '手冲', value: 600 },
  { name: '澳白', value: 520 },
  { name: '冷萃', value: 430 },
  { name: '摩卡', value: 360 },
  { name: '卡布奇诺', value: 300 },
  { name: '挂耳', value: 240 },
  { name: '浓缩', value: 190 },
  { name: '生椰', value: 150 },
  { name: '燕麦奶', value: 110 },
].map((d, i) => ({ ...d, color: PALETTE[i % PALETTE.length] }))
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>横排彩色词云</span>
      <span>rotateRatio 0 全横排 · 数据项 color 六色循环 · 语义化配色更醒目</span>
    </div>
    <div class="demo-page__block-body" style="height: 320px">
      <KWordcloudChart :data="DATA" :rotate-ratio="0" />
    </div>
  </section>
</template>
