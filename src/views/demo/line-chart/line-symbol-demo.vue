<script setup lang="ts">
import KLineChart from '@/components/k-line-chart'
import type { KLineSeries } from '@/core/types'

/**
 * 自定义数据点符号（对齐 ECharts line-marker 示例）：
 * series.symbol 形状 + symbolSize 大小 + symbolRotate 旋转，缺省 emptyCircle 白心圆环
 */
const SERIES: KLineSeries[] = [
  { name: 'circle', symbol: 'circle', symbolSize: 10, data: [120, 132, 101, 134, 90, 230, 210] },
  { name: 'rect', symbol: 'rect', symbolSize: 10, data: [220, 182, 191, 234, 290, 330, 310] },
  { name: 'triangle', symbol: 'triangle', symbolSize: 12, data: [150, 232, 201, 154, 190, 330, 410] },
  { name: 'diamond', symbol: 'diamond', symbolSize: 12, data: [320, 332, 301, 334, 390, 330, 320] },
  { name: 'pin', symbol: 'pin', symbolSize: 16, data: [420, 432, 401, 434, 490, 430, 420] },
  { name: 'arrow', symbol: 'arrow', symbolSize: 12, data: [520, 532, 501, 534, 490, 530, 520] },
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>自定义数据点符号</span>
      <span>series.symbol / symbolSize / symbolRotate · 对齐 ECharts line-marker 示例 · none 可隐藏点</span>
    </div>
    <div class="demo-page__block-body" style="height: 400px">
      <KLineChart
        :labels="['周一', '周二', '周三', '周四', '周五', '周六', '周日']"
        :series="SERIES"
        legend
      />
    </div>
  </section>
</template>
