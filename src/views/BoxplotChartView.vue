<script setup lang="ts">
import BoxplotBasicDemo from './demo/boxplot-chart/boxplot-basic-demo.vue'
import BoxplotMultiDemo from './demo/boxplot-chart/boxplot-multi-demo.vue'
import BoxplotOutlierDemo from './demo/boxplot-chart/boxplot-outlier-demo.vue'
import BoxplotDenseDemo from './demo/boxplot-chart/boxplot-dense-demo.vue'
import BoxplotStyleDemo from './demo/boxplot-chart/boxplot-style-demo.vue'
</script>

<template>
  <div class="demo-page">
    <h2 class="demo-page__title">KCharts · 盒须图</h2>

    <BoxplotBasicDemo />
    <BoxplotMultiDemo />
    <BoxplotOutlierDemo />
    <BoxplotDenseDemo />
    <BoxplotStyleDemo />
  </div>
</template>
