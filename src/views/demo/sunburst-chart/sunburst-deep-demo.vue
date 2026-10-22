<script setup lang="ts">
import KSunburstChart from '@/components/k-sunburst-chart'
import type { KSunburstDatum } from '@/core/types'

/** 演示数据：三层层级（品类 → 产品线 → 具体型号），环宽自动按最大深度均分 */
const DATA: KSunburstDatum[] = [
  {
    name: '消费电子',
    children: [
      {
        name: '手机',
        children: [
          { name: '旗舰系列', value: 300 },
          { name: '中端系列', value: 200 },
        ],
      },
      {
        name: '平板',
        children: [
          { name: '标准版', value: 120 },
          { name: 'Pro 版', value: 80 },
        ],
      },
    ],
  },
  {
    name: '智能家居',
    children: [
      { name: '智能音箱', value: 150 },
      { name: '智能灯具', value: 90 },
      { name: '传感器', value: 60 },
    ],
  },
  {
    name: '可穿戴',
    children: [
      { name: '智能手表', value: 180 },
      { name: '手环', value: 70 },
    ],
  },
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>深层旭日图</span>
      <span>三层层级 · 环数随最大深度自适应 · 左半圆标签自动翻转保证可读</span>
    </div>
    <div class="demo-page__block-body" style="height: 320px">
      <KSunburstChart :data="DATA" title="产品销量结构" />
    </div>
  </section>
</template>
