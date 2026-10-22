<script setup lang="ts">
import KMapChart from '@/components/k-map-chart'
import type { KMapDatum } from '@/core/chart/map-chart'
import type { GeoFeatureCollection } from '@/core/utils/geo'
import chinaGeoJson from './data/china.json'

const GEO = chinaGeoJson as GeoFeatureCollection
GEO.features.forEach((f) => {
  if (!f.properties.name) f.properties.name = '南海诸岛'
})

/** 区域热度示意（部分省份无数据，展示底色兜底） */
const DATA: KMapDatum[] = [
  { name: '广东省', value: 95 },
  { name: '江苏省', value: 88 },
  { name: '浙江省', value: 82 },
  { name: '山东省', value: 74 },
  { name: '河南省', value: 68 },
  { name: '四川省', value: 60 },
  { name: '湖北省', value: 55 },
  { name: '湖南省', value: 50 },
  { name: '福建省', value: 46 },
  { name: '上海市', value: 90 },
  { name: '北京市', value: 85 },
  { name: '安徽省', value: 42 },
  { name: '河北省', value: 38 },
  { name: '陕西省', value: 35 },
  { name: '辽宁省', value: 32 },
  { name: '江西省', value: 30 },
  { name: '重庆市', value: 44 },
  { name: '天津市', value: 40 },
  { name: '云南省', value: 24 },
  { name: '广西壮族自治区', value: 26 },
  { name: '贵州省', value: 22 },
  { name: '山西省', value: 20 },
  { name: '吉林省', value: 18 },
  { name: '黑龙江省', value: 16 },
  { name: '新疆维吾尔自治区', value: 12 },
  { name: '甘肃省', value: 10 },
  { name: '内蒙古自治区', value: 14 },
  { name: '海南省', value: 18 },
  { name: '宁夏回族自治区', value: 8 },
  { name: '青海省', value: 6 },
  { name: '西藏自治区', value: 4 },
]

/** 自定义蓝色系色标（低 → 高），无数据区域用浅灰底色 */
const COLOR_STOPS = ['#EBF3FF', '#7FB5FF', '#2B6FFF', '#123FB8']
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>区域名称标签与自定义色标</span>
      <span>label 区域名标注 · 蓝色系 choropleth · regionColor 底色兜底无数据区域</span>
    </div>
    <div class="demo-page__block-body" style="height: 440px">
      <KMapChart :geo-json="GEO" :data="DATA" :color-stops="COLOR_STOPS" region-color="#F2F4FA" label />
    </div>
  </section>
</template>
