<script setup lang="ts">
import ScatterBasicDemo from './demo/scatter-chart/scatter-basic-demo.vue'
import ScatterMultiDemo from './demo/scatter-chart/scatter-multi-demo.vue'
import ScatterBubbleDemo from './demo/scatter-chart/scatter-bubble-demo.vue'
import ScatterClusterDemo from './demo/scatter-chart/scatter-cluster-demo.vue'
import ScatterDenseDemo from './demo/scatter-chart/scatter-dense-demo.vue'
</script>

<template>
  <div class="demo-page">
    <h2 class="demo-page__title">KCharts · 散点图</h2>

    <ScatterBasicDemo />
    <ScatterMultiDemo />
    <ScatterBubbleDemo />
    <ScatterClusterDemo />
    <ScatterDenseDemo />
  </div>
</template>
