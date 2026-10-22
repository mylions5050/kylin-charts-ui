<script setup lang="ts">
import BarFullDemo from './demo/bar-chart/bar-full-demo.vue'
import BarBasicDemo from './demo/bar-chart/bar-basic-demo.vue'
import BarMarkedDemo from './demo/bar-chart/bar-marked-demo.vue'
import BarStackedDemo from './demo/bar-chart/bar-stacked-demo.vue'
import BarHorizontalDemo from './demo/bar-chart/bar-horizontal-demo.vue'
import BarHorizontalStackedDemo from './demo/bar-chart/bar-horizontal-stacked-demo.vue'
import BarBackgroundDemo from './demo/bar-chart/bar-background-demo.vue'
import BarAnimationDelayDemo from './demo/bar-chart/bar-animation-delay-demo.vue'
import BarWaterfallDemo from './demo/bar-chart/bar-waterfall-demo.vue'
import BarStaggerDemo from './demo/bar-chart/bar-stagger-demo.vue'
import BarPercentDemo from './demo/bar-chart/bar-percent-demo.vue'
import BarLineDemo from './demo/bar-chart/bar-line-demo.vue'
import BarMarklineDemo from './demo/bar-chart/bar-markline-demo.vue'
import BarDatazoomDemo from './demo/bar-chart/bar-datazoom-demo.vue'
</script>

<template>
  <div class="demo-page">
    <h2 class="demo-page__title">KCharts · 柱形图</h2>

    <BarFullDemo />
    <BarBasicDemo />
    <BarStackedDemo />
    <BarHorizontalDemo />
    <BarHorizontalStackedDemo />
    <BarMarkedDemo />
    <BarBackgroundDemo />
    <BarAnimationDelayDemo />
    <BarWaterfallDemo />
    <BarStaggerDemo />
    <BarPercentDemo />
    <BarLineDemo />
    <BarMarklineDemo />
    <BarDatazoomDemo />
  </div>
</template>
