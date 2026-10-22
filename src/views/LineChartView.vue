<script setup lang="ts">
import LineFullDemo from './demo/line-chart/line-full-demo.vue'
import LineBasicDemo from './demo/line-chart/line-basic-demo.vue'
import LineAreaDemo from './demo/line-chart/line-area-demo.vue'
import LineMarkedDemo from './demo/line-chart/line-marked-demo.vue'
import LineStepDemo from './demo/line-chart/line-step-demo.vue'
import LineBoundaryDemo from './demo/line-chart/line-boundary-demo.vue'
import LineStackDemo from './demo/line-chart/line-stack-demo.vue'
import LineBumpDemo from './demo/line-chart/line-bump-demo.vue'
import LineAqiDemo from './demo/line-chart/line-aqi-demo.vue'
import LineMultiAxisDemo from './demo/line-chart/line-multi-axis-demo.vue'
import LineFunctionDemo from './demo/line-chart/line-function-demo.vue'
import LineLogDemo from './demo/line-chart/line-log-demo.vue'
import LineVerticalDemo from './demo/line-chart/line-vertical-demo.vue'
import LineMarkLineDemo from './demo/line-chart/line-markline-demo.vue'
import LineDataZoomDemo from './demo/line-chart/line-datazoom-demo.vue'
</script>

<template>
  <div class="demo-page">
    <h2 class="demo-page__title">KCharts · 折线图</h2>

    <LineFullDemo />
    <LineBasicDemo />
    <LineAreaDemo />
    <LineMarkedDemo />
    <LineStepDemo />
    <LineBoundaryDemo />
    <LineStackDemo />
    <LineBumpDemo />
    <LineAqiDemo />
    <LineMultiAxisDemo />
    <LineFunctionDemo />
    <LineLogDemo />
    <LineVerticalDemo />
    <LineMarkLineDemo />
    <LineDataZoomDemo />
  </div>
</template>
