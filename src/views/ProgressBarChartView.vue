<script setup lang="ts">
import ProgressBarBasicDemo from './demo/progress-bar-chart/progress-bar-basic-demo.vue'
import ProgressBarColorDemo from './demo/progress-bar-chart/progress-bar-color-demo.vue'
import ProgressBarGradientDemo from './demo/progress-bar-chart/progress-bar-gradient-demo.vue'
import ProgressBarThinDemo from './demo/progress-bar-chart/progress-bar-thin-demo.vue'
import ProgressBarClampDemo from './demo/progress-bar-chart/progress-bar-clamp-demo.vue'
import ProgressBarManyDemo from './demo/progress-bar-chart/progress-bar-many-demo.vue'
</script>

<template>
  <div class="demo-page">
    <h2 class="demo-page__title">KCharts · 线性进度条</h2>

    <ProgressBarBasicDemo />
    <ProgressBarColorDemo />
    <ProgressBarGradientDemo />
    <ProgressBarThinDemo />
    <ProgressBarClampDemo />
    <ProgressBarManyDemo />
  </div>
</template>
