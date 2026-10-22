<script setup lang="ts">
import KSunburstChart from '@/components/k-sunburst-chart'
import type { KSunburstDatum } from '@/core/types'

/** 演示数据：多分支多叶子的饮品口味结构（对齐 ECharts Drink Flavors 示例风格） */
const DATA: KSunburstDatum[] = [
  {
    name: '咖啡',
    children: [
      {
        name: '拿铁',
        children: [
          { name: '大杯', value: 45 },
          { name: '中杯', value: 30 },
        ],
      },
      { name: '美式', value: 60 },
      { name: '摩卡', value: 25 },
    ],
  },
  {
    name: '茶饮',
    children: [
      {
        name: '奶茶',
        children: [
          { name: '珍珠', value: 80 },
          { name: '椰果', value: 35 },
        ],
      },
      { name: '水果茶', value: 55 },
      { name: '绿茶', value: 40 },
    ],
  },
  {
    name: '果汁',
    children: [
      { name: '橙汁', value: 48 },
      { name: '西瓜汁', value: 30 },
      { name: '柠檬汁', value: 18 },
    ],
  },
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>多分支旭日图</span>
      <span>三分支 · 混合深浅层级 · 小扇区与窄扇区标签兜底</span>
    </div>
    <div class="demo-page__block-body" style="height: 320px">
      <KSunburstChart :data="DATA" title="饮品口味分布" />
    </div>
  </section>
</template>
