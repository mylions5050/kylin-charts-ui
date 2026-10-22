<script setup lang="ts">
import KProgressRingChart from '@/components/k-progress-ring-chart'
import type { KProgressDatum } from '@/core/types'

/** 演示数据：径向渐变沿环带半径方向过渡（内缘色 → 外缘色，精确贴合环带不偏心） */
const DATA: KProgressDatum = { name: '年度目标', value: 76, unit: '%' }
const DATA_FULL: KProgressDatum = { name: '服务器负载', value: 100, unit: '%' }
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>径向渐变进度环</span>
      <span>band-gradient 沿环带半径方向从内缘紫渐变到外缘青（设置后优先于 color）</span>
    </div>
    <div class="demo-page__block-body" style="height: 260px">
      <KProgressRingChart :data="DATA" :band-gradient="{ from: '#7C5CFC', to: '#00B4BE' }" :track-width="16" :height="260" />
    </div>
  </section>

  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>整圆径向渐变</span>
      <span>进度 100% 时径向渐变为完整同心环带（内缘橙 → 外缘红）</span>
    </div>
    <div class="demo-page__block-body" style="height: 260px">
      <KProgressRingChart :data="DATA_FULL" :band-gradient="{ from: '#FF9A3D', to: '#F5455C' }" :track-width="16" :height="260" />
    </div>
  </section>
</template>
