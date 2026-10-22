<script setup lang="ts">
import KHeatmapChart from '@/components/k-heatmap-chart'
import type { KHeatmapDatum } from '@/core/types'

/** 演示数据：六条产线 × 12 小时的设备利用率（%），固定种子形态稳定 */
let seed = 11
const nextRand = (): number => {
  seed = (seed * 9301 + 49297) % 233280
  return seed / 233280
}

const ROWS = ['产线 A', '产线 B', '产线 C', '产线 D', '产线 E', '产线 F']
const COLUMNS = Array.from({ length: 12 }, (_, i) => `${String(8 + i).padStart(2, '0')}:00`)
const DATA: KHeatmapDatum[] = []
for (let r = 0; r < ROWS.length; r++) {
  for (let c = 0; c < COLUMNS.length; c++) {
    DATA.push([c, r, Math.round(40 + nextRand() * 55)])
  }
}
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>高密度热力图</span>
      <span>6 × 12 网格 · 关闭数值标签（label=false）· cellGap 收窄</span>
    </div>
    <div class="demo-page__block-body" style="height: 300px">
      <KHeatmapChart :rows="ROWS" :columns="COLUMNS" :data="DATA" :label="false" :cell-gap="1" />
    </div>
  </section>
</template>
