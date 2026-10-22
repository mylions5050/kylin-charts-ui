<script setup lang="ts">
import KLineChart from '@/components/k-line-chart'
import type { KLineSeries } from '@/core/types'
import { MONTHS } from '../constants'

/** 演示数据：三种线型混合，配图例可点击切换 */
const FULL: KLineSeries[] = [
  { name: '销售额', data: [120, 132, 101, 134, 190, 230, 210, 182, 191, 234, 290, 330] },
  { name: '毛利', data: [56, 68, 48, 72, 96, 118, 102, 84, 95, 128, 152, 178], smooth: true, area: true },
  { name: '退款额', data: [12, 18, 22, 15, 20, 28, 32, 24, 19, 26, 30, 35], step: 'middle' },
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>折线图完整示例</span>
      <span>标题 + 可点击图例 + Tooltip + 轴名称 + 三种线型混合</span>
    </div>
    <div class="demo-page__block-body">
      <KLineChart
        :labels="MONTHS"
        :series="FULL"
        title="销售数据趋势"
        legend
        :x-axis="{ name: '月份' }"
        :y-axis="{ name: '金额（万元）' }"
        :height="380"
      />
    </div>
  </section>
</template>
