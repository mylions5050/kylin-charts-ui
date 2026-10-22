<script setup lang="ts">
import KLineChart from '@/components/k-line-chart'
import type { KLineSeries } from '@/core/types'

/**
 * 轴扩展（对齐 ECharts 常用配置）：
 * min/max 固定域、inverse 反向、splitLine 网格线显隐、
 * nameLocation/nameGap 轴名位置、labelColor/labelFontSize 刻度文字样式
 */
const SERIES_A: KLineSeries[] = [
  { name: '销售额', data: [120, 210, 160, 300, 250, 380] },
]

/** 线型 + 常驻点标签 + 反向轴 */
const SERIES_B: KLineSeries[] = [
  { name: '实际（虚线）', data: [120, 132, 101, 134, 90, 230], lineType: 'dashed', label: true, lineWidth: 2 },
  { name: '预测（点线）', data: [80, 110, 130, 160, 210, 260], lineType: 'dotted', lineWidth: 3 },
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>轴固定域 / 网格线 / 轴名位置</span>
      <span>yAxis.min/max 固定域 · splitLine 关网格线 · nameLocation + nameGap 轴名 · labelColor/labelFontSize 刻度文字</span>
    </div>
    <div class="demo-page__block-body" style="height: 340px">
      <KLineChart
        :labels="['周一', '周二', '周三', '周四', '周五', '周六']"
        :series="SERIES_A"
        :y-axis="{ min: 0, max: 400, splitLine: false, name: '万元', nameLocation: 'middle', nameGap: 38 }"
        :x-axis="{ name: '星期', nameLocation: 'middle', nameGap: 30 }"
        legend
      />
    </div>
  </section>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>轴反向 / 线型 / 常驻数据点标签</span>
      <span>yAxis.inverse 反向 · series.lineType dashed/dotted · lineWidth · series.label 常驻显示数值</span>
    </div>
    <div class="demo-page__block-body" style="height: 340px">
      <KLineChart
        :labels="['周一', '周二', '周三', '周四', '周五', '周六']"
        :series="SERIES_B"
        :y-axis="{ inverse: true }"
        legend
      />
    </div>
  </section>
</template>
