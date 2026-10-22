<script setup lang="ts">
import KBarChart from '@/components/k-bar-chart'
import type { KBarSeries } from '@/core/types'

/** 演示数据：60 个类目 + 随机波动，配合滑条缩放体验窗口拖拽 / 手柄缩放 / 点击定位 */
const LABELS = Array.from({ length: 60 }, (_, i) => `3-${String(i + 1).padStart(2, '0')}`)
let seed = 7
const rnd = (): number => {
  seed = (seed * 9301 + 49297) % 233280
  return seed / 233280
}
const raw = Array.from({ length: 60 }, (_, i) => Math.round(200 + Math.sin(i / 4) * 90 + rnd() * 120))

const SERIES: KBarSeries[] = [
  {
    name: '订单量',
    data: raw,
    markLine: { data: [{ type: 'average' }] },
  },
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>dataZoom 滑条缩放（柱形图）</span>
      <span>底部滑条：拖拽窗口平移、两端手柄缩放、点击空白轨道定位；y 轴随窗口自适应重算</span>
    </div>
    <div class="demo-page__block-body" style="height: 360px">
      <KBarChart :labels="LABELS" :series="SERIES" legend :data-zoom="{ start: 15, end: 60 }" />
    </div>
  </section>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>滚轮缩放 + 拖拽平移（inside）</span>
      <span>绘图区内滚轮上滚放大 / 下滚缩小（以指针为锚点），缩放后按住拖拽平移；slider: false 隐藏底部滑条，纯滚轮交互</span>
    </div>
    <div class="demo-page__block-body" style="height: 360px">
      <KBarChart :labels="LABELS" :series="SERIES" legend :data-zoom="{ slider: false }" />
    </div>
  </section>
</template>
