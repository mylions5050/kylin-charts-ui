<script setup lang="ts">
import KBoxplotChart from '@/components/k-boxplot-chart'
import type { KBoxplotSeries } from '@/core/types'

/** 演示数据：四个服务的接口响应时间（对象形态，outliers 标注离群请求） */
const LABELS = ['用户服务', '订单服务', '支付服务', '消息服务']
const SERIES: KBoxplotSeries[] = [
  {
    name: '响应时间',
    data: [
      { value: [18, 26, 34, 45, 68], outliers: [95, 120] },
      { value: [12, 20, 28, 38, 55], outliers: [88] },
      { value: [25, 40, 55, 72, 110], outliers: [160, 210, 260] },
      { value: [8, 14, 19, 26, 40] },
    ],
  },
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>异常点盒须图</span>
      <span>对象形态数据 · outliers 须外离散圆点 · 长尾离群请求可视化</span>
    </div>
    <div class="demo-page__block-body" style="height: 300px">
      <KBoxplotChart :labels="LABELS" :series="SERIES" :y-axis="{ name: '响应时间（ms）' }" />
    </div>
  </section>
</template>
