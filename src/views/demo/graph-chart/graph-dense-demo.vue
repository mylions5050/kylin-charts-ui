<script setup lang="ts">
import KGraphChart from '@/components/k-graph-chart'
import type { KGraphLink, KGraphNode } from '@/core/types'

/**
 * 演示数据：32 人社交网络（确定性伪随机生成，value / 类目 / 链路均由公式推出）
 * 标签关闭避免重叠，节点半径压小适配高密度
 */
const N = 32
const NODES: KGraphNode[] = Array.from({ length: N }, (_, i) => ({
  name: `成员${i + 1}`,
  value: 5 + ((i * 37) % 23),
  category: i % 3,
}))
const LINKS: KGraphLink[] = []
for (let i = 0; i < N; i++) {
  for (let j = i + 1; j < N; j++) {
    if ((i * 31 + j * 17) % 97 < 12) {
      LINKS.push({ source: i, target: j, value: 1 + ((i * 7 + j * 3) % 9) })
    }
  }
}
// 头部成员与全员握手，形成枢纽
for (let i = 3; i < N; i++) {
  LINKS.push({ source: i % 3, target: i, value: 2 + (i % 5) })
}
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>高密度关系图</span>
      <span>32 节点 100+ 链路 · label 关闭 · 下标引用链路 · 紧凑力导向参数</span>
    </div>
    <div class="demo-page__block-body" style="height: 420px">
      <KGraphChart
        :nodes="NODES"
        :links="LINKS"
        :label="false"
        :node-min="4"
        :node-max="12"
        :force="{ linkDistance: 55, iterations: 360 }"
      />
    </div>
  </section>
</template>
