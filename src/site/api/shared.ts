import type { ApiSection } from './types'

/**
 * 跨图表共享的文档分组。
 * 各图表的文档通过展开常量复用，保证同一语义的说明全站一致。
 */

/** 通用 Props：几乎所有图表都有（标题 / 空态 / 内边距 / 配置透传） */
export const SEC_COMMON: ApiSection = {
  title: '通用 Props（各图表一致）',
  note: '以下属性所有图表组件均可使用，此处集中说明，各图表页不再重复。',
  fields: [
    { name: 'title', type: 'string', def: "''", desc: '图表标题，显示在图表上方左对齐；传空字符串或省略则不渲染标题行，图表占满整个容器。' },
    { name: 'emptyText', type: 'string', def: "'暂无数据'", desc: '数据为空（空数组 / 全 null）时展示的占位提示文案，与 ECharts 的空态思路一致。' },
    { name: 'padding', type: 'Partial<Padding>', def: '—', desc: '画布内边距覆盖（对齐 ECharts grid 的留白职责）。对象含 top / right / bottom / left 四个数值（px）。典型场景：轴名或倾斜标签被裁时手动加大对应方向的留白。' },
    { name: 'option', type: 'Partial<XxxChartOption>', def: '—', desc: '进阶用法：完整配置透传对象。可以把 option 整体抽成变量复用；与散 props 同时给出时，显式传入的散 props 优先。' },
  ],
}

/** height Props 说明（各图默认值不同，单独一条便于各图引用） */
export const F_HEIGHT_DEFAULT_FILL = {
  name: 'height',
  type: 'number',
  def: '不传填满父容器',
  desc: '图表高度（px），宽度始终随容器自适应。不传时填满父容器，要求父容器有确定高度（如 flex 布局的剩余空间）。',
}

/** 图例 Props：折线 / 柱形 / 散点 / 雷达 / 漏斗 / 盒须 / K线 共用 */
export const F_LEGEND = {
  name: 'legend',
  type: "boolean | { position?: 'top' | 'bottom' }",
  def: 'false',
  desc: "是否显示图例（点击可切换系列显隐，对齐 ECharts legend 的显隐交互）。true 显示在头部右侧；传对象可指定位置：'top' 头部（缺省）/ 'bottom' 图表下方。",
}

/** 轴配置：折线 / 柱形 / 散点 / 盒须 共用（对齐 ECharts xAxis / yAxis） */
export const SEC_AXIS: ApiSection = {
  title: '轴配置 KAxisOption',
  note: 'xAxis / yAxis 等轴属性共用这一份结构（对齐 ECharts xAxis / yAxis 的常用配置）。「数值轴」指标柱类目的那条轴，「类目轴」指底部类目那条轴。',
  fields: [
    { name: 'show', type: 'boolean', def: 'true', desc: '是否显示轴（轴线 + 刻度 + 标签）。柱形图上该属性同时控制网格线显隐。' },
    { name: 'name', type: 'string', def: '—', desc: '轴名称，如「销售额」「月份」，展示在轴末端附近。' },
    { name: 'nameLocation', type: "'start' | 'middle' | 'end'", def: "'end'", desc: "轴名位置（对齐 ECharts nameLocation）：'end' 轴末端（缺省）/ 'start' 轴起点 / 'middle' 居中。y 轴设为 'middle' 时名称会旋转 90° 竖排在轴左侧居中，是 ECharts 的经典样式。" },
    { name: 'nameGap', type: 'number', def: '图表内置值', desc: '轴名与轴线的距离（px）。' },
    { name: 'nameColor', type: 'string', def: '主题文字色', desc: '轴名文字颜色（对齐 ECharts nameTextStyle.color）。' },
    { name: 'type', type: "'value' | 'log'", def: "'value'", desc: "数值轴类型：'value' 线性（缺省）/ 'log' 对数（以 10 为底，适合跨数量级的数据，如 1 → 10000）。" },
    { name: 'min', type: 'number', def: '自适应', desc: '数值轴固定最小值（对齐 ECharts axis.min）。不传按数据自动推算；例如恒为正的业务指标常固定 min: 0 避免柱子被“截断”。' },
    { name: 'max', type: 'number', def: '自适应', desc: '数值轴固定最大值（对齐 ECharts axis.max）。配合 min 可锁定刻度域，多图对比时特别有用。' },
    { name: 'inverse', type: 'boolean', def: 'false', desc: '轴反向（对齐 ECharts inverse）。y 轴反向后 0 在顶部、最大值在底部；x 轴反向后类目从右往左排。' },
    { name: 'splitLine', type: 'boolean', def: 'true', desc: '数值轴网格线显隐（对齐 ECharts splitLine）。数据点少、图面干净时可关闭。' },
    { name: 'splitLineStyle', type: '{ color?: string; dash?: number[] }', def: '主题灰实线', desc: '网格线样式：color 改颜色，dash 传数组画虚线（如 [6, 4] 表示“画6px留4px”），不传为实线。' },
    { name: 'labelFormatter', type: '(value: number) => string', def: '内置格式', desc: '刻度文案格式化：只改显示文字，不影响刻度取值与布局。典型场景：大数显示中文数量级（10000 → 1万），可配合内置 formatCnNumber 使用。' },
    { name: 'labelRotate', type: 'number', def: '0', desc: '刻度标签倾斜角度（度）：正数向右倾斜（“/”形），负数向左（“\\”形）。x 轴类目文字过长重叠时的首选方案，底部空间会按最长标签自动预留。' },
    { name: 'labelInterval', type: 'number', def: '自动抽稀', desc: '类目轴标签稀疏显示（对齐 ECharts axisLabel.interval）：每 n+1 个显示 1 个，如 2 表示隔两个显示一个。不传时按标签宽度自动抽稀，显式指定后以用户值为准。' },
    { name: 'labelColor', type: 'string', def: '主题文字色', desc: '刻度标签文字颜色。' },
    { name: 'labelFontSize', type: 'number', def: '12', desc: '刻度标签字号（px）。' },
  ],
}

