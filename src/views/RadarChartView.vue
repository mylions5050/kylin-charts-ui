<script setup lang="ts">
import RadarBasicDemo from './demo/radar-chart/radar-basic-demo.vue'
import RadarCircleDemo from './demo/radar-chart/radar-circle-demo.vue'
import RadarMultiDemo from './demo/radar-chart/radar-multi-demo.vue'
import RadarEdgeDemo from './demo/radar-chart/radar-edge-demo.vue'
</script>

<template>
  <div class="demo-page">
    <h2 class="demo-page__title">KCharts · 雷达图</h2>

    <RadarBasicDemo />
    <RadarCircleDemo />
    <RadarMultiDemo />
    <RadarEdgeDemo />
  </div>
</template>
