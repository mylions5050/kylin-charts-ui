<script setup lang="ts">
import PackingBasicDemo from './demo/circle-packing-chart/packing-basic-demo.vue'
import PackingFlatDemo from './demo/circle-packing-chart/packing-flat-demo.vue'
import PackingGapDemo from './demo/circle-packing-chart/packing-gap-demo.vue'
import PackingDeepDemo from './demo/circle-packing-chart/packing-deep-demo.vue'
import PackingLabelDemo from './demo/circle-packing-chart/packing-label-demo.vue'
</script>

<template>
  <div class="demo-page">
    <h2 class="demo-page__title">KCharts · 打包图</h2>

    <PackingBasicDemo />
    <PackingFlatDemo />
    <PackingGapDemo />
    <PackingDeepDemo />
    <PackingLabelDemo />
  </div>
</template>
