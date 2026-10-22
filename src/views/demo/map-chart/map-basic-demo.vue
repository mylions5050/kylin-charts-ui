<script setup lang="ts">
import KMapChart from '@/components/k-map-chart'
import type { KMapDatum } from '@/core/chart/map-chart'
import type { GeoFeatureCollection } from '@/core/utils/geo'
import chinaGeoJson from './data/china.json'

/** DataV 的九段线 feature 无名称，补名避免 tooltip 空白 */
const GEO = chinaGeoJson as GeoFeatureCollection
GEO.features.forEach((f) => {
  if (!f.properties.name) f.properties.name = '南海诸岛'
})

/** 2025 各省门店数量（示意数据，覆盖全部省级区域） */
const DATA: KMapDatum[] = [
  { name: '广东省', value: 128 },
  { name: '江苏省', value: 92 },
  { name: '山东省', value: 78 },
  { name: '浙江省', value: 75 },
  { name: '河南省', value: 65 },
  { name: '四川省', value: 62 },
  { name: '河北省', value: 50 },
  { name: '湖南省', value: 48 },
  { name: '湖北省', value: 46 },
  { name: '福建省', value: 42 },
  { name: '上海市', value: 40 },
  { name: '安徽省', value: 40 },
  { name: '北京市', value: 45 },
  { name: '辽宁省', value: 35 },
  { name: '陕西省', value: 32 },
  { name: '江西省', value: 30 },
  { name: '广西壮族自治区', value: 30 },
  { name: '云南省', value: 28 },
  { name: '重庆市', value: 28 },
  { name: '黑龙江省', value: 25 },
  { name: '吉林省', value: 22 },
  { name: '山西省', value: 22 },
  { name: '贵州省', value: 22 },
  { name: '新疆维吾尔自治区', value: 20 },
  { name: '内蒙古自治区', value: 18 },
  { name: '甘肃省', value: 18 },
  { name: '天津市', value: 25 },
  { name: '海南省', value: 15 },
  { name: '宁夏回族自治区', value: 8 },
  { name: '青海省', value: 6 },
  { name: '台湾省', value: 30 },
  { name: '香港特别行政区', value: 12 },
  { name: '澳门特别行政区', value: 5 },
  { name: '西藏自治区', value: 4 },
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>基础中国地图</span>
      <span>choropleth 数值着色 · 线性投影 aspectScale 0.75 · 悬停高亮 + tooltip · 数据按 name 匹配 GeoJSON</span>
    </div>
    <div class="demo-page__block-body" style="height: 440px">
      <KMapChart :geo-json="GEO" :data="DATA" />
    </div>
  </section>
</template>
