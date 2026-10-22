<script setup lang="ts">
import CalendarBasicDemo from './demo/calendar-chart/calendar-basic-demo.vue'
import CalendarWeekstartDemo from './demo/calendar-chart/calendar-weekstart-demo.vue'
import CalendarCellsizeDemo from './demo/calendar-chart/calendar-cellsize-demo.vue'
import CalendarSparseDemo from './demo/calendar-chart/calendar-sparse-demo.vue'
import CalendarRangeDemo from './demo/calendar-chart/calendar-range-demo.vue'
</script>

<template>
  <div class="demo-page">
    <h2 class="demo-page__title">KCharts · 日历热力图</h2>

    <CalendarBasicDemo />
    <CalendarWeekstartDemo />
    <CalendarCellsizeDemo />
    <CalendarSparseDemo />
    <CalendarRangeDemo />
  </div>
</template>
