<script setup lang="ts">
import KRoseChart from '@/components/k-rose-chart'
import type { KPieDatum } from '@/core/types'

/** 演示数据：radius 模式 + 圆角/间距/无边框组合 */
const RADIUS_DATA: KPieDatum[] = [
  { name: '北京', value: 420 },
  { name: '上海', value: 380 },
  { name: '广州', value: 300 },
  { name: '深圳', value: 260 },
  { name: '杭州', value: 180 },
  { name: '成都', value: 120 },
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>玫瑰图 · 圆角 + 间距 + 无边框</span>
      <span>item-radius 扇区圆角 + item-gap 间距 + item-border="false" 无边框组合（radius 模式）</span>
    </div>
    <div class="demo-page__block-body">
      <KRoseChart
        :data="RADIUS_DATA"
        title="城市销量对比"
        legend
        rose-type="radius"
        :item-radius="10"
        :item-gap="4"
        :item-border="false"
        :height="380"
      />
    </div>
  </section>
</template>
