<template>
  <div class="guide-page">
    <header class="guide-page__header">
      <h1 class="guide-page__title">安装与使用</h1>
      <span class="guide-page__meta">三步接入 · 全量 / 按需两种引入方式 · 零运行时依赖</span>
    </header>

    <!-- ============ 环境要求 ============ -->
    <section class="guide-page__block">
      <div class="guide-page__block-header">
        <span class="guide-page__block-title">环境要求</span>
        <span>开始前请确认项目环境</span>
      </div>
      <div class="guide-page__block-body">
        <ul class="guide-page__list">
          <li>Vue <b>3.2 及以上</b>（图表组件基于 Composition API + TSX 开发）</li>
          <li>推荐搭配 <b>TypeScript</b> 使用，全部 Props / Series / Option 均有完整类型提示</li>
          <li>构建工具不限：Vite / Webpack / Rspack 均可，库产物为标准 ESM + CJS</li>
          <li>唯一 peerDependency 是 <b>vue</b> 本身，除此之外零运行时依赖</li>
        </ul>
      </div>
    </section>

    <!-- ============ 安装 ============ -->
    <section class="guide-page__block">
      <div class="guide-page__block-header">
        <span class="guide-page__block-title">第一步 · 安装</span>
        <span>从 npm 安装（vue 已在项目中，无需重复安装）</span>
      </div>
      <div class="guide-page__block-body guide-page__code-wrap">
        <pre class="guide-page__code"><code># npm
npm install kcharts

# pnpm
pnpm add kcharts

# yarn
yarn add kcharts</code></pre>
      </div>
    </section>

    <!-- ============ 全量引入 ============ -->
    <section class="guide-page__block">
      <div class="guide-page__block-header">
        <span class="guide-page__block-title">第二步 · 方式一：全量引入</span>
        <span>app.use 一次性注册全部 28 种图表，适合快速上手</span>
      </div>
      <div class="guide-page__block-body guide-page__code-wrap">
        <pre class="guide-page__code"><code>// main.ts
import { createApp } from 'vue'
import KCharts from 'kcharts'
import 'kcharts/style.css' // 样式只需引入一次
import App from './App.vue'

const app = createApp(App)
app.use(KCharts) // 全局注册：KLineChart / KBarChart / KPieChart …全部可用
app.mount('#app')</code></pre>
        <pre class="guide-page__code"><code>&lt;!-- 任意组件模板中直接使用 --&gt;
&lt;template&gt;
  &lt;KLineChart
    :labels=&quot;['1月', '2月', '3月', '4月']&quot;
    :series=&quot;[{ name: '销量', data: [120, 200, 150, 260] }]&quot;
    legend
  /&gt;
&lt;/template&gt;</code></pre>
        <p class="guide-page__note">全量方式会把 28 种图表全部打进产物（gzip 约 87KB），管理后台「几乎每个页面都有图」的场景最省心。</p>
      </div>
    </section>

    <!-- ============ 按需引入 ============ -->
    <section class="guide-page__block">
      <div class="guide-page__block-header">
        <span class="guide-page__block-title">方式二：按需引入（推荐）</span>
        <span>组件级独立导出 + ESM tree-shaking，只打包用到的图表</span>
      </div>
      <div class="guide-page__block-body guide-page__code-wrap">
        <pre class="guide-page__code"><code>&lt;script setup lang=&quot;ts&quot;&gt;
// 按需引入：无需 app.use，局部导入直接用
import { KLineChart, KBarChart } from 'kcharts'
import type { KLineSeries } from 'kcharts' // 类型同样按需导入

import 'kcharts/style.css' // 样式仍只需引入一次（入口文件引入即可）

const series: KLineSeries[] = [
  { name: '销量', data: [120, 200, 150, 260] },
  { name: '利润', data: [80, 110, 90, 130] },
]
&lt;/script&gt;

&lt;template&gt;
  &lt;KLineChart :labels=&quot;['Q1', 'Q2', 'Q3', 'Q4']&quot; :series=&quot;series&quot; legend /&gt;
&lt;/template&gt;</code></pre>
        <p class="guide-page__note">
          只引入两三个图表时产物 gzip 约 <b>26KB</b>（对比 ECharts 全量 gzip 约 330KB）。package.json 已标记
          <code>sideEffects</code>，Vite / Webpack 5 / Rspack 无需任何额外插件即可 tree-shaking。
        </p>
      </div>
    </section>

    <!-- ============ 第三步：使用示例 ============ -->
    <section class="guide-page__block">
      <div class="guide-page__block-header">
        <span class="guide-page__block-title">第三步 · 常用配置一览</span>
        <span>Props 直出、v-model 直绑，配置项语义与 ECharts 对齐</span>
      </div>
      <div class="guide-page__block-body guide-page__code-wrap">
        <pre class="guide-page__code"><code>&lt;template&gt;
  &lt;!-- 高度：传 px 数字；不传则填满父容器 --&gt;
  &lt;KLineChart
    :labels=&quot;labels&quot;
    :series=&quot;series&quot;
    :height=&quot;320&quot;
    legend
    :y-axis=&quot;{ name: '销售额', min: 0, max: 400 }&quot;
    :x-axis=&quot;{ labelRotate: 45 }&quot;
    :data-zoom=&quot;true&quot;
  /&gt;
