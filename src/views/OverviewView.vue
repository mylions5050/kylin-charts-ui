<template>
  <div class="overview-page">
    <section class="overview-page__hero">
      <h1 class="overview-page__title">KCharts</h1>
      <p class="overview-page__slogan">轻量级 Vue3 + TypeScript 图表库 · 场景图驱动的 SVG 渲染</p>
      <p class="overview-page__stats">{{ chartTotal }} 种图表 · {{ demoTotal }} 个测试用例</p>
    </section>
    <section v-for="group in CHART_GROUPS" :key="group.label" class="overview-page__group">
      <h2 class="overview-page__group-title">{{ group.label }}</h2>
      <div class="overview-page__grid">
        <router-link
          v-for="chart in group.charts"
          :key="chart.slug"
          class="overview-page__card"
          :to="`/chart/${chart.slug}`"
        >
          <div class="overview-page__card-preview">
            <LazyMount :min-height="230">
              <component :is="MINI_PREVIEWS[chart.slug]" />
            </LazyMount>
          </div>
          <div class="overview-page__card-footer">
            <span class="overview-page__card-title">{{ chart.title }}</span>
            <span class="overview-page__card-count">{{ getDemos(chart.slug).length }} 例</span>
          </div>
        </router-link>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { CHART_GROUPS, getDemos } from '@/site/registry'
import LazyMount from '@/site/LazyMount'
import { MINI_PREVIEWS } from '@/site/previews'

const chartTotal = CHART_GROUPS.reduce((sum, g) => sum + g.charts.length, 0)
const demoTotal = CHART_GROUPS.reduce(
  (sum, g) => sum + g.charts.reduce((s, c) => s + getDemos(c.slug).length, 0),
  0,
)
</script>
