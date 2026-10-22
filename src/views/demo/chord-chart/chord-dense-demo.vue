<script setup lang="ts">
import KChordChart from '@/components/k-chord-chart'
import type { KChordLink, KChordNode } from '@/core/types'

/** 演示数据：十个微服务调用关系（高密度弦，间隙角压缩到 1.5°） */
const SERVICES = ['网关', '用户', '订单', '商品', '库存', '支付', '营销', '搜索', '推荐', '消息']
const NODES: KChordNode[] = SERVICES.map((name) => ({ name }))

/** 固定种子伪随机：生成形态稳定的高密度调用矩阵 */
let seed = 88
const nextRand = (): number => {
  seed = (seed * 9301 + 49297) % 233280
  return seed / 233280
}

const LINKS: KChordLink[] = []
for (let i = 0; i < SERVICES.length; i++) {
  for (let j = i + 1; j < SERVICES.length; j++) {
    const r = nextRand()
    if (r < 0.45) continue
    LINKS.push({ source: SERVICES[i], target: SERVICES[j], value: Math.round(5 + r * 60) })
  }
}
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>高密度和弦图</span>
      <span>10 节点服务调用矩阵 · padAngle 压缩至 1.5° · 径向标签防重叠</span>
    </div>
    <div class="demo-page__block-body" style="height: 360px">
      <KChordChart :nodes="NODES" :links="LINKS" :pad-angle="1.5" />
    </div>
  </section>
</template>
