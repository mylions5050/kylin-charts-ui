<script setup lang="ts">
import KCalendarChart from '@/components/k-calendar-chart'
import type { KCalendarDatum } from '@/core/types'

/** 演示数据：2024-11 ~ 2025-02 跨年四个月 */
const DATA: KCalendarDatum[] = []
{
  const start = new Date(2024, 10, 1)
  const end = new Date(2025, 1, 28)
  let i = 0
  for (let t = start.getTime(); t <= end.getTime(); t += 86400000) {
    DATA.push({ date: new Date(t).toLocaleDateString('sv-SE'), value: (i * 4099) % 95 })
    i++
  }
}
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>跨年范围日历图</span>
      <span>2024-11 ~ 2025-02 连续四个月 · 月份标记跨年切换 · 容器过窄时格子自适应缩小</span>
    </div>
    <div class="demo-page__block-body" style="height: 200px">
      <KCalendarChart :data="DATA" />
    </div>
  </section>
</template>
