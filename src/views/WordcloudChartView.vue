<script setup lang="ts">
import WordcloudBasicDemo from './demo/wordcloud-chart/wordcloud-basic-demo.vue'
import WordcloudRotateDemo from './demo/wordcloud-chart/wordcloud-rotate-demo.vue'
import WordcloudFontDemo from './demo/wordcloud-chart/wordcloud-font-demo.vue'
import WordcloudColorDemo from './demo/wordcloud-chart/wordcloud-color-demo.vue'
import WordcloudFewDemo from './demo/wordcloud-chart/wordcloud-few-demo.vue'
</script>

<template>
  <div class="demo-page">
    <h2 class="demo-page__title">KCharts · 词云</h2>

    <WordcloudBasicDemo />
    <WordcloudRotateDemo />
    <WordcloudFontDemo />
    <WordcloudColorDemo />
    <WordcloudFewDemo />
  </div>
</template>
