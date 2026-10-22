<script setup lang="ts">
import FunnelBasicDemo from './demo/funnel-chart/funnel-basic-demo.vue'
import FunnelSortDemo from './demo/funnel-chart/funnel-sort-demo.vue'
import FunnelNoneDemo from './demo/funnel-chart/funnel-none-demo.vue'
import FunnelAlignDemo from './demo/funnel-chart/funnel-align-demo.vue'
import FunnelStyleDemo from './demo/funnel-chart/funnel-style-demo.vue'
import FunnelTriangleDemo from './demo/funnel-chart/funnel-triangle-demo.vue'
import FunnelPyramidDemo from './demo/funnel-chart/funnel-pyramid-demo.vue'
import FunnelSquareDemo from './demo/funnel-chart/funnel-square-demo.vue'
import FunnelCircleDemo from './demo/funnel-chart/funnel-circle-demo.vue'
</script>

<template>
  <div class="demo-page">
    <h2 class="demo-page__title">KCharts · 漏斗图</h2>

    <FunnelBasicDemo />
    <FunnelSortDemo />
    <FunnelNoneDemo />
    <FunnelAlignDemo />
    <FunnelStyleDemo />
    <FunnelTriangleDemo />
    <FunnelPyramidDemo />
    <FunnelSquareDemo />
    <FunnelCircleDemo />
  </div>
</template>
