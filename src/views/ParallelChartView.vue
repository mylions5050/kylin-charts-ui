<script setup lang="ts">
import ParallelBasicDemo from './demo/parallel-chart/parallel-basic-demo.vue'
import ParallelDomainDemo from './demo/parallel-chart/parallel-domain-demo.vue'
import ParallelColorDemo from './demo/parallel-chart/parallel-color-demo.vue'
import ParallelManyDemo from './demo/parallel-chart/parallel-many-demo.vue'
import ParallelStyleDemo from './demo/parallel-chart/parallel-style-demo.vue'
</script>

<template>
  <div class="demo-page">
    <h2 class="demo-page__title">KCharts · 平行坐标</h2>

    <ParallelBasicDemo />
    <ParallelDomainDemo />
    <ParallelColorDemo />
    <ParallelManyDemo />
    <ParallelStyleDemo />
  </div>
</template>
