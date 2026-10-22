<script setup lang="ts">
import KCalendarChart from '@/components/k-calendar-chart'
import type { KCalendarDatum } from '@/core/types'

/** 演示数据：稀疏打卡记录（仅工作日有提交，缺日留白） */
const DATA: KCalendarDatum[] = []
{
  const start = new Date(2025, 5, 1)
  const end = new Date(2025, 8, 30)
  let i = 0
  for (let t = start.getTime(); t <= end.getTime(); t += 86400000) {
    const d = new Date(t)
    const dow = d.getDay()
    if (dow !== 0 && dow !== 6 && i % 7 !== 3) {
      DATA.push({ date: d.toLocaleDateString('sv-SE'), value: (i * 5501) % 80 })
    }
    i++
  }
}
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>稀疏数据日历图</span>
      <span>无数据日期留白（空档灰） · 只渲染有值格子 · 周一起始</span>
    </div>
    <div class="demo-page__block-body" style="height: 200px">
      <KCalendarChart :data="DATA" :week-start="1" />
    </div>
  </section>
</template>
