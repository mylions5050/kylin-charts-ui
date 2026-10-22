<script setup lang="ts">
import KLineChart from '@/components/k-line-chart'
import type { KLineSeries } from '@/core/types'

/** 演示数据：60 个类目 + 随机波动，配合滑条缩放体验窗口拖拽 / 手柄缩放 / 点击定位 */
const LABELS = Array.from({ length: 60 }, (_, i) => `3-${String(i + 1).padStart(2, '0')}`)
let seed = 42
const rnd = (): number => {
  seed = (seed * 9301 + 49297) % 233280
  return seed / 233280
}
const raw = Array.from({ length: 60 }, (_, i) => Math.round(120 + Math.sin(i / 5) * 60 + rnd() * 80))

const SERIES: KLineSeries[] = [
  {
    name: '成交额',
    data: raw,
    markLine: { data: [{ type: 'average' }] },
  },
  { name: '客流量', data: raw.map((v) => Math.round(v * 0.6 + rnd() * 30)) },
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>dataZoom 滑条缩放</span>
      <span>底部滑条：拖拽窗口平移、两端手柄缩放、点击空白轨道定位；y 轴随窗口自适应重算</span>
    </div>
    <div class="demo-page__block-body" style="height: 360px">
      <KLineChart :labels="LABELS" :series="SERIES" legend :data-zoom="{ start: 10, end: 55 }" />
    </div>
  </section>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>滚轮缩放 + 拖拽平移（inside）</span>
      <span>绘图区内滚轮上滚放大 / 下滚缩小（以指针为锚点），缩放后按住拖拽平移；slider: false 隐藏底部滑条，纯滚轮交互</span>
    </div>
    <div class="demo-page__block-body" style="height: 360px">
      <KLineChart :labels="LABELS" :series="SERIES" legend :data-zoom="{ slider: false }" />
    </div>
  </section>
</template>
