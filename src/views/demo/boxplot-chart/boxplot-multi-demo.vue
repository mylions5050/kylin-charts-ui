<script setup lang="ts">
import KBoxplotChart from '@/components/k-boxplot-chart'
import type { KBoxplotSeries } from '@/core/types'

/** 演示数据：方案 A / B 在四个环节的耗时分布（预计算五数概括 ms） */
const LABELS = ['数据拉取', '规则计算', '结果渲染', '日志上报']
const SERIES: KBoxplotSeries[] = [
  {
    name: '方案 A',
    data: [
      [120, 180, 210, 260, 340],
      [80, 130, 160, 200, 280],
      [40, 70, 90, 120, 180],
      [20, 35, 45, 60, 95],
    ],
  },
  {
    name: '方案 B',
    color: '#F5455C',
    data: [
      [90, 140, 175, 220, 300],
      [60, 100, 135, 170, 240],
      [30, 55, 75, 100, 150],
      [15, 28, 38, 50, 80],
    ],
  },
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>多系列对比盒须图</span>
      <span>双方案并排分组 · 图例点击切换 · 分布形态直观对比</span>
    </div>
    <div class="demo-page__block-body" style="height: 320px">
      <KBoxplotChart :labels="LABELS" :series="SERIES" legend :y-axis="{ name: '耗时（ms）' }" />
    </div>
  </section>
</template>
