<script setup lang="ts">
import KChordChart from '@/components/k-chord-chart'
import type { KChordLink, KChordNode } from '@/core/types'

/** 演示数据：经济体间双边贸易流（十亿美元，方向 = 出口方 → 进口方） */
const NODES: KChordNode[] = [
  { name: '中国' },
  { name: '美国' },
  { name: '欧盟' },
  { name: '东南亚' },
  { name: '日韩' },
  { name: '中东' },
  { name: '拉美' },
]
const LINKS: KChordLink[] = [
  { source: '中国', target: '美国', value: 500 },
  { source: '中国', target: '欧盟', value: 420 },
  { source: '中国', target: '东南亚', value: 380 },
  { source: '东南亚', target: '中国', value: 240 },
  { source: '中国', target: '拉美', value: 150 },
  { source: '美国', target: '欧盟', value: 380 },
  { source: '美国', target: '拉美', value: 290 },
  { source: '中东', target: '中国', value: 180 },
  { source: '中东', target: '欧盟', value: 140 },
  { source: '中东', target: '日韩', value: 95 },
  { source: '日韩', target: '美国', value: 120 },
  { source: '欧盟', target: '拉美', value: 110 },
  { source: '东南亚', target: '日韩', value: 85 },
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>贸易流和弦图</span>
      <span>双边贸易方向流 · 同对节点双向弦分开呈现 · Tooltip 显示占源端比例</span>
    </div>
    <div class="demo-page__block-body" style="height: 340px">
      <KChordChart :nodes="NODES" :links="LINKS" />
    </div>
  </section>
</template>
