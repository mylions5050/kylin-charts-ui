<script setup lang="ts">
import KPieChart from '@/components/k-pie-chart'
import type { KPieDatum } from '@/core/types'

/** 演示数据：渠道占比 */
const CHANNELS: KPieDatum[] = [
  { name: '直接访问', value: 335 },
  { name: '搜索引擎', value: 310 },
  { name: '外部链接', value: 234 },
  { name: '社交媒体', value: 155 },
  { name: '广告投放', value: 98 },
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>无边框饼图</span>
      <span>item-border="false" 关闭扇区白色描边，扇区纯色相接（默认展示 1px 白边）</span>
    </div>
    <div class="demo-page__block-body">
      <KPieChart :data="CHANNELS" title="访问渠道来源" legend :item-border="false" :height="340" />
    </div>
  </section>
</template>
