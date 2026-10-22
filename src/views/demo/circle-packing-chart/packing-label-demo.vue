<script setup lang="ts">
import KCirclePackingChart from '@/components/k-circle-packing-chart'
import type { KTreeDatum } from '@/core/types'

/** 演示数据：紧凑小圆场景，关闭标签避免文字溢出 */
const DATA: KTreeDatum[] = [
  { name: 'A', value: 90 },
  { name: 'B', value: 82 },
  { name: 'C', value: 76 },
  { name: 'D', value: 71 },
  { name: 'E', value: 66 },
  { name: 'F', value: 61 },
  { name: 'G', value: 57 },
  { name: 'H', value: 53 },
  { name: 'I', value: 49 },
  { name: 'J', value: 45 },
  { name: 'K', value: 41 },
  { name: 'L', value: 38 },
  { name: 'M', value: 35 },
  { name: 'N', value: 32 },
  { name: 'O', value: 29 },
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>关闭标签打包图</span>
      <span>15 个叶子 + label false · 悬停仍可查看名称与数值</span>
    </div>
    <div class="demo-page__block-body" style="height: 340px">
      <KCirclePackingChart :data="DATA" :label="false" />
    </div>
  </section>
</template>
