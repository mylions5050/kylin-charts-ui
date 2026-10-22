<script setup lang="ts">
import KFunnelChart from '@/components/k-funnel-chart'
import type { KFunnelDatum } from '@/core/types'

/**
 * 演示数据：样式定制
 * - gap 12：加大层间距
 * - label=false：关闭层内/层外标签，纯图形形态
 * - 数据点级 color 覆盖品牌色
 */
const FUNNEL: KFunnelDatum[] = [
  { name: '访客', value: 980, color: '#7C5CFC' },
  { name: '加购', value: 640, color: '#B9A5FF' },
  { name: '下单', value: 400, color: '#2B6FFF' },
  { name: '支付', value: 260, color: '#F5455C' },
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>样式定制漏斗图</span>
      <span>gap 12 · 关闭标签 · 点级颜色覆盖</span>
    </div>
    <div class="demo-page__block-body">
      <KFunnelChart :data="FUNNEL" :gap="12" :label="false" title="电商下单链路" :height="340" />
    </div>
  </section>
</template>
