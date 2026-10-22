<script setup lang="ts">
import KWordcloudChart from '@/components/k-wordcloud-chart'
import type { KWordcloudDatum } from '@/core/types'

/** 演示数据：技术社区热词（词频决定字号） */
const DATA: KWordcloudDatum[] = [
  { name: 'TypeScript', value: 980 },
  { name: 'Vue3', value: 860 },
  { name: 'React', value: 820 },
  { name: 'Vite', value: 640 },
  { name: '性能优化', value: 520 },
  { name: '组件库', value: 480 },
  { name: '低代码', value: 430 },
  { name: '微前端', value: 390 },
  { name: 'AI 编程', value: 360 },
  { name: 'SSR', value: 320 },
  { name: 'WebGL', value: 280 },
  { name: '可视化', value: 250 },
  { name: '单测', value: 210 },
  { name: 'CI/CD', value: 190 },
  { name: 'Monorepo', value: 170 },
  { name: '桌面端', value: 140 },
  { name: '小程序', value: 130 },
  { name: '跨端', value: 110 },
  { name: '无障碍', value: 90 },
  { name: '国际化', value: 80 },
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>基础词云</span>
      <span>字号 √value 映射 · 35% 词语竖排 · 阿基米德螺旋布局避让碰撞</span>
    </div>
    <div class="demo-page__block-body" style="height: 340px">
      <KWordcloudChart :data="DATA" />
    </div>
  </section>
</template>
