<script setup lang="ts">
import KPieChart from '@/components/k-pie-chart'
import type { KPieDatum } from '@/core/types'

/** 演示数据：品类销量占比 */
const CATEGORIES: KPieDatum[] = [
  { name: '数码家电', value: 420 },
  { name: '服饰鞋包', value: 360 },
  { name: '美妆个护', value: 280 },
  { name: '食品生鲜', value: 220 },
  { name: '家居日用', value: 130 },
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>圆角 + 间距饼图</span>
      <span>item-radius 扇区圆角（px，四角自动倒圆）+ item-gap 扇区间距（度，两端各收一半）</span>
    </div>
    <div class="demo-page__block-body">
      <KPieChart :data="CATEGORIES" title="品类销量占比" legend :item-radius="12" :item-gap="3" :height="340" />
    </div>
  </section>
</template>
