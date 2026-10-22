<script setup lang="ts">
import GraphBasicDemo from './demo/graph-chart/graph-basic-demo.vue'
import GraphCircularDemo from './demo/graph-chart/graph-circular-demo.vue'
import GraphFixedDemo from './demo/graph-chart/graph-fixed-demo.vue'
import GraphCategoriesDemo from './demo/graph-chart/graph-categories-demo.vue'
import GraphDenseDemo from './demo/graph-chart/graph-dense-demo.vue'
import GraphStyleDemo from './demo/graph-chart/graph-style-demo.vue'
</script>

<template>
  <div class="demo-page">
    <h2 class="demo-page__title">KCharts · 关系图</h2>

    <GraphBasicDemo />
    <GraphCircularDemo />
    <GraphFixedDemo />
    <GraphCategoriesDemo />
    <GraphDenseDemo />
    <GraphStyleDemo />
  </div>
</template>
