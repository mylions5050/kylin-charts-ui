<script setup lang="ts">
import KWordcloudChart from '@/components/k-wordcloud-chart'
import type { KWordcloudDatum } from '@/core/types'

/** 演示数据：电商搜索热词，高竖排比例 */
const DATA: KWordcloudDatum[] = [
  { name: '连衣裙', value: 1200 },
  { name: '运动鞋', value: 1050 },
  { name: '蓝牙耳机', value: 890 },
  { name: '手机壳', value: 760 },
  { name: '防晒霜', value: 620 },
  { name: '双肩包', value: 540 },
  { name: '机械键盘', value: 460 },
  { name: '保温杯', value: 400 },
  { name: '露营椅', value: 330 },
  { name: '筋膜枪', value: 280 },
  { name: '电竞椅', value: 240 },
  { name: '加湿器', value: 190 },
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>高竖排比例词云</span>
      <span>rotateRatio 0.8 · 八成词语 90° 竖排 · 交错排布更紧凑</span>
    </div>
    <div class="demo-page__block-body" style="height: 340px">
      <KWordcloudChart :data="DATA" :rotate-ratio="0.8" />
    </div>
  </section>
</template>
