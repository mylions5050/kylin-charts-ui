<script setup lang="ts">
import RoseRadiusDemo from './demo/rose-chart/rose-radius-demo.vue'
import RoseAreaDemo from './demo/rose-chart/rose-area-demo.vue'
import RoseRingDemo from './demo/rose-chart/rose-ring-demo.vue'
import RoseRoundGapDemo from './demo/rose-chart/rose-round-gap-demo.vue'
import RoseBorderlessDemo from './demo/rose-chart/rose-borderless-demo.vue'
</script>

<template>
  <div class="demo-page">
    <h2 class="demo-page__title">KCharts · 玫瑰图</h2>

    <RoseRadiusDemo />
    <RoseAreaDemo />
    <RoseRingDemo />
    <RoseRoundGapDemo />
    <RoseBorderlessDemo />
  </div>
</template>
