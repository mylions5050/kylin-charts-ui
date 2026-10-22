<script setup lang="ts">
import KSunburstChart from '@/components/k-sunburst-chart'
import type { KSunburstDatum } from '@/core/types'

/** 演示数据：两级层级（部门 → 小组，人数） */
const DATA: KSunburstDatum[] = [
  {
    name: '研发中心',
    children: [
      { name: '后端组', value: 120 },
      { name: '前端组', value: 90 },
      { name: '测试组', value: 60 },
    ],
  },
  {
    name: '产品中心',
    children: [
      { name: '产品组', value: 70 },
      { name: '设计组', value: 50 },
    ],
  },
  {
    name: '市场中心',
    children: [
      { name: '品牌组', value: 40 },
      { name: '渠道组', value: 55 },
    ],
  },
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>基础旭日图</span>
      <span>两级层级 · 径向旋转标签 · 悬停高亮 + 占比 Tooltip</span>
    </div>
    <div class="demo-page__block-body" style="height: 280px">
      <KSunburstChart :data="DATA" title="人员分布" />
    </div>
  </section>
</template>
