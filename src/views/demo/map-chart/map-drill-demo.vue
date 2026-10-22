<script setup lang="ts">
import { computed, ref } from 'vue'
import KMapChart from '@/components/k-map-chart'
import type { KMapDatum } from '@/core/chart/map-chart'
import type { GeoFeatureCollection } from '@/core/utils/geo'
import chinaGeoJson from './data/china.json'
import beijingGeoJson from './data/beijing.json'
import haidianGeoJson from './data/haidian.json'

/** DataV 的九段线 feature 无名称，补名避免 tooltip 空白 */
const CHINA = chinaGeoJson as GeoFeatureCollection
CHINA.features.forEach((f) => {
  if (!f.properties.name) f.properties.name = '南海诸岛'
})

/** 下钻层级：中国 → 北京市（区级）→ 海淀区 */
type Level = 'china' | 'beijing' | 'haidian'

const GEO: Record<Level, GeoFeatureCollection> = {
  china: CHINA,
  beijing: beijingGeoJson as GeoFeatureCollection,
  haidian: haidianGeoJson as GeoFeatureCollection,
}

const CHINA_DATA: KMapDatum[] = [
  { name: '广东省', value: 128 },
  { name: '江苏省', value: 92 },
  { name: '山东省', value: 78 },
  { name: '浙江省', value: 75 },
  { name: '河南省', value: 65 },
  { name: '四川省', value: 62 },
  { name: '北京市', value: 45 },
  { name: '上海市', value: 40 },
  { name: '湖北省', value: 46 },
  { name: '福建省', value: 42 },
  { name: '湖南省', value: 48 },
  { name: '河北省', value: 50 },
]

/** 2024 各区 GDP（亿元，示意数据） */
const BEIJING_DATA: KMapDatum[] = [
  { name: '海淀区', value: 11000 },
  { name: '朝阳区', value: 9500 },
  { name: '西城区', value: 5800 },
  { name: '东城区', value: 3800 },
  { name: '顺义区', value: 2600 },
  { name: '丰台区', value: 2500 },
  { name: '昌平区', value: 2200 },
  { name: '通州区', value: 1800 },
  { name: '大兴区', value: 1500 },
  { name: '石景山区', value: 1200 },
  { name: '房山区', value: 1200 },
  { name: '怀柔区', value: 700 },
  { name: '密云区', value: 650 },
  { name: '平谷区', value: 600 },
  { name: '门头沟区', value: 400 },
  { name: '延庆区', value: 350 },
]

const HAIDIAN_DATA: KMapDatum[] = [{ name: '海淀区', value: 100 }]

const DATA: Record<Level, KMapDatum[]> = {
  china: CHINA_DATA,
  beijing: BEIJING_DATA,
  haidian: HAIDIAN_DATA,
}

/** 各层级展示名（面包屑用） */
const LEVEL_NAMES: Record<Level, string> = {
  china: '中国',
  beijing: '北京市',
  haidian: '海淀区',
}

/** 面包屑顺序 */
const LEVEL_ORDER: Level[] = ['china', 'beijing', 'haidian']

const level = ref<Level>('china')
const geo = computed(() => GEO[level.value])
const data = computed(() => DATA[level.value])
/** 下级地图信息量小，展示区域名标签更直观 */
const showLabel = computed(() => level.value !== 'china')

/** 点击区域下钻：仅对配置了子级地图的区域生效 */
function onRegionClick(index: number): void {
  const name = geo.value.features[index]?.properties?.name ?? ''
  if (level.value === 'china' && name === '北京市') level.value = 'beijing'
  else if (level.value === 'beijing' && name === '海淀区') level.value = 'haidian'
}

/** 回到某一级（面包屑点击） */
function backTo(target: Level): void {
  level.value = target
}
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>地图下钻</span>
      <span>点击区域逐级放大 · 中国 → 北京市 → 海淀区 · 面包屑返回 · 点击回调 onRegionClick</span>
    </div>
    <div class="demo-page__block-body drill-demo__body">
      <nav class="drill-demo__crumbs">
        <button
          v-for="lv in LEVEL_ORDER"
          :key="lv"
          type="button"
          class="drill-demo__crumb"
          :class="{ 'drill-demo__crumb--active': level === lv }"
          :disabled="level === lv"
          @click="backTo(lv)"
        >
          {{ LEVEL_NAMES[lv] }}
        </button>
        <span class="drill-demo__hint">{{ level === 'haidian' ? '已是最细层级' : '点击可下钻的区域放大' }}</span>
      </nav>
      <div style="height: 460px">
        <KMapChart :geo-json="geo" :data="data" :label="showLabel" @region-click="onRegionClick" />
      </div>
    </div>
  </section>
</template>

<style scoped>
.drill-demo__body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.drill-demo__crumbs {
  display: flex;
  align-items: center;
  gap: 8px;
}

.drill-demo__crumb {
  padding: 4px 12px;
  border: 1px solid rgba(29, 33, 41, 0.15);
  border-radius: 999px;
  background: transparent;
  font-size: 12px;
  color: #4e5969;
  cursor: pointer;
}

.drill-demo__crumb--active {
  background: #7c5cfc;
  border-color: #7c5cfc;
  color: #fff;
  cursor: default;
}

.drill-demo__hint {
  margin-left: 4px;
  font-size: 12px;
  color: #86909c;
}
</style>
