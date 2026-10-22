<script setup lang="ts">
import KWordcloudChart from '@/components/k-wordcloud-chart'
import type { KWordcloudDatum } from '@/core/types'

/** 演示数据：少量大词场景，观察大词排版与避让 */
const DATA: KWordcloudDatum[] = [
  { name: '云岭慧婴', value: 950 },
  { name: '慧芽学堂', value: 700 },
  { name: 'AI 实训', value: 520 },
  { name: '研育', value: 380 },
  { name: '创业营', value: 260 },
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>少量大词词云</span>
      <span>仅 5 词 · 大字号铺满画布 · 螺旋退避保证互不重叠</span>
    </div>
    <div class="demo-page__block-body" style="height: 320px">
      <KWordcloudChart :data="DATA" :max-font="72" />
    </div>
  </section>
</template>
