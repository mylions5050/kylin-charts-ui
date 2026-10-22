<script setup lang="ts">
import CandlestickBasicDemo from './demo/candlestick-chart/candlestick-basic-demo.vue'
import CandlestickMaDemo from './demo/candlestick-chart/candlestick-ma-demo.vue'
import CandlestickColorDemo from './demo/candlestick-chart/candlestick-color-demo.vue'
import CandlestickDojiDemo from './demo/candlestick-chart/candlestick-doji-demo.vue'
import CandlestickDenseDemo from './demo/candlestick-chart/candlestick-dense-demo.vue'
</script>

<template>
  <div class="demo-page">
    <h2 class="demo-page__title">KCharts · K 线图</h2>

    <CandlestickBasicDemo />
    <CandlestickMaDemo />
    <CandlestickColorDemo />
    <CandlestickDojiDemo />
    <CandlestickDenseDemo />
  </div>
</template>
