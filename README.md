# KCharts

轻量级 Vue3 + TypeScript 图表库，基于自研 SVG 场景图渲染，开箱即用。

面向中后台常见的数据量（几百条级别）场景，提供 28 种开箱即用的图表组件，无需引入 ECharts 等重型依赖。

## 特性

- 🪶 **轻量**：ESM 产物约 87KB（gzip），无任何运行时依赖，仅 peerDependency `vue >= 3.2.0`
- 📦 **双格式**：同时提供 ESM / CJS 产物，支持全量引入与按需引入（tree-shaking）
- 🎨 **SVG 场景图**：自研场景图 diff 渲染，交互（tooltip / 缩放 / 选中）流畅
- 🌗 **暗色模式**：内置 `useTheme` 一行接入全局主题切换
- 🧩 **TypeScript**：全量类型定义（.d.ts），series / option 类型完备
- 🧭 **dataZoom / markPoint / markLine / 双 Y 轴** 等常用能力对齐 ECharts 使用习惯

## 支持的图表

折线图、面积图、平滑折线图、阶梯折线图、柱状图、条形图、堆积柱状图、分组柱状图、折柱混合图、饼图、环图、玫瑰图、多环进度图、进度条、仪表盘、雷达图、漏斗图、散点图、气泡图、K 线图、旭日图、矩形树图、热力图、日历热力图、桑基图、关系图、地图、水波图等。

## 安装

```bash
npm install kcharts
# 或
pnpm add kcharts
# 或
yarn add kcharts
```

## 快速开始

### 方式一：全量引入

```ts
import { createApp } from 'vue'
import KCharts from 'kcharts'
import 'kcharts/style.css'
import App from './App.vue'

const app = createApp(App)
app.use(KCharts)
app.mount('#app')
```

注册后可直接使用全部 `<K-Line-Chart />`、`<K-Bar-Chart />` 等组件。

### 方式二：按需引入（推荐）

按需引入可显著减小产物体积（如仅引折线 + 柱状约 26KB gzip）：

```vue
<script setup lang="ts">
import { KLineChart } from 'kcharts'
import type { KLineSeries } from 'kcharts'
import 'kcharts/style.css'

const labels = ['周一', '周二', '周三', '周四', '周五']
const series: KLineSeries[] = [
  { name: '销量', data: [120, 200, 150, 80, 270] },
]
</script>

<template>
  <KLineChart :labels="labels" :series="series" :height="320" />
</template>
```

> 样式文件只需引入一次。库在 package.json 中声明了 `sideEffects`，未使用的组件会被打包器自动摇树。

## 暗色模式

```ts
import { useTheme } from 'kcharts'

const { isDark, toggleTheme, chartTheme } = useTheme()
```

`chartTheme` 是随主题联动的响应式主题对象，传入组件的 `theme` 属性即可：

```vue
<KLineChart :labels="labels" :series="series" :theme="chartTheme" />
```

## 进阶用法

底层能力同样开放导出，便于定制：

```ts
import { BaseChart, LineChart, toPath, niceTicks, defaultTheme } from 'kcharts'
import type { KChartTheme, LinearScale, BandScale } from 'kcharts'
```

- `BaseChart`：自研 SVG 场景图基类，可继承实现自定义图表
- `niceTicks` / `LinearScale` / `BandScale`：刻度与比例尺工具
- `defaultTheme` / `KChartTheme`：默认主题与主题类型

## 环境要求

- Vue >= 3.2.0（peerDependency）
- 推荐搭配 TypeScript 使用

## License

[MIT](./LICENSE)
