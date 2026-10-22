<script setup lang="ts">
import KTreemapChart from '@/components/k-treemap-chart'
import type { KTreeDatum } from '@/core/types'

/** 演示数据：投资组合持仓（资产大类 → 赛道 → 标的，三层嵌套，单位万元） */
const DATA: KTreeDatum[] = [
  {
    name: '权益类',
    children: [
      {
        name: '科技',
        children: [
          { name: '芯片 A', value: 180 },
          { name: '软件 B', value: 140 },
          { name: '云服务 C', value: 110 },
        ],
      },
      {
        name: '消费',
        children: [
          { name: '白酒 D', value: 160 },
          { name: '家电 E', value: 90 },
        ],
      },
      {
        name: '医药',
        children: [
          { name: '创新药 F', value: 120 },
          { name: '器械 G', value: 70 },
        ],
      },
    ],
  },
  {
    name: '固收类',
    children: [
      { name: '国债', value: 260 },
      { name: '企业债', value: 180 },
    ],
  },
  {
    name: '现金类',
    children: [{ name: '货币基金', value: 220 }],
  },
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>三层嵌套矩阵树图</span>
      <span>大类 → 赛道 → 标的逐层下钻 · 分支色继承降透明度</span>
    </div>
    <div class="demo-page__block-body" style="height: 340px">
      <KTreemapChart :data="DATA" :gap="2" />
    </div>
  </section>
</template>
