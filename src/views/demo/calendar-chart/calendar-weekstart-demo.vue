<script setup lang="ts">
import KCalendarChart from '@/components/k-calendar-chart'
import type { KCalendarDatum } from '@/core/types'

/** 生成 2025 上半年数据 */
const DATA: KCalendarDatum[] = []
{
  const start = new Date(2025, 0, 1)
  const end = new Date(2025, 5, 30)
  let i = 0
  for (let t = start.getTime(); t <= end.getTime(); t += 86400000) {
    DATA.push({ date: new Date(t).toLocaleDateString('sv-SE'), value: (i * 6151) % 90 })
    i++
  }
}
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>周一起始日历图</span>
      <span>weekStart 1 · 行序变为周一~周日 · 上半年数据 · 更粗的 18px 单元格</span>
    </div>
    <div class="demo-page__block-body" style="height: 200px">
      <KCalendarChart :data="DATA" :week-start="1" :cell-size="18" />
    </div>
  </section>
</template>
