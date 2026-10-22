<script setup lang="ts">
import KCalendarChart from '@/components/k-calendar-chart'
import type { KCalendarDatum } from '@/core/types'

/** 演示数据：单月密度演示（2025-03），大格子看得清细节 */
const DATA: KCalendarDatum[] = []
{
  const start = new Date(2025, 2, 1)
  const end = new Date(2025, 2, 31)
  let i = 0
  for (let t = start.getTime(); t <= end.getTime(); t += 86400000) {
    DATA.push({ date: new Date(t).toLocaleDateString('sv-SE'), value: (i * 3457) % 100 })
    i++
  }
}
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>大格子日历图</span>
      <span>cellSize 26 + gap 5 · 单月数据 · 观察格子色阶与悬停轮廓</span>
    </div>
    <div class="demo-page__block-body" style="height: 280px">
      <KCalendarChart :data="DATA" :cell-size="26" :gap="5" />
    </div>
  </section>
</template>
