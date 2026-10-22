<script setup lang="ts">
import KSunburstChart from '@/components/k-sunburst-chart'
import type { KSunburstDatum } from '@/core/types'

/**
 * 演示数据：颜色定制
 * - 顶层显式指定品牌色，子级继承父级色并随层级降透明度
 * - 「餐饮」单独显式指定颜色（alpha 恒为 1，不随层级降）
 */
const DATA: KSunburstDatum[] = [
  {
    name: '收入',
    color: '#7C5CFC',
    children: [
      { name: '工资', value: 800 },
      { name: '理财', value: 200 },
    ],
  },
  {
    name: '支出',
    color: '#F5455C',
    children: [
      { name: '房租', value: 300 },
      { name: '餐饮', value: 180, color: '#B9A5FF' },
      { name: '交通', value: 90 },
    ],
  },
  {
    name: '储蓄',
    color: '#2B6FFF',
    children: [
      { name: '定期', value: 250 },
      { name: '基金', value: 150 },
    ],
  },
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>颜色定制旭日图</span>
      <span>顶层显式色 + 子级继承降透明度 · 节点级颜色覆盖（恒不透明）</span>
    </div>
    <div class="demo-page__block-body" style="height: 260px">
      <KSunburstChart :data="DATA" title="月度收支结构" />
    </div>
  </section>
</template>
