<script setup lang="ts">
import MultiRingBasicDemo from './demo/multi-ring-chart/multi-ring-basic-demo.vue'
import MultiRingColorDemo from './demo/multi-ring-chart/multi-ring-color-demo.vue'
import MultiRingNosummaryDemo from './demo/multi-ring-chart/multi-ring-nosummary-demo.vue'
import MultiRingThickDemo from './demo/multi-ring-chart/multi-ring-thick-demo.vue'
import MultiRingFullDemo from './demo/multi-ring-chart/multi-ring-full-demo.vue'
</script>

<template>
  <div class="demo-page">
    <h2 class="demo-page__title">KCharts · 多层进度环</h2>

    <MultiRingBasicDemo />
    <MultiRingColorDemo />
    <MultiRingNosummaryDemo />
    <MultiRingThickDemo />
    <MultiRingFullDemo />
  </div>
</template>
