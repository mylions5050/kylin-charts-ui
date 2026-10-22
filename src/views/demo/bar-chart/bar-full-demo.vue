<script setup lang="ts">
import KBarChart from '@/components/k-bar-chart'
import type { KBarSeries } from '@/core/types'

/** 演示数据：三种系列对比（含系列级颜色覆盖） */
const FULL: KBarSeries[] = [
  { name: '线上销量', data: [120, 200, 150, 80, 270, 310] },
  { name: '线下销量', data: [60, 90, 110, 75, 130, 150] },
  { name: '退货量', data: [12, 18, 15, 9, 22, 26] },
]

const HALF_YEAR = ['1月', '2月', '3月', '4月', '5月', '6月']
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>柱形图完整示例</span>
      <span>标题 + 可点击图例 + Tooltip + 轴名称 + 多系列分组</span>
    </div>
    <div class="demo-page__block-body">
      <KBarChart
        :labels="HALF_YEAR"
        :series="FULL"
        title="半年销量对比"
        legend
        :x-axis="{ name: '月份' }"
        :y-axis="{ name: '销量（件）' }"
        :height="380"
      />
    </div>
  </section>
</template>
