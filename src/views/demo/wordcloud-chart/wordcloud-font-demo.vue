<script setup lang="ts">
import KWordcloudChart from '@/components/k-wordcloud-chart'
import type { KWordcloudDatum } from '@/core/types'

/** 演示数据：拉大字号区间，突出头部词与尾部词的反差 */
const DATA: KWordcloudDatum[] = [
  { name: '大模型', value: 3000 },
  { name: 'RAG', value: 1400 },
  { name: 'Agent', value: 1100 },
  { name: '多模态', value: 800 },
  { name: '微调', value: 600 },
  { name: '向量库', value: 450 },
  { name: 'Prompt', value: 380 },
  { name: '蒸馏', value: 260 },
  { name: '量化', value: 210 },
  { name: '对齐', value: 150 },
  { name: '推理加速', value: 120 },
  { name: '数据清洗', value: 90 },
  { name: '评测集', value: 70 },
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>大字号对比词云</span>
      <span>minFont 12 / maxFont 84 · 头尾字号悬殊 · 90px 级大词仍不越界</span>
    </div>
    <div class="demo-page__block-body" style="height: 340px">
      <KWordcloudChart :data="DATA" :min-font="12" :max-font="84" />
    </div>
  </section>
</template>
