<script setup lang="ts">
import KBarChart from '@/components/k-bar-chart'
import type { KBarSeries, SeriesDatum } from '@/core/types'

/** 演示数据：月度现金流瀑布（期初/期末为合计，点级 color 覆盖涨跌色） */
const LABELS = ['期初余额', '销售收入', '采购支出', '项目回款', '市场费用', '其他收支', '期末余额']
const DATA: SeriesDatum[] = [
  { value: 100, color: '#7C5CFC', label: { show: true } },
  { value: 45, label: { show: true } },
  { value: -30, label: { show: true } },
  { value: 25, label: { show: true } },
  { value: -40, label: { show: true } },
  { value: 15, label: { show: true } },
  { value: 115, color: '#FFB020', label: { show: true } },
]
const SERIES: KBarSeries[] = [{ name: '现金流', data: DATA }]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>瀑布图</span>
      <span>waterfall 模式：按累计浮动柱绘制，正增绿 / 负减红，虚线为阶梯连接线（本例用 option 透传开启）</span>
    </div>
    <div class="demo-page__block-body" style="height: 320px">
      <KBarChart :labels="LABELS" :series="SERIES" :option="{ waterfall: true }" />
    </div>
  </section>
</template>
