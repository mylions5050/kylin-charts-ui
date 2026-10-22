<script setup lang="ts">
import KParallelChart from '@/components/k-parallel-chart'
import type { KParallelDatum, KParallelDimension } from '@/core/types'

/** 演示数据：三位开发者五维雷达式对比（粗线风格） */
const DIMENSIONS: KParallelDimension[] = [
  { name: '编码', min: 0, max: 100 },
  { name: '设计', min: 0, max: 100 },
  { name: '沟通', min: 0, max: 100 },
  { name: '测试', min: 0, max: 100 },
  { name: '运维', min: 0, max: 100 },
]
const DATA: KParallelDatum[] = [
  { name: '小林', values: [92, 60, 75, 58, 66] },
  { name: '阿哲', values: [70, 88, 82, 64, 55] },
  { name: '小婉', values: [78, 72, 90, 86, 78] },
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>五维能力对比平行坐标</span>
      <span>五轴统一 0~100 值域 · lineWidth 4 粗线风格 · 悬停展示各维分数</span>
    </div>
    <div class="demo-page__block-body" style="height: 340px">
      <KParallelChart :dimensions="DIMENSIONS" :data="DATA" :line-width="4" />
    </div>
  </section>
</template>
