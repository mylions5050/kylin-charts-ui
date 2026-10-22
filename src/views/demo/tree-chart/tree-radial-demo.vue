<script setup lang="ts">
import KTreeChart from '@/components/k-tree-chart'
import type { KTreeDatum } from '@/core/types'

/** 演示数据：前端技能树（径向布局，根居中、逐层向外） */
const DATA: KTreeDatum[] = [
  {
    name: '前端',
    children: [
      {
        name: '框架',
        children: [
          { name: 'Vue' },
          { name: 'React' },
          { name: 'Svelte' },
        ],
      },
      {
        name: '语言',
        children: [
          { name: 'TypeScript' },
          { name: 'CSS' },
          { name: 'HTML' },
        ],
      },
      {
        name: '工程化',
        children: [
          { name: 'Vite' },
          { name: 'Webpack' },
          { name: 'CI/CD' },
        ],
      },
      {
        name: '可视化',
        children: [
          { name: 'SVG' },
          { name: 'Canvas' },
          { name: 'WebGL' },
        ],
      },
    ],
  },
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>径向树图</span>
      <span>orient="radial" · 根居中逐层向外 · 径向旋转标签自动翻转</span>
    </div>
    <div class="demo-page__block-body" style="height: 340px">
      <KTreeChart :data="DATA" orient="radial" :node-gap="26" />
    </div>
  </section>
</template>
