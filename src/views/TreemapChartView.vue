<script setup lang="ts">
import TreemapBasicDemo from './demo/treemap-chart/treemap-basic-demo.vue'
import TreemapDeepDemo from './demo/treemap-chart/treemap-deep-demo.vue'
import TreemapColorDemo from './demo/treemap-chart/treemap-color-demo.vue'
import TreemapDenseDemo from './demo/treemap-chart/treemap-dense-demo.vue'
import TreemapMonoDemo from './demo/treemap-chart/treemap-mono-demo.vue'
</script>

<template>
  <div class="demo-page">
    <h2 class="demo-page__title">KCharts · 矩阵树图</h2>

    <TreemapBasicDemo />
    <TreemapDeepDemo />
    <TreemapColorDemo />
    <TreemapDenseDemo />
    <TreemapMonoDemo />
  </div>
</template>
