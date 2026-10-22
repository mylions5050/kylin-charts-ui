<script setup lang="ts">
import KCirclePackingChart from '@/components/k-circle-packing-chart'
import type { KTreeDatum } from '@/core/types'

/** 演示数据：单层扁平结构（无父级聚合） */
const DATA: KTreeDatum[] = [
  { name: 'Vue', value: 240 },
  { name: 'React', value: 210 },
  { name: 'TypeScript', value: 180 },
  { name: 'Vite', value: 150 },
  { name: 'Node.js', value: 130 },
  { name: 'Webpack', value: 95 },
  { name: 'Rollup', value: 70 },
  { name: 'esbuild', value: 60 },
  { name: 'SWC', value: 45 },
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>扁平打包图</span>
      <span>单层九叶 · 按值降序排布 · 圆之间留出均匀间隙</span>
    </div>
    <div class="demo-page__block-body" style="height: 340px">
      <KCirclePackingChart :data="DATA" />
    </div>
  </section>
</template>