/** 标线 markLine（折线 / 柱形系列级） */
export const SEC_MARKLINE: ApiSection = {
  title: '标线 markLine（系列级）',
  note: '在图上叠加参考线，支持三种形态：数值阈值线、均值线、类目垂直线。写法：series 项上的 markLine: [{ ... }, ...]，也支持 { data: [...] } 包一层。',
  fields: [
    { name: 'yAxis', type: 'number', def: '—', desc: '水平阈值线：画在 y 轴该数值高度。例：markLine: [{ yAxis: 300, label: "目标 300" }] 即目标线。' },
    { name: 'xAxis', type: 'string | number', def: '—', desc: '垂直标线：传类目标签（或下标），在该类目处画一条贯穿上下的竖线。例：活动开始时间点。' },
    { name: 'type', type: "'average'", def: '—', desc: "内置类型：'average' 按本系列非空值求均值画水平线（均值基于全量数据，不随 dataZoom 缩放窗口变化）。" },
    { name: 'label', type: 'string', def: '见说明', desc: '标线文案覆盖。缺省：yAxis 显示数值、xAxis 显示类目、average 显示「平均值: v」。' },
    { name: 'color', type: 'string', def: '继承系列色', desc: '线与文案的颜色。' },
  ],
}

/** 标注点 markPoint（折线 / 柱形系列级） */
export const SEC_MARKPOINT: ApiSection = {
  title: '标注点 markPoint（系列级）',
  note: '在数据点上叠加「水滴 pin」标注（对齐 ECharts markPoint），尖端指向数据点、圆头内嵌白色数值。写法：series 项上的 markPoint: [{ type: "max" }, { type: "min" }]。',
  fields: [
    { name: 'type', type: "'max' | 'min'", def: '—', desc: "内置类型：'max' 标注本系列最大值 / 'min' 标注最小值。极值基于全量数据计算，不随 dataZoom 缩放窗口变化。" },
    { name: 'xAxis', type: 'string | number', def: '—', desc: '固定点：类目标签（或下标），与 value 搭配使用，在指定类目位置标注。' },
    { name: 'value', type: 'number', def: '—', desc: '固定点的数值（与 xAxis 搭配）。type 与 xAxis/value 同时给出时 type 优先。' },
    { name: 'label', type: 'string', def: '数值', desc: '标注文案覆盖，缺省显示数值（小数最多保留两位）。' },
    { name: 'color', type: 'string', def: '继承系列色', desc: '标注点颜色。' },
  ],
}

/** 标域 markArea（折线 / 柱形系列级） */
export const SEC_MARKAREA: ApiSection = {
  title: '标域 markArea（系列级）',
  note: '半透明矩形区域标注（对齐 ECharts markArea），用于高亮某段时间 / 某个数值区间。写法：series 项上的 markArea: [{ ... }]。',
  fields: [
    { name: 'xAxis', type: 'string | number', def: '—', desc: 'x 区间起点：类目标签或下标。只给起点不给终点时，区域为该类目一个带宽。' },
    { name: 'xAxis2', type: 'string | number', def: '—', desc: 'x 区间终点：类目标签或下标。例：markArea: [{ xAxis: "周三", xAxis2: "周四", label: "促销期" }] 高亮两天。' },
    { name: 'yAxis', type: 'number', def: '—', desc: 'y 区间下界（数值带）。只给 y 区间时区域横向贯穿全宽，典型如「目标区间」带。' },
    { name: 'yAxis2', type: 'number', def: '—', desc: 'y 区间上界（数值带）。' },
    { name: 'color', type: 'string', def: '半透明主题蓝', desc: '区域填充色（建议带透明度，否则会盖住网格）。' },
    { name: 'label', type: 'string', def: '—', desc: '区域左上角内侧的说明文案。' },
  ],
}

