<script setup lang="ts">
import KBarChart from '@/components/k-bar-chart'
import type { KBarSeries } from '@/core/types'

/**
 * x 轴类目文案过长的常见解法：labelRotate 倾斜标签。
 * 正数向右倾斜（"/" 形，如 45），负数向左（"\" 形），
 * 底部空间按最长标签自动预留，无需手动调 padding
 */
const LABELS = ['北京经济技术开发区', '上海张江高科技园区', '深圳高新技术产业带', '杭州未来科技城', '广州人工智能与数字', '成都天府软件园', '武汉光谷高新区']

const SERIES: KBarSeries[] = [
  { name: '入驻企业数', data: [3200, 4100, 3800, 2600, 2900, 2200, 2400] },
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>x 轴标签倾斜</span>
      <span>xAxis.labelRotate 自定义倾斜角度 · 正数"/" 负数"\" · 底部空间自动预留</span>
    </div>
    <div class="demo-page__block-body" style="height: 380px">
      <KBarChart
        :labels="LABELS"
        :series="SERIES"
        :x-axis="{ labelRotate: 45 }"
        legend
      />
    </div>
    <div class="demo-page__block-body" style="height: 380px">
      <KBarChart
        :labels="LABELS"
        :series="SERIES"
        :x-axis="{ labelRotate: -45 }"
        legend
      />
    </div>
  </section>
</template>
