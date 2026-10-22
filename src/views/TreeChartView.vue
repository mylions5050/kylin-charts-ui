<script setup lang="ts">
import TreeBasicDemo from './demo/tree-chart/tree-basic-demo.vue'
import TreeVerticalDemo from './demo/tree-chart/tree-vertical-demo.vue'
import TreeRadialDemo from './demo/tree-chart/tree-radial-demo.vue'
import TreeMultiDemo from './demo/tree-chart/tree-multi-demo.vue'
import TreeDeepDemo from './demo/tree-chart/tree-deep-demo.vue'
import TreeStyleDemo from './demo/tree-chart/tree-style-demo.vue'
</script>

<template>
  <div class="demo-page">
    <h2 class="demo-page__title">KCharts · 树图</h2>

    <TreeBasicDemo />
    <TreeVerticalDemo />
    <TreeRadialDemo />
    <TreeMultiDemo />
    <TreeDeepDemo />
    <TreeStyleDemo />
  </div>
</template>
