<script setup lang="ts">
import KMultiRingChart from '@/components/k-multi-ring-chart'
import type { KProgressDatum } from '@/core/types'

/** 演示数据：满环 100% 走整圆 circle 兜底路径 */
const DATA: KProgressDatum[] = [
  { name: '上传完成', value: 100, unit: '%' },
  { name: '校验通过', value: 100, unit: '%' },
  { name: '发布成功', value: 100, unit: '%' },
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>满环 100%</span>
      <span>三环全满，验证接近整圆时的 circle 节点兜底渲染</span>
    </div>
    <div class="demo-page__block-body" style="height: 320px">
      <KMultiRingChart :data="DATA" />
    </div>
  </section>
</template>
