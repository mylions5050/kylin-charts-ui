<script setup lang="ts">
import KLineChart from '@/components/k-line-chart'
import type { KLineSeries } from '@/core/types'

/** 演示数据：垂直折线 = 类目轴在 y、数值轴在 x（首类目在底部） */
const LABELS = ['周一', '周二', '周三', '周四', '周五']
const SERIES: KLineSeries[] = [
  { name: '蒸发量', data: [120, 200, 150, 80, 170], color: '#00B8D9' },
  { name: '降水量', data: [80, 110, 96, 150, 120], color: '#7C5CFC' },
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>垂直折线图</span>
      <span>vertical 开启后整体翻转：类目轴在左（自下而上）、数值轴在下，折线纵向推进</span>
    </div>
    <div class="demo-page__block-body" style="height: 320px">
      <KLineChart :labels="LABELS" :series="SERIES" vertical legend />
    </div>
  </section>
</template>
