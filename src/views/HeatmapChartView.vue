<script setup lang="ts">
import HeatmapBasicDemo from './demo/heatmap-chart/heatmap-basic-demo.vue'
import HeatmapColorrangeDemo from './demo/heatmap-chart/heatmap-colorrange-demo.vue'
import HeatmapDenseDemo from './demo/heatmap-chart/heatmap-dense-demo.vue'
import HeatmapSparseDemo from './demo/heatmap-chart/heatmap-sparse-demo.vue'
import HeatmapCorrDemo from './demo/heatmap-chart/heatmap-corr-demo.vue'
</script>

<template>
  <div class="demo-page">
    <h2 class="demo-page__title">KCharts · 热力图</h2>

    <HeatmapBasicDemo />
    <HeatmapColorrangeDemo />
    <HeatmapDenseDemo />
    <HeatmapSparseDemo />
    <HeatmapCorrDemo />
  </div>
</template>
