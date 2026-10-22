<script setup lang="ts">
import ChordBasicDemo from './demo/chord-chart/chord-basic-demo.vue'
import ChordColorDemo from './demo/chord-chart/chord-color-demo.vue'
import ChordHubDemo from './demo/chord-chart/chord-hub-demo.vue'
import ChordTradeDemo from './demo/chord-chart/chord-trade-demo.vue'
import ChordDenseDemo from './demo/chord-chart/chord-dense-demo.vue'
</script>

<template>
  <div class="demo-page">
    <h2 class="demo-page__title">KCharts · 和弦图</h2>

    <ChordBasicDemo />
    <ChordColorDemo />
    <ChordHubDemo />
    <ChordTradeDemo />
    <ChordDenseDemo />
  </div>
</template>
