<script setup lang="ts">
import KLineChart from '@/components/k-line-chart'
import { sampleFunction } from '@/core/utils/function'
import type { KLineSeries } from '@/core/types'

/** 演示数据：函数绘图 = 数值 x 轴（双数值轴）上直接绘制 y = f(x) */
const SAMPLE_RANGE = { x0: -6, x1: 6, count: 60 }
const SIN = sampleFunction((x) => Math.sin(x) * 30, SAMPLE_RANGE.x0, SAMPLE_RANGE.x1, SAMPLE_RANGE.count)
const DAMP = sampleFunction((x) => Math.sin(x) * Math.exp(-Math.abs(x) / 4) * 30, SAMPLE_RANGE.x0, SAMPLE_RANGE.x1, SAMPLE_RANGE.count)
const SERIES: KLineSeries[] = [
  { name: 'y = 30·sin(x)', data: SIN.data, color: '#7C5CFC' },
  { name: 'y = 30·sin(x)·e^(-|x|/4)', data: DAMP.data, color: '#00C48C' },
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>函数绘图 / 双数值轴</span>
      <span>numericX 开启后 x 轴为线性数值轴（niceTicks 取刻度），配合 sampleFunction 直接绘制函数曲线</span>
    </div>
    <div class="demo-page__block-body" style="height: 300px">
      <KLineChart :labels="SIN.labels" :series="SERIES" numeric-x :x-axis="{ name: 'x' }" legend />
    </div>
  </section>
</template>
