<script setup lang="ts">
import KBarChart from '@/components/k-bar-chart'
import type { KBarSeries } from '@/core/types'

/**
 * 柱形扩展（对齐 ECharts 常用配置）：
 * barWidth 柱宽、barRadius 顶部圆角、barGap 系列间空隙
 */
const SERIES_ONE: KBarSeries[] = [
  { name: '销量', data: [320, 410, 380, 260, 290] },
]

const SERIES_TWO: KBarSeries[] = [
  { name: '线上', data: [320, 410, 380, 260, 290] },
  { name: '线下', data: [240, 300, 320, 200, 260] },
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>柱宽 / 圆角柱</span>
      <span>barWidth 固定柱宽 · barRadius 生长方向前端两角圆角（对齐 ECharts borderRadius）</span>
    </div>
    <div class="demo-page__block-body" style="height: 320px">
      <KBarChart
        :labels="['华东', '华南', '华北', '西南', '东北']"
        :series="SERIES_ONE"
        :bar-width="32"
        :bar-radius="8"
        legend
      />
    </div>
  </section>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>系列柱间距</span>
      <span>barGap 控制同类目内系列柱间的空隙比例（对齐 ECharts barGap）</span>
    </div>
    <div class="demo-page__block-body" style="height: 320px">
      <KBarChart
        :labels="['华东', '华南', '华北', '西南', '东北']"
        :series="SERIES_TWO"
        :bar-gap="0.6"
        legend
      />
    </div>
  </section>
</template>