&lt;/template&gt;

&lt;script setup lang=&quot;ts&quot;&gt;
// 标线 / 标注点 / 标域在系列级配置
const series = [
  {
    name: '销量',
    data: [120, 200, 150, 260],
    markPoint: { data: [{ type: 'max' }, { type: 'min' }] },
    markLine: { data: [{ yAxis: 200, label: '目标线' }] },
  },
]
&lt;/script&gt;</code></pre>
        <p class="guide-page__note">
          每种图表的完整 API（属性 / 类型 / 默认值 / 说明）见左侧对应图表页，页内右上角「API 使用说明」抽屉有逐项表格。
        </p>
      </div>
    </section>

    <!-- ============ 暗色模式 ============ -->
    <section class="guide-page__block">
      <div class="guide-page__block-header">
        <span class="guide-page__block-title">暗色模式</span>
        <span>一行切换，全部图表实例联动</span>
      </div>
      <div class="guide-page__block-body guide-page__code-wrap">
        <pre class="guide-page__code"><code>import { useTheme } from 'kcharts'

const { isDark, toggleTheme } = useTheme()
// toggleTheme()：切换 &lt;html class=&quot;dark&quot;&gt; + localStorage 持久化
// 所有图表实例自动换用暗色配色，无需重建</code></pre>
        <p class="guide-page__note">暗色样式由两部分协同：CSS 变量随 <code>html.dark</code> 切换容器中性色，场景图内色值由内置 darkTheme 负责，二者自动同步。</p>
      </div>
    </section>

    <!-- ============ 进阶 ============ -->
    <section class="guide-page__block">
      <div class="guide-page__block-header">
        <span class="guide-page__block-title">进阶：复用底层能力自定义图表</span>
        <span>核心层同样从包内导出</span>
      </div>
      <div class="guide-page__block-body guide-page__code-wrap">
        <pre class="guide-page__code"><code>import { BaseChart, LineChart, BandScale, LinearScale, niceTicks, defaultTheme } from 'kcharts'
import type { KChartTheme } from 'kcharts'

// 继承 BaseChart 实现 hitTest / buildScene 即可接入同一套
// 布局、tooltip、主题与动画体系</code></pre>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
/** 安装与使用指南（/guide/install）：面向 npm 用户的接入说明页 */
</script>

<style scoped lang="scss">
.guide-page {
  width: 95%;
  margin: 0 auto;
  padding: 40px 0 72px;

  &__header {
    display: flex;
    align-items: baseline;
    gap: 12px;
    flex-wrap: wrap;
    margin-bottom: 24px;
  }

  &__title {
    margin: 0;
    font-size: 22px;
    font-weight: 600;
    color: #1f2329;
  }

  &__meta {
    font-size: 13px;
    color: #646a73;
  }

  &__block {
    border: 1px solid rgba(31, 35, 41, 0.08);
    border-radius: 10px;
    background: #fff;
    overflow: hidden;

    + .guide-page__block {
      margin-top: 28px;
    }
  }

  &__block-header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
    padding: 12px 20px;
    border-bottom: 1px solid rgba(31, 35, 41, 0.08);
  }

  &__block-title {
    font-size: 15px;
    font-weight: 600;
    color: #1f2329;
  }

  &__block-header > span:last-child {
    font-size: 12.5px;
    color: #646a73;
  }

  &__block-body {
    padding: 20px;
  }

  &__list {
    margin: 0;
    padding-left: 18px;
    color: #383e47;
    font-size: 13.5px;
    line-height: 2;

    b {
      color: #7c5cfc;
    }
  }

  &__code-wrap + &__code-wrap,
  .guide-page__code + .guide-page__code {
    margin-top: 14px;
  }

  &__code {
    margin: 0;
    padding: 14px 18px;
    border-radius: 8px;
    background: #f5f6f7;
    color: #383e47;
    font-family: 'JetBrains Mono', 'Fira Code', Consolas, monospace;
    font-size: 12.5px;
    line-height: 1.8;
    overflow-x: auto;

    code {
      font-family: inherit;
    }
  }

  &__note {
    margin: 14px 0 0;
    font-size: 12.5px;
    color: #646a73;
    line-height: 1.8;

    code {
      padding: 1px 6px;
      border-radius: 4px;
      background: rgba(124, 92, 252, 0.08);
      color: #7c5cfc;
      font-family: 'JetBrains Mono', Consolas, monospace;
      font-size: 12px;
    }

    b {
      color: #7c5cfc;
    }
  }
}

html.dark .guide-page {
  &__title {
    color: #f2f3f5;
  }

  &__meta,
  &__block-header > span:last-child {
    color: #a9aeb8;
  }

  &__block {
    background: #1d1e25;
    border-color: #2e2f38;
  }

  &__block-header {
    border-bottom-color: #2e2f38;
  }

  &__block-title {
    color: #f2f3f5;
  }

  &__list {
    color: #c9cdd4;
  }

  &__code {
    background: #17181d;
    color: #c9cdd4;
  }

  &__note {
    color: #a9aeb8;
  }
}
</style>
