<script setup lang="ts">
import KMapChart from '@/components/k-map-chart'
import type { KMapDatum } from '@/core/chart/map-chart'
import type { GeoFeatureCollection } from '@/core/utils/geo'
import russiaGeoJson from './data/russia.json'

/**
 * 自定义国家示例 · 俄罗斯（83 个联邦主体）
 *
 * 数据来源与预处理（本库不内置地图数据，GeoJSON 由外部传入）：
 * 1. 来源：GitHub 公开仓库 click_that_hood 的 russia.geojson（联邦主体级）
 * 2. 跨日界线预处理：俄罗斯跨越 180° 经线，楚科奇半岛东端经度约为 -170，
 *    若不处理，包围盒会横跨整个世界宽度导致地图被拉扁；
 *    预处理时把经度为负的点统一 +360，让所有坐标落在连续区间（约 19°E ~ 191°E）
 * 3. Douglas-Peucker 抽稀（容差 0.04°）压缩体积：约 2MB → 280KB
 *
 * 投影：国外国家建议 mercator；本库投影按数据包围盒自适应缩放，
 * 预处理后的连续数据可直接正确铺满画布，无需额外配置
 */
const GEO = russiaGeoJson as GeoFeatureCollection

/** 人口（百万人，示意数据）；未覆盖的联邦主体自动落灰色兜底 */
const DATA: KMapDatum[] = [
  { name: 'Москва', value: 13.1 },                       // 莫斯科市
  { name: 'Санкт-Петербург', value: 5.6 },               // 圣彼得堡市
  { name: 'Свердловская область', value: 4.3 },          // 斯维尔德洛夫斯克州
  { name: 'Татарстан', value: 4.0 },                     // 鞑靼斯坦共和国
  { name: 'Новосибирская область', value: 2.8 },         // 新西伯利亚州
  { name: 'Республика Саха (Якутия)', value: 1.0 },      // 萨哈（雅库特）共和国
  { name: 'Калининградская область', value: 1.0 },       // 加里宁格勒州（飞地）
  { name: 'Чукотский автономный округ', value: 0.05 },   // 楚科奇自治区（跨日界线处）
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>自定义国家 · 俄罗斯</span>
      <span>外部 GeoJSON + mercator 投影 · 跨日界线预处理（负经度 +360）· 未覆盖区域灰色兜底</span>
    </div>
    <div class="demo-page__block-body" style="height: 480px">
      <KMapChart :geo-json="GEO" :data="DATA" projection="mercator" />
    </div>
  </section>
</template>
