<script setup lang="ts">
import { ref } from 'vue'
import KMapChart from '@/components/k-map-chart'
import type { KMapDatum } from '@/core/chart/map-chart'
import type { GeoFeatureCollection } from '@/core/utils/geo'

/**
 * 迷你示例：手写三块多边形直接渲染，证明任何合法 GeoJSON 都能画
 * （东岛/西岛有数据着色，南礁不在 data 里 → 灰色兜底，演示 name 匹配规则）
 */
const GEO: GeoFeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { name: '东岛' },
      geometry: { type: 'Polygon', coordinates: [[[116.5, 29.5], [119, 29.5], [119, 31.5], [116.5, 31.5], [116.5, 29.5]]] },
    },
    {
      type: 'Feature',
      properties: { name: '西岛' },
      geometry: { type: 'Polygon', coordinates: [[[113, 29.5], [115.5, 29.5], [115.5, 31.5], [113, 31.5], [113, 29.5]]] },
    },
    {
      type: 'Feature',
      properties: { name: '南礁' },
      geometry: { type: 'Polygon', coordinates: [[[114, 27.5], [117.5, 27.5], [117.5, 29], [114, 29], [114, 27.5]]] },
    },
  ],
}

const DATA: KMapDatum[] = [
  { name: '东岛', value: 68 },
  { name: '西岛', value: 32 },
]

/** 指南内容用静态文案 + 代码片段展示 */
const activeStep = ref(1)
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>如何自定义地图（国家 / 省 / 市 / 区县）</span>
      <span>三步接入任意区域 GeoJSON · 本库不内置任何地图数据，全部由外部传入</span>
    </div>
    <div class="demo-page__block-body guide-demo__body">
      <div class="guide-demo__steps">
        <div class="guide-demo__step" :class="{ 'guide-demo__step--active': activeStep === 1 }" @click="activeStep = 1">
          <span class="guide-demo__step-no">第 1 步</span>
          <span class="guide-demo__step-title">拿到目标区域的 GeoJSON（经纬度型）</span>
        </div>
        <div class="guide-demo__step" :class="{ 'guide-demo__step--active': activeStep === 2 }" @click="activeStep = 2">
          <span class="guide-demo__step-no">第 2 步</span>
          <span class="guide-demo__step-title">传给组件：<code>:geo-json</code> + <code>:data</code>，按 name 匹配</span>
        </div>
        <div class="guide-demo__step" :class="{ 'guide-demo__step--active': activeStep === 3 }" @click="activeStep = 3">
          <span class="guide-demo__step-no">第 3 步</span>
          <span class="guide-demo__step-title">选好投影，处理跨日界线等特殊情况</span>
        </div>
      </div>

      <div v-if="activeStep === 1" class="guide-demo__pane">
        <p>国内省市区直接用阿里 DataV 的公开接口，URL 规则固定：<code>https://geo.datav.aliyun.com/areas_v3/bound/{行政区划代码}[_full].json</code>。行政区划代码可在民政部或 DataV 的 Atlas 平台查询，常见示例：北京市 <code>110000_full</code>、深圳市 <code>440300_full</code>、海淀区 <code>110108</code>。带 <code>_full</code> 返回含全部子区域的地图（如北京市含 16 个区），不带则只返回单个区域轮廓（下钻到最细一级时用）。</p>
        <p>国外国家推荐 Natural Earth（naturalearthdata.com）或 GitHub 上的公开 GeoJSON 仓库（可直接走 jsDelivr CDN）。文件太大时用 mapshaper 简化：<code>npx mapshaper xxx.json -simplify 8% keep-shapes -o format=geojson out.json</code>，通常能压到十分之一且肉眼无差。</p>
      </div>

      <div v-else-if="activeStep === 2" class="guide-demo__pane">
        <p><strong>KCharts 包内零内置地图数据</strong>，组件只负责渲染逻辑。GeoJSON 与数值数据都放你自己的项目里，自行下载后 <code>import</code> 引入——用哪个区域就引哪个文件，不引用就完全不会进包。</p>
        <p>大体积数据建议用动态 <code>import()</code> 异步加载，只在进入地图页时才请求，避免挤进首屏主包：</p>
        <pre class="guide-demo__code">import { ref, onMounted } from 'vue'

const geoJson = ref&lt;GeoFeatureCollection | null&gt;(null)

onMounted(async () =&gt; {
  // 动态引入：单独分包，不占首屏主包体积
  const mod = await import('@/assets/geo/china.json')
  geoJson.value = mod.default as GeoFeatureCollection
})</pre>
        <p>数值数据是 <code v-pre>{ name, value }</code> 数组，<code>name</code> 必须与 GeoJSON 里 <code>properties.name</code> 完全一致（精确匹配，不是包含）。对上号的区域按数值着色，没对上的（或 GeoJSON 里没有的）落灰色兜底，不会报错。</p>
        <pre class="guide-demo__code">&lt;KMapChart :geo-json="geoJson" :data="data" /&gt;

const data = [
  { name: '海淀区', value: 11000 },
  { name: '朝阳区', value: 9500 },
]</pre>
        <p>想下钻（点某市进入其区县图）就再监听 <code>@region-click</code>，回调参数是命中区域的 GeoJSON 下标，拿到名字后把下级 GeoJSON 和对应 data 重新传入即可，参考下方「地图下钻」示例。</p>
      </div>

      <div v-else class="guide-demo__pane">
        <p>投影选择：中国行政图用默认 <code>linear</code>（aspectScale 0.75，与 ECharts 地理坐标一致）；国外国家、世界地图建议传 <code>projection="mercator"</code>。</p>
        <p>跨 180° 经线的国家（俄罗斯、斐济、新西兰等）要先做数据预处理：把经度为负的点统一 +360，让包围盒落在连续区间。KCharts 投影按数据包围盒自适应缩放，数据连续即可正确铺满画布，可参考下方「自定义国家 · 俄罗斯」示例。</p>
      </div>

      <div class="guide-demo__chart">
        <p class="guide-demo__chart-tip">迷你示例：手写三块多边形直接渲染 —— 东岛/西岛有数据着色，南礁不在 data 里落灰色兜底</p>
        <div style="height: 250px">
          <KMapChart :geo-json="GEO" :data="DATA" :border-width="1.2" />
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.guide-demo__body {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.guide-demo__steps {
  display: flex;
  gap: 10px;
}

.guide-demo__step {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border: 1px solid rgba(29, 33, 41, 0.1);
  border-radius: 8px;
  cursor: pointer;
}

.guide-demo__step--active {
  border-color: #7c5cfc;
  background: rgba(124, 92, 252, 0.06);
}

.guide-demo__step-no {
  flex-shrink: 0;
  font-size: 12px;
  color: #7c5cfc;
  font-weight: 600;
}

.guide-demo__step-title {
  font-size: 12px;
  color: #4e5969;
  line-height: 1.5;
}

.guide-demo__pane p {
  margin: 0 0 8px;
  font-size: 13px;
  color: #4e5969;
  line-height: 1.8;
}

.guide-demo__pane code {
  padding: 1px 6px;
  border-radius: 4px;
  background: rgba(124, 92, 252, 0.08);
  color: #7c5cfc;
  font-size: 12px;
}

.guide-demo__code {
  margin: 8px 0;
  padding: 12px 14px;
  border-radius: 8px;
  background: #f5f6fa;
  color: #2b3a55;
  font-size: 12px;
  line-height: 1.7;
  overflow-x: auto;
}

.guide-demo__chart-tip {
  margin: 0 0 6px;
  font-size: 12px;
  color: #86909c;
}
</style>
