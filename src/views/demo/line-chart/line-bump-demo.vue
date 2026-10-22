<script setup lang="ts">
import KLineChart from '@/components/k-line-chart'
import type { KLineSeries } from '@/core/types'

/** 演示数据：四个品牌逐月销量，凹凸图自动转换为名次（1 = 第一名画在顶端） */
const LABELS = ['1月', '2月', '3月', '4月', '5月', '6月']
const SERIES: KLineSeries[] = [
  { name: '甲品牌', data: [820, 932, 901, 934, 1290, 1330] },
  { name: '乙品牌', data: [650, 880, 1050, 720, 860, 990] },
  { name: '丙品牌', data: [500, 620, 580, 980, 1020, 880] },
  { name: '丁品牌', data: [380, 420, 500, 560, 480, 620] },
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>凹凸图</span>
      <span>bump 开启后 y 轴变为名次轴（1 在顶端）：名次平台 + S 曲线过渡、圆头粗线、光晕名次节点</span>
    </div>
    <div class="demo-page__block-body" style="height: 300px">
      <KLineChart :labels="LABELS" :series="SERIES" bump legend />
    </div>
  </section>
</template>
