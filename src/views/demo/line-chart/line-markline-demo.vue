<script setup lang="ts">
import KLineChart from '@/components/k-line-chart'
import type { KLineSeries } from '@/core/types'

/** 演示数据：markLine 三种形态（yAxis 阈值 / average 均值 / xAxis 类目垂直线） */
const LABELS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
const SERIES: KLineSeries[] = [
  {
    name: '邮件营销',
    data: [120, 132, 101, 134, 90, 230, 210],
    markLine: {
      data: [
        { type: 'average' },
        { xAxis: '周四', label: '活动开始' },
      ],
    },
  },
  {
    name: '联盟广告',
    data: [220, 182, 191, 234, 290, 330, 310],
    markLine: {
      data: [{ yAxis: 300, label: '目标 300', color: '#F5455C' }],
    },
  },
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>markLine 标线</span>
      <span>系列级 markLine：type average 均值线、yAxis 阈值线、xAxis 类目垂直线，虚线 + 端部文案</span>
    </div>
    <div class="demo-page__block-body" style="height: 320px">
      <KLineChart :labels="LABELS" :series="SERIES" legend />
    </div>
  </section>
</template>
