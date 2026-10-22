<script setup lang="ts">
import KBoxplotChart from '@/components/k-boxplot-chart'
import { computeBoxStats } from '@/core/chart/boxplot-chart'
import type { KBoxplotDatum, KBoxplotSeries } from '@/core/types'

/** 原始样本 → 五数概括（1.5 倍 IQR 准则识别异常点） */
const toSeriesData = (groups: number[][]): KBoxplotDatum[] =>
  groups.map(computeBoxStats).filter((b): b is NonNullable<typeof b> => b !== null)

/** 演示数据：五个班级的一次考试成绩原始样本 */
const LABELS = ['一班', '二班', '三班', '四班', '五班']
const SERIES: KBoxplotSeries[] = [
  {
    name: '成绩',
    data: toSeriesData([
      [72, 85, 78, 90, 88, 76, 94, 82, 69, 81, 87, 79],
      [65, 74, 81, 70, 92, 77, 68, 85, 73, 79, 88, 75],
      [88, 92, 79, 95, 84, 90, 71, 86, 93, 82, 89, 78],
      [60, 72, 68, 75, 83, 70, 66, 79, 74, 81, 69, 77],
      [91, 84, 96, 88, 79, 93, 87, 95, 82, 90, 85, 92],
    ]),
  },
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>基础盒须图</span>
      <span>原始样本经 computeBoxStats 计算五数概括 · 悬停查看中位数 / 四分位 / 须范围</span>
    </div>
    <div class="demo-page__block-body" style="height: 320px">
      <KBoxplotChart :labels="LABELS" :series="SERIES" :y-axis="{ name: '分数' }" />
    </div>
  </section>
</template>
