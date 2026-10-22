<script setup lang="ts">
import KBulletChart from '@/components/k-bullet-chart'
import type { KBulletDatum } from '@/core/types'

/** 演示数据：细条紧凑样式 */
const DATA: KBulletDatum[] = [
  { name: '磁盘 I/O', value: 72, target: 80, ranges: [50, 90], unit: '%' },
  { name: 'CPU 负载', value: 45, target: 60, ranges: [40, 85], unit: '%' },
  { name: '内存占用', value: 66, target: 70, ranges: [55, 90], unit: '%' },
  { name: '网络延迟', value: 30, target: 25, ranges: [40, 80], unit: 'ms' },
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>细条样式</span>
      <span>rangeHeight 16 / barHeight 8 紧凑参数 + labelWidth 120，适合监控面板</span>
    </div>
    <div class="demo-page__block-body" style="height: 240px">
      <KBulletChart :data="DATA" :range-height="16" :bar-height="8" :label-width="120" />
    </div>
  </section>
</template>
