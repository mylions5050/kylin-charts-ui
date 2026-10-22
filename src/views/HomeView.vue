<script setup lang="ts">
import { computed, ref } from 'vue'
import KLineChart from '@/components/k-line-chart'
import KRingChart from '@/components/k-ring-chart'
import KRadarChart from '@/components/k-radar-chart'
import type { KPieDatum } from '@/core/types'
import { ALL_CHARTS, CHART_GROUPS, getDemos } from '@/site/registry'
import { ChartIcon } from '@/site/icons'
import { useTheme } from '@/composables/use-theme'
import KScroll from '@/components/k-scroll'

const { isDark, toggleTheme } = useTheme()

/** 版本号（与 package.json 同步维护） */
const VERSION = 'v0.1.0'

/** 图表总数与用例总数（从 registry 自动统计，与侧栏数据同源） */
const chartTotal = ALL_CHARTS.length
const demoTotal = CHART_GROUPS.reduce(
  (sum, g) => sum + g.charts.reduce((s, c) => s + getDemos(c.slug).length, 0),
  0,
)

/** slug → 分组名（图表速览卡片副标题） */
const groupOf = computed(() => {
  const map = new Map<string, string>()
  CHART_GROUPS.forEach((g) => g.charts.forEach((c) => map.set(c.slug, g.label)))
  return map
})

// ============ Hero 图表矩阵：现场 dogfood，入场动画错峰上演 ============

/** 环形图：圆角 + 间距 + 无边框新特性组合 */
const HERO_RING: KPieDatum[] = [
  { name: '占比构成', value: 8 },
  { name: '趋势比较', value: 6 },
  { name: '状态指标', value: 5 },
  { name: '分布密度', value: 4 },
]

/** 入场动画重播：key 自增强制重挂载（BaseChart 挂载即播放入场） */
const heroKey = ref(0)
const replayHero = () => {
  heroKey.value++
}

/** 特性锚点滚动（主页滚动已接入 KScroll，在滚动容器内平滑定位） */
const featuresRef = ref<HTMLElement | null>(null)
const scrollRef = ref<any>(null)
const scrollToFeatures = () => {
  const target = featuresRef.value
  const root = scrollRef.value?.$el as HTMLElement | undefined
  const view = root?.querySelector<HTMLElement>('.k-scroll__view')
  if (!target || !view) return
  view.scrollTo({ top: target.offsetTop - 40, behavior: 'smooth' })
}

/** 特性卡片（彩色图标 chip + 标题 + 描述） */
const FEATURES = [
  {
    icon: 'M13 2 4 14h6l-1 8 9-12h-6l1-8Z',
    title: '轻量零依赖',
    desc: '纯 SVG 手绘场景图，不引 ECharts/d3，gzip 后仅几十 KB，后台系统不必为大屏级依赖买单',
    accent: '#7C5CFC',
  },
  {
    icon: 'M4 4h6v6H4zM14 14h6v6h-6zM10 7h7M7 10v7',
    title: '场景图驱动',
    desc: 'GroupNode 节点树 + key 级 diff 渲染，入场/悬停动画丝滑，扩展一种新图只需一个类',
    accent: '#2B6FFF',
  },
  {
    icon: 'M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3ZM12 12l8-4.5M12 12 4 7.5M12 12v9',
    title: '开箱即用',
    desc: 'v-model 式简洁 API，数据进、图出；公司后台几百条数据量级的场景，刚好够用不浪费',
    accent: '#00C48C',
  },
  {
    icon: 'M20 14A8 8 0 1 1 10 4a7 7 0 0 0 10 10Z',
    title: '暗色模式',
    desc: '亮暗双主题一键切换，全组件语义色 token 化，图表跟随主题自动换妆',
    accent: '#FFB020',
  },
  {
    icon: 'M4 5h16l-6 7v6l-4 2v-8L4 5Z',
    title: '按需引入',
    desc: '组件级独立导出，配合 ESM tree-shaking 只打包用到的图表，主包零负担',
    accent: '#F5455C',
  },
  {
    icon: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3ZM9 12l2 2 4-4',
    title: '类型安全',
    desc: 'Vue3 + TypeScript 全量类型提示，数据结构与配置项写错即刻标红，重构不心虚',
    accent: '#2BB0FF',
  },
]
</script>

