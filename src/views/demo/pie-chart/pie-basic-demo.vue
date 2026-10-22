<script setup lang="ts">
import KPieChart from '@/components/k-pie-chart'
import type { KPieDatum } from '@/core/types'

/** 演示数据：多类目占比（数量超出图例宽度以演示滚动图例） */
const CHANNELS: KPieDatum[] = [
  { name: '直接访问', value: 335 },
  { name: '搜索引擎', value: 310 },
  { name: '外部链接', value: 234 },
  { name: '社交媒体', value: 155 },
  { name: '广告投放', value: 98 },
  { name: '邮件营销', value: 76 },
  { name: '联盟推广', value: 54 },
  { name: '其他', value: 12 },
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>基础饼图</span>
      <span>标题 + 可滚动图例（legend-type="scroll"，超出出分页箭头）+ 默认标签跟随扇区角度</span>
    </div>
    <div class="demo-page__block-body">
      <KPieChart :data="CHANNELS" title="访问渠道来源" legend legend-type="scroll" selected-mode="single" :height="360" />
    </div>
  </section>
</template>
