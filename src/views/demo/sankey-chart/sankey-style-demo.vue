<script setup lang="ts">
import KSankeyChart from '@/components/k-sankey-chart'
import type { KSankeyLink, KSankeyNode } from '@/core/types'

/**
 * 演示数据：样式定制
 * - nodeWidth 24 / nodeGap 20：更粗的节点与更宽的层内间距
 * - curvature 0.25：更「硬」的链路走向（接近折线感）
 */
const NODES: KSankeyNode[] = [
  { name: '原料采购' },
  { name: '零部件' },
  { name: '组装产线' },
  { name: '质检包装' },
  { name: '成品入库' },
]

const LINKS: KSankeyLink[] = [
  { source: '原料采购', target: '零部件', value: 600 },
  { source: '零部件', target: '组装产线', value: 560 },
  { source: '组装产线', target: '质检包装', value: 520 },
  { source: '质检包装', target: '成品入库', value: 500 },
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>样式定制桑基图</span>
      <span>nodeWidth 24 · nodeGap 20 · curvature 0.25 硬朗链路</span>
    </div>
    <div class="demo-page__block-body">
      <KSankeyChart
        :nodes="NODES"
        :links="LINKS"
        :node-width="24"
        :node-gap="20"
        :curvature="0.25"
        title="生产流水线"
        :height="360"
      />
    </div>
  </section>
</template>