<template>
  <div class="home-page">
    <KScroll ref="scrollRef" class="home-page__scroll">
      <!-- ============ 顶部导航（主页专属，透明悬浮） ============ -->
      <header class="home-page__nav">
      <span class="home-page__nav-logo">KCharts</span>
      <nav class="home-page__nav-links">
        <button type="button" class="home-page__nav-link" @click="scrollToFeatures">特性</button>
        <router-link to="/charts" class="home-page__nav-link">图表总览</router-link>
        <button type="button" class="home-page__nav-link home-page__nav-theme" @click="toggleTheme">
          {{ isDark ? '☀ 亮色' : '☾ 暗色' }}
        </button>
      </nav>
    </header>

    <!-- ============ Hero：沉浸式渐变 + 图表矩阵 ============ -->
    <section class="home-page__hero">
      <div class="home-page__glow home-page__glow--a" aria-hidden="true"></div>
      <div class="home-page__glow home-page__glow--b" aria-hidden="true"></div>
      <div class="home-page__grid-bg" aria-hidden="true"></div>

      <div class="home-page__hero-inner">
        <span class="home-page__badge">{{ VERSION }} · 零依赖 · Tree-shaking · MIT</span>
        <h1 class="home-page__title">KCharts</h1>
        <p class="home-page__slogan">轻量级 Vue3 + TypeScript 图表库</p>
        <p class="home-page__sub">场景图驱动的 SVG 渲染 · 为后台系统的常规数据量级而生 · 开箱即用</p>
        <div class="home-page__cta">
          <router-link to="/charts" class="home-page__cta-main">
            浏览 {{ chartTotal }} 种图表
            <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </router-link>
          <button type="button" class="home-page__cta-ghost" @click="scrollToFeatures">了解特性</button>
        </div>
        <div class="home-page__stats">
          <span class="home-page__stat"><b>{{ chartTotal }}</b>种图表</span>
          <span class="home-page__stat"><b>{{ demoTotal }}+</b>测试用例</span>
          <span class="home-page__stat"><b>0</b>运行时依赖</span>
          <span class="home-page__stat"><b>2</b>套主题</span>
        </div>

        <!-- 图表矩阵：折线 / 环形 / 雷达，错峰入场 -->
        <div class="home-page__stage">
          <div class="home-page__panel home-page__panel--1">
            <KLineChart
              :labels="['Q1', 'Q2', 'Q3', 'Q4']"
              :series="[{ name: '营收', data: [120, 200, 150, 260] }, { name: '成本', data: [80, 110, 90, 130] }]"
              legend
              :height="232"
            />
          </div>
          <div class="home-page__panel home-page__panel--2">
            <button type="button" class="home-page__replay" @click="replayHero">↻ 重播入场</button>
            <KRingChart
              :key="heroKey"
              :data="HERO_RING"
              :label="false"
              center-title="28 种"
              center-subtitle="图表类型"
              :inner-radius="0.6"
              :item-radius="5"
              :item-gap="5"
              :item-border="false"
              :height="255"
            />
          </div>
          <div class="home-page__panel home-page__panel--3">
            <div class="home-page__panel-legend">
              <span><i style="background:#7c5cfc"></i>KCharts</span>
              <span><i style="background:#2b6fff"></i>传统方案</span>
            </div>
            <KRadarChart
              :indicators="[{ name: '轻量', max: 100 }, { name: '易用', max: 100 }, { name: '性能', max: 100 }, { name: '颜值', max: 100 }, { name: '扩展', max: 100 }]"
              :series="[{ name: 'KCharts', data: [95, 92, 85, 90, 88] }, { name: '传统方案', data: [58, 52, 64, 48, 55] }]"
              :legend="false"
              :split-number="4"
              :height="255"
            />
          </div>
        </div>
      </div>
    </section>

    <!-- ============ 特性 ============ -->
    <section ref="featuresRef" class="home-page__body">
      <h2 class="home-page__section-title">特性</h2>
      <p class="home-page__section-desc">为「够用」而设计，也为「好看」而用心</p>
      <div class="home-page__features">
        <div v-for="f in FEATURES" :key="f.title" class="home-page__feature">
          <span class="home-page__feature-icon" :style="{ color: f.accent, background: f.accent + '1a' }">
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
              <path :d="f.icon" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </span>
          <div class="home-page__feature-title">{{ f.title }}</div>
          <div class="home-page__feature-desc">{{ f.desc }}</div>
        </div>
      </div>

      <!-- ============ 图表速览 ============ -->
      <section class="home-page__charts">
        <h2 class="home-page__section-title">图表速览</h2>
        <p class="home-page__section-desc">点击任意图表查看真实渲染效果与全部测试用例</p>
        <div class="home-page__charts-grid">
          <router-link v-for="chart in ALL_CHARTS" :key="chart.slug" class="home-page__chart-card" :to="`/chart/${chart.slug}`">
            <ChartIcon :name="chart.slug" />
            <span class="home-page__chart-name">{{ chart.title }}</span>
            <span class="home-page__chart-group">{{ groupOf.get(chart.slug) }}</span>
          </router-link>
        </div>
      </section>

      <footer class="home-page__footer">KCharts · 轻量级 Vue3 + TypeScript 图表库 · SVG 场景图驱动</footer>
    </section>
    </KScroll>
  </div>
</template>
