<script setup lang="ts">
import GaugeBasicDemo from './demo/gauge-chart/gauge-basic-demo.vue'
import GaugeStopsDemo from './demo/gauge-chart/gauge-stops-demo.vue'
import GaugeRangeDemo from './demo/gauge-chart/gauge-range-demo.vue'
import GaugeMultiDemo from './demo/gauge-chart/gauge-multi-demo.vue'
import GaugeStyleDemo from './demo/gauge-chart/gauge-style-demo.vue'
</script>

<template>
  <div class="demo-page">
    <h2 class="demo-page__title">KCharts · 仪表盘</h2>

    <GaugeBasicDemo />
    <GaugeStopsDemo />
    <GaugeRangeDemo />
    <GaugeMultiDemo />
    <GaugeStyleDemo />
  </div>
</template>
