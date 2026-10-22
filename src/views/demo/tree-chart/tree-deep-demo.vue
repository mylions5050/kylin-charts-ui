<script setup lang="ts">
import KTreeChart from '@/components/k-tree-chart'
import type { KTreeDatum } from '@/core/types'

/** 演示数据：前端项目源码目录（5 层深层树，叶距压缩排布） */
const DATA: KTreeDatum[] = [
  {
    name: 'kcharts/',
    children: [
      {
        name: 'src/',
        children: [
          {
            name: 'core/',
            children: [
              { name: 'chart/', children: [{ name: 'line.ts' }, { name: 'bar.ts' }, { name: 'tree.ts' }] },
              { name: 'scene/', children: [{ name: 'nodes.ts' }, { name: 'svg-renderer.ts' }] },
              { name: 'scale/', children: [{ name: 'linear.ts' }, { name: 'band.ts' }] },
            ],
          },
          {
            name: 'components/',
            children: [{ name: 'k-line-chart.tsx' }, { name: 'k-bar-chart.tsx' }, { name: 'k-tree-chart.tsx' }],
          },
          { name: 'styles/', children: [{ name: 'index.scss' }] },
        ],
      },
      { name: 'package.json' },
      { name: 'vite.config.ts' },
    ],
  },
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>深层树图</span>
      <span>5 层文件目录 · 叶距自动压缩适配 · 逐层入场动画</span>
    </div>
    <div class="demo-page__block-body" style="height: 320px">
      <KTreeChart :data="DATA" :node-gap="18" />
    </div>
  </section>
</template>
