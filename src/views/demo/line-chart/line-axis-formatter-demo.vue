<script setup lang="ts">
import KLineChart from '@/components/k-line-chart'
import type { KLineSeries } from '@/core/types'
import { formatCnNumber } from '@/core/utils/format'

/**
 * 大数据量场景：y 轴刻度用 labelFormatter 自定义文案，
 * 配合内置 formatCnNumber 工具显示中文数量级（10000 -> 1万）
 */
const SERIES: KLineSeries[] = [
  { name: '成交额', data: [86000, 154000, 92000, 328000, 210000, 560000] },
  { name: '访问量', data: [12000, 18000, 9000, 46000, 31000, 88000] },
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>自定义 Y 轴刻度文案</span>
      <span>yAxis.labelFormatter 自定义格式化 · 配合 formatCnNumber 中文数量级 · 只改文案不影响刻度取值</span>
    </div>
    <div class="demo-page__block-body" style="height: 360px">
      <KLineChart
        :labels="['周一', '周二', '周三', '周四', '周五', '周六']"
        :series="SERIES"
        :y-axis="{ name: '成交额（元）', labelFormatter: (v) => formatCnNumber(v) }"
        legend
        smooth
      />
    </div>
  </section>
</template>
