<script setup lang="ts">
import KProgressRingChart from '@/components/k-progress-ring-chart'
import type { KProgressDatum } from '@/core/types'

/** 演示数据：粗环带对比端点样式 */
const DATA: KProgressDatum = { name: '任务完成率', value: 32, unit: '%' }
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>平头端点（默认）</span>
      <span>进度弧两端为平头（lineCap 缺省 butt），粗环带下两端呈直角切边</span>
    </div>
    <div class="demo-page__block-body" style="height: 260px">
      <KProgressRingChart :data="DATA" :track-width="20" :height="260" />
    </div>
  </section>

  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>圆角端点</span>
      <span>line-cap="round" 进度弧两端圆头（对齐 stroke-linecap round）</span>
    </div>
    <div class="demo-page__block-body" style="height: 260px">
      <KProgressRingChart :data="DATA" :track-width="20" line-cap="round" :height="260" />
    </div>
  </section>
</template>