/** 数值参考带 / 分段着色（折线图专属） */
export const SEC_VALUEBAND: ApiSection = {
  title: '数值参考带与分段着色（图表级）',
  fields: [
    { name: 'valueBands', type: 'KValueBand[]', def: '—', desc: '数值参考带（AQI 可视化场景）：按数值区间在 y 方向画彩色横带，如空气质量“优 / 轻度污染”分色。' },
    { name: 'visualPieces', type: 'KValueBand[]', def: '—', desc: '分段着色（对齐 ECharts visualMap-piecewise）：按数值区间给折线分段着不同颜色，并在右侧显示分段图例。' },
    { name: 'KValueBand 字段', type: '{ min?, max?, color, label? }', def: '—', desc: '带的下界 / 上界（缺省取轴域极值）、颜色（必填）、带名称（标注在带内右侧，如“优”）。min 为开区间下界、max 为闭区间上界。' },
  ],
}

/** dataZoom（折线 / 柱形图表级） */
export const SEC_DATAZOOM: ApiSection = {
  title: 'dataZoom 缩放（图表级）',
  fields: [
    { name: 'dataZoom', type: 'boolean | KDataZoomOption', def: 'false', desc: '缩放窗口配置（对齐 ECharts dataZoom）。true 全域窗口；传对象可指定初始窗口：start / end 为百分比（0~100），如 { start: 40, end: 70 } 只展示中间 30% 数据。' },
    { name: 'slider（对象字段）', type: 'boolean', def: 'true', desc: '底部滑条（对齐 dataZoom-slider）：拖拽窗口平移、两端手柄缩放、点击轨道定位；传 false 隐藏滑条可纯滚轮交互。' },
    { name: 'inside（对象字段）', type: 'boolean', def: 'true', desc: '绘图区内交互（对齐 dataZoom-inside）：鼠标滚轮上滚放大 / 下滚缩小，以指针位置为锚点不跳变；窗口非全域时在绘图区按住拖拽可平移。横向柱图与垂直折线暂不支持。' },
  ],
}

/** 系列级 color / 数据点携带配置（折线 / 柱形共用说明） */
export const SEC_DATUM_ITEM: ApiSection = {
  title: '点级配置 SeriesDataItem',
  note: 'series 的 data 支持三种形态混用：裸数值 number、null（断点，折线在此断开）、对象。对象形态可以对单个点做精细化配置：',
  fields: [
    { name: 'value', type: 'number | null', def: '必填', desc: '数值；null 表示断点（折线图在此断开、柱形图不绘制）。' },
    { name: 'color', type: 'string', def: '继承系列色', desc: '点级颜色覆盖：单根柱子换色 / 单个点换色（对齐 ECharts itemStyle.color 的点级用法）。' },
    { name: 'label', type: '{ show?: boolean }', def: '—', desc: '点级文本标签配置。' },
    { name: 'meta', type: 'Record<string, unknown>', def: '—', desc: '业务数据透传：点击 / 悬停事件回调原样带回，适合挂订单 id 等业务字段。' },
  ],
}

// ============ 渐变颜色（KColor） ============

/**
 * 渐变颜色通用说明（对齐 ECharts graphic 配置形态）。
 * 挂载于折线 / 柱形 / 饼图 / 进度环等支持渐变着色的图表页。
 */
export const SEC_GRADIENT: ApiSection = {
  title: '渐变颜色（KColor）',
  note: '一切着色字段（series.color、backgroundColor、data.color 等）均可传纯色字符串或渐变配置对象。坐标为 0~1 的相对包围盒值，与 ECharts 完全一致；图例与 tooltip 色点会以 CSS 渐变同步展示。',
  fields: [
    { name: 'type', type: "'linear' | 'radial'", def: '必填', desc: "渐变类型。线性：{ type: 'linear', x, y, x2, y2, colorStops }；径向：{ type: 'radial', x, y, r, colorStops }。" },
    { name: 'x / y / x2 / y2', type: 'number', def: 'linear: 0, 0, 0, 1', desc: '线性渐变起点与终点（相对包围盒 0~1）。缺省自上而下；横向过渡传 x: 0, y: 0, x2: 1, y2: 0。' },
    { name: 'x / y / r', type: 'number', def: 'radial: 0.5, 0.5, 0.5', desc: '径向渐变圆心与半径（相对包围盒 0~1），环形图做中心发光效果常用。另支持 units: "user" 画布绝对像素坐标模式（进度环 bandGradient 内部即用此模式沿半径精确渐变）。' },
    { name: 'colorStops', type: '{ offset: number; color: string }[]', def: '必填', desc: '色标列表：offset 为 0~1 的相对位置（乱序传入会自动排序），color 支持任意 CSS 颜色（含 rgba 透明度，渐变面积填充的透明度就写在这里）。' },
  ],
}
