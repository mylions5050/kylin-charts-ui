<script setup lang="ts">
import SankeyBasicDemo from './demo/sankey-chart/sankey-basic-demo.vue'
import SankeyDeepDemo from './demo/sankey-chart/sankey-deep-demo.vue'
import SankeyBranchDemo from './demo/sankey-chart/sankey-branch-demo.vue'
import SankeyColorDemo from './demo/sankey-chart/sankey-color-demo.vue'
import SankeyStyleDemo from './demo/sankey-chart/sankey-style-demo.vue'
import SankeyVerticalDemo from './demo/sankey-chart/sankey-vertical-demo.vue'
</script>

<template>
  <div class="demo-page">
    <h2 class="demo-page__title">KCharts · 桑基图</h2>

    <SankeyBasicDemo />
    <SankeyDeepDemo />
    <SankeyBranchDemo />
    <SankeyColorDemo />
    <SankeyStyleDemo />
    <SankeyVerticalDemo />
  </div>
</template>
