<script setup lang="ts">
import KBarChart from '@/components/k-bar-chart'
import type { KBarSeries } from '@/core/types'

/** 演示数据：常规分组柱 + 浅灰背景带 */
const LABELS = ['华东', '华南', '华北', '西南', '东北']
const SERIES: KBarSeries[] = [
  { name: '线上', data: [320, 280, 240, 180, 120] },
  { name: '线下', data: [180, 220, 260, 140, 90] },
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>柱形背景带 + 默认高亮带</span>
      <span>showBackground 开启后每个类目带一根全高浅灰背景柱；hover 高亮带默认开启，悬停时主题色淡带平滑滑动到当前类目</span>
    </div>
    <div class="demo-page__block-body" style="height: 300px">
      <KBarChart :labels="LABELS" :series="SERIES" show-background />
    </div>
  </section>

  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>自定义高亮带颜色</span>
      <span>hover-highlight 传颜色可自定义高亮带（纯色 / 渐变均可），与 showBackground 互不依赖</span>
    </div>
    <div class="demo-page__block-body" style="height: 300px">
      <KBarChart :labels="LABELS" :series="SERIES" hover-highlight="rgba(0, 180, 190, 0.16)" />
    </div>
  </section>

  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>关闭高亮带（对照）</span>
      <span>:hover-highlight="false" 悬停不再出现高亮带，仅保留背景柱与十字参考线</span>
    </div>
    <div class="demo-page__block-body" style="height: 300px">
      <KBarChart :labels="LABELS" :series="SERIES" show-background :hover-highlight="false" />
    </div>
  </section>
</template>
