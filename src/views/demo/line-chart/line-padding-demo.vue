<script setup lang="ts">
import KLineChart from '@/components/k-line-chart'
import type { KLineSeries } from '@/core/types'

/**
 * 画布内边距 padding（对齐 ECharts grid 职责）：
 * 每张图都有按轴标签预留的默认内边距；padding 属性传 Partial<Padding> 可按边覆盖，
 * 只传部分边时其余边保持默认（左图默认，右图自定义）
 */
const SERIES: KLineSeries[] = [
  { name: '销售额', data: [820, 932, 901, 1290, 1330, 1520] },
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>画布内边距 padding</span>
      <span>所有图表均有默认内边距 · padding 按边覆盖 · 只传部分边其余保持默认</span>
    </div>
    <div class="demo-page__block-body" style="height: 320px">
      <KLineChart
        :labels="['周一', '周二', '周三', '周四', '周五', '周六']"
        :series="SERIES"
        title="默认内边距"
        legend
      />
    </div>
    <div class="demo-page__block-body" style="height: 320px">
      <KLineChart
        :labels="['周一', '周二', '周三', '周四', '周五', '周六']"
        :series="SERIES"
        :padding="{ left: 120, top: 80, right: 100 }"
        title="自定义内边距（left:120 / top:80 / right:100）"
        legend
      />
    </div>
  </section>
</template>
