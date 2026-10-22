<script setup lang="ts">
import { computed } from 'vue'
import KMapChart from '@/components/k-map-chart'
import type { KMapDatum } from '@/core/chart/map-chart'
import type { GeoFeatureCollection } from '@/core/utils/geo'
import usaGeoJson from './data/usa.json'

/** 阿拉斯加/夏威夷/波多黎各离本土太远，会挤压主大陆观感，演示中剔除（保留本土 + 首都） */
const EXCLUDE = new Set(['Alaska', 'Hawaii', 'Puerto Rico'])
const RAW = usaGeoJson as GeoFeatureCollection
const GEO: GeoFeatureCollection = {
  ...RAW,
  features: RAW.features.filter((f) => !EXCLUDE.has(String(f.properties.name ?? ''))),
}

/** 2024 各州人口（百万人，示意数据，按 name 与 GeoJSON 匹配） */
const DATA: KMapDatum[] = [
  { name: 'California', value: 39.4 },
  { name: 'Texas', value: 31.3 },
  { name: 'Florida', value: 23.4 },
  { name: 'New York', value: 19.7 },
  { name: 'Pennsylvania', value: 13.1 },
  { name: 'Illinois', value: 12.7 },
  { name: 'Ohio', value: 11.9 },
  { name: 'Georgia', value: 11.2 },
  { name: 'North Carolina', value: 11.0 },
  { name: 'Michigan', value: 10.1 },
  { name: 'New Jersey', value: 9.5 },
  { name: 'Virginia', value: 8.8 },
  { name: 'Washington', value: 8.0 },
  { name: 'Arizona', value: 7.6 },
  { name: 'Tennessee', value: 7.3 },
  { name: 'Massachusetts', value: 7.1 },
  { name: 'Indiana', value: 6.9 },
  { name: 'Missouri', value: 6.3 },
  { name: 'Maryland', value: 6.2 },
  { name: 'Wisconsin', value: 5.9 },
  { name: 'Colorado', value: 5.9 },
  { name: 'Minnesota', value: 5.8 },
  { name: 'South Carolina', value: 5.5 },
  { name: 'Alabama', value: 5.2 },
  { name: 'Louisiana', value: 4.6 },
  { name: 'Kentucky', value: 4.6 },
  { name: 'Oregon', value: 4.2 },
  { name: 'Oklahoma', value: 4.1 },
  { name: 'Connecticut', value: 3.6 },
  { name: 'Utah', value: 3.5 },
  { name: 'Iowa', value: 3.2 },
  { name: 'Nevada', value: 3.2 },
  { name: 'Arkansas', value: 3.1 },
  { name: 'Mississippi', value: 2.9 },
  { name: 'Kansas', value: 2.9 },
  { name: 'New Mexico', value: 2.1 },
  { name: 'Nebraska', value: 2.0 },
  { name: 'Idaho', value: 2.0 },
  { name: 'West Virginia', value: 1.8 },
  { name: 'District of Columbia', value: 0.7 },
  { name: 'New Hampshire', value: 1.4 },
  { name: 'Maine', value: 1.4 },
  { name: 'Montana', value: 1.1 },
  { name: 'Rhode Island', value: 1.1 },
  { name: 'Delaware', value: 1.0 },
  { name: 'South Dakota', value: 0.9 },
  { name: 'North Dakota', value: 0.8 },
  { name: 'Vermont', value: 0.6 },
  { name: 'Wyoming', value: 0.6 },
]

/** 美国跨越纬度较大，mercator 投影观感更接近常见世界地图 */
const projection = computed(() => 'mercator' as const)
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>基础美国地图</span>
      <span>mercator 投影 · 州级 choropleth · 数据按州名（英文）匹配 GeoJSON · 悬停高亮 + tooltip</span>
    </div>
    <div class="demo-page__block-body" style="height: 480px">
      <KMapChart :geo-json="GEO" :data="DATA" :projection="projection" />
    </div>
  </section>
</template>
