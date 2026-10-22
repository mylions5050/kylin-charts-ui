<script setup lang="ts">
import KMapChart from '@/components/k-map-chart'
import type { KMapDatum } from '@/core/chart/map-chart'
import type { GeoFeatureCollection } from '@/core/utils/geo'
import australiaGeoJson from './data/australia.json'

/** 2024 各州/领地人口（百万人，示意数据，按 name 与 GeoJSON 匹配） */
const DATA: KMapDatum[] = [
  { name: 'New South Wales', value: 8.3 },
  { name: 'Victoria', value: 6.9 },
  { name: 'Queensland', value: 5.6 },
  { name: 'Western Australia', value: 3.0 },
  { name: 'South Australia', value: 1.9 },
  { name: 'Tasmania', value: 0.58 },
  { name: 'Australian Capital Territory', value: 0.47 },
  { name: 'Northern Territory', value: 0.25 },
  { name: 'Other Territories', value: 0.2 },
]

const GEO = australiaGeoJson as GeoFeatureCollection
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>基础澳大利亚地图</span>
      <span>mercator 投影 · 州级 choropleth · 数据按州名（英文）匹配 GeoJSON · 悬停高亮 + tooltip</span>
    </div>
    <div class="demo-page__block-body" style="height: 480px">
      <KMapChart :geo-json="GEO" :data="DATA" projection="mercator" />
    </div>
  </section>
</template>
