<script setup lang="ts">
import KSunburstChart from '@/components/k-sunburst-chart'
import type { KSunburstDatum } from '@/core/types'

/**
 * 演示数据：单色系旭日图（对齐 ECharts Monochrome Sunburst 示例风格）
 * 顶层只给一个色，全部子级继承并随层级降透明度，同色深浅表达层级
 */
const DATA: KSunburstDatum[] = [
  {
    name: '研发投入',
    color: '#7C5CFC',
    children: [
      {
        name: '平台研发',
        children: [
          { name: '核心框架', value: 300 },
          { name: '工具链', value: 220 },
        ],
      },
      { name: '应用研发', value: 380 },
      { name: '创新探索', value: 160 },
    ],
  },
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>单色系旭日图</span>
      <span>顶层单色 · 子级继承降透明度 · 同色深浅表达层级</span>
    </div>
    <div class="demo-page__block-body" style="height: 280px">
      <KSunburstChart :data="DATA" :inner-radius="0.2" title="研发投入构成" />
    </div>
  </section>
</template>
