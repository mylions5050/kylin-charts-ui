<script setup lang="ts">
import RingBasicDemo from './demo/ring-chart/ring-basic-demo.vue'
import RingRadialDemo from './demo/ring-chart/ring-radial-demo.vue'
import RingRoundGapDemo from './demo/ring-chart/ring-round-gap-demo.vue'
import RingSemiDemo from './demo/ring-chart/ring-semi-demo.vue'
import RingThinDemo from './demo/ring-chart/ring-thin-demo.vue'
</script>

<template>
  <div class="demo-page">
    <h2 class="demo-page__title">KCharts · 环形图</h2>

    <RingBasicDemo />
    <RingRadialDemo />
    <RingSemiDemo />
    <RingThinDemo />
    <RingRoundGapDemo />
  </div>
</template>
