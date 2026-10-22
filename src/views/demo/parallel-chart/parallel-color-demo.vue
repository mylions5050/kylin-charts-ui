<script setup lang="ts">
import KParallelChart from '@/components/k-parallel-chart'
import type { KParallelDatum, KParallelDimension } from '@/core/types'

/** 演示数据：三条用车记录，按业务语义指定颜色（省钱绿 / 均衡蓝 / 性能红） */
const DIMENSIONS: KParallelDimension[] = [
  { name: '月均里程' },
  { name: '月均油费' },
  { name: '月均时长' },
  { name: '拥堵占比' },
]
const DATA: KParallelDatum[] = [
  { name: '经济通勤', values: [820, 620, 22, 18], color: '#2BA471' },
  { name: '均衡家用', values: [1250, 980, 30, 25], color: '#2B6FFF' },
  { name: '重度商务', values: [2100, 1850, 46, 38], color: '#F5455C' },
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>自定义颜色平行坐标</span>
      <span>数据项 color 字段按语义着色 · 线宽 3 突出强调 · 轴底部维度名</span>
    </div>
    <div class="demo-page__block-body" style="height: 320px">
      <KParallelChart :dimensions="DIMENSIONS" :data="DATA" :line-width="3" />
    </div>
  </section>
</template>
