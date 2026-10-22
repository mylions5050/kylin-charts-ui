<script setup lang="ts">
import KCalendarChart from '@/components/k-calendar-chart'
import type { KCalendarDatum } from '@/core/types'

/** 生成 2025 全年确定性伪随机活跃度 */
const DATA: KCalendarDatum[] = []
{
  const start = new Date(2025, 0, 1)
  const end = new Date(2025, 11, 31)
  let i = 0
  for (let t = start.getTime(); t <= end.getTime(); t += 86400000) {
    const v = (i * 7919) % 100
    const dow = new Date(t).getDay()
    // 周末活跃度整体偏低，更贴近真实打卡数据
    DATA.push({
      date: new Date(t).toLocaleDateString('sv-SE'),
      value: dow === 0 || dow === 6 ? Math.round(v * 0.4) : v,
    })
    i++
  }
}
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>基础日历热力图</span>
      <span>2025 全年 · 周日起始 · 默认紫阶四档色标 · 月份自动标记</span>
    </div>
    <div class="demo-page__block-body" style="height: 200px">
      <KCalendarChart :data="DATA" />
    </div>
  </section>
</template>
