<script setup lang="ts">
import KPieChart from '@/components/k-pie-chart'
import type { KPieDatum } from '@/core/types'

/** 演示数据：24 个类目（数值分布均匀），图例竖排在图右侧 + 上下分页箭头滚动 */
const CATEGORIES: KPieDatum[] = [
  { name: '华东大区', value: 186 },
  { name: '华南大区', value: 172 },
  { name: '华北大区', value: 165 },
  { name: '西南大区', value: 158 },
  { name: '华中大区', value: 149 },
  { name: '东北大区', value: 141 },
  { name: '西北大区', value: 133 },
  { name: '港澳台', value: 126 },
  { name: '东南亚', value: 119 },
  { name: '日韩', value: 112 },
  { name: '北美', value: 105 },
  { name: '欧洲', value: 98 },
  { name: '中东', value: 92 },
  { name: '南美', value: 86 },
  { name: '非洲', value: 80 },
  { name: '大洋洲', value: 74 },
  { name: '中亚', value: 68 },
  { name: '其他亚太', value: 62 },
  { name: '其他欧洲', value: 57 },
  { name: '独联体', value: 52 },
  { name: '北非', value: 47 },
  { name: '西非', value: 43 },
  { name: '东非', value: 39 },
  { name: '其他', value: 35 },
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>可滚动图例</span>
      <span>legend-orient="vertical" + scroll · 数据很多时图例竖排在图右侧，超出高度上下箭头分页</span>
    </div>
    <div class="demo-page__block-body">
      <KPieChart
        :data="CATEGORIES"
        title="各区域销售额占比"
        legend
        legend-type="scroll"
        legend-orient="vertical"
        label-layout="aligned"
        :item-border="false"
        :height="560"
      />
    </div>
  </section>
</template>
