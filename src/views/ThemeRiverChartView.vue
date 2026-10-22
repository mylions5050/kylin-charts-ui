<script setup lang="ts">
import RiverBasicDemo from './demo/theme-river-chart/river-basic-demo.vue'
import RiverWeeklyDemo from './demo/theme-river-chart/river-weekly-demo.vue'
import RiverSmoothDemo from './demo/theme-river-chart/river-smooth-demo.vue'
import RiverOpacityDemo from './demo/theme-river-chart/river-opacity-demo.vue'
import RiverSparseDemo from './demo/theme-river-chart/river-sparse-demo.vue'
</script>

<template>
  <div class="demo-page">
    <h2 class="demo-page__title">KCharts · 主题河流</h2>

    <RiverBasicDemo />
    <RiverWeeklyDemo />
    <RiverSmoothDemo />
    <RiverOpacityDemo />
    <RiverSparseDemo />
  </div>
</template>
