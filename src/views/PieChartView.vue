<script setup lang="ts">
import PieAlignDemo from './demo/pie-chart/pie-align-demo.vue'
import PieBasicDemo from './demo/pie-chart/pie-basic-demo.vue'
import PieBorderlessDemo from './demo/pie-chart/pie-borderless-demo.vue'
import PieColorDemo from './demo/pie-chart/pie-color-demo.vue'
import PieRoundGapDemo from './demo/pie-chart/pie-round-gap-demo.vue'
import PieScrollDemo from './demo/pie-chart/pie-scroll-demo.vue'
import PieSingleDemo from './demo/pie-chart/pie-single-demo.vue'
</script>

<template>
  <div class="demo-page">
    <h2 class="demo-page__title">KCharts · 饼图</h2>

    <PieBasicDemo />
    <PieAlignDemo />
    <PieScrollDemo />
    <PieColorDemo />
    <PieSingleDemo />
    <PieBorderlessDemo />
    <PieRoundGapDemo />
  </div>
</template>
