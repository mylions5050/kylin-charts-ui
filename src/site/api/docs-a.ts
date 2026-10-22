import type { ApiField, ApiSection, ChartApiDoc } from './types'
import { SEC_COMMON, SEC_AXIS, SEC_MARKLINE, SEC_MARKPOINT, SEC_MARKAREA, SEC_VALUEBAND, SEC_DATAZOOM, SEC_DATUM_ITEM, SEC_GRADIENT } from './shared'

/** 系列级 color 字段（折线 / 柱形 / 散点 / 盒须等系列制图表共用说明） */
const F_SERIES_COLOR: ApiField = {
  name: 'color',
  type: 'KColor',
  def: '按主题色板分配',
  desc: '系列颜色覆盖：不传按主题色板顺序自动分配（第 1 个系列紫、第 2 个蓝……）。支持纯色字符串或渐变配置对象（见下方渐变颜色说明），折线描边 / 柱条 / 面积填充与图例、tooltip 色点同步使用。',
}

// ============ 折线图 ============

const LINE_SERIES: ApiSection = {
  title: '系列配置 KLineSeries（series 数组项）',
  note: 'series 数组里每一项就是一条线。data 同样支持裸值 / null 断点 / 点级配置对象（见下方「点级配置」）。',
  fields: [
    { name: 'name', type: 'string', def: '必填', desc: '系列名称：图例、tooltip 中展示。' },
    { name: 'data', type: 'SeriesDatum[]', def: '必填', desc: '数据点，长度与 labels 对齐。' },
    F_SERIES_COLOR,
    { name: 'smooth', type: 'boolean', def: '读组件级 smooth', desc: '平滑曲线（Catmull-Rom 转贝塞尔）。与 step 互斥，同时给出时 step 优先。' },
    { name: 'step', type: "boolean | 'start' | 'middle' | 'end'", def: 'false', desc: '阶梯折线：true 等价 middle。start/middle/end 控制转折点在数据点的前 / 中 / 后。' },
    { name: 'area', type: 'boolean', def: 'false', desc: '填充面积（折线下方半透明色块）。' },
    { name: 'stack', type: 'string', def: '—', desc: '堆叠分组：相同 stack 值的系列按顺序逐类目累加；配合 area 即堆叠面积图。' },
    { name: 'yAxisIndex', type: '0 | 1', def: '0', desc: '数值轴选择：0 左轴（缺省）/ 1 右轴（需同时配置 yAxis2）。双轴折线的核心属性。' },
    { name: 'symbol', type: "KLineSymbol", def: "'emptyCircle'", desc: "数据点形状（对齐 ECharts symbol）：emptyCircle 白心圆环（缺省）/ circle 实心圆 / rect 方块 / triangle 三角 / diamond 菱形 / pin 水滴 / arrow 箭头 / none 隐藏。" },
    { name: 'symbolSize', type: 'number', def: '6', desc: '数据点直径（px）。' },
    { name: 'symbolRotate', type: 'number', def: '0', desc: '数据点旋转角度（度），对 rect / triangle / diamond / arrow 生效。' },
    { name: 'lineWidth', type: 'number', def: '2', desc: '折线宽度（px）。' },
    { name: 'lineType', type: "'solid' | 'dashed' | 'dotted'", def: "'solid'", desc: "线型：实线（缺省）/ dashed 虚线 / dotted 点线。多系列区分用（对齐 ECharts lineStyle.type）。" },
    { name: 'label', type: 'boolean | { show?: boolean }', def: 'false', desc: '常驻数据点标签：true 时每个点上方常驻显示数值（对齐 ECharts series.label.show）。数据密集时慎用，容易重叠。' },
    { name: 'markLine', type: 'KMarkLineDatum[]', def: '—', desc: '标线配置，详见下方「标线」分组。' },
    { name: 'markPoint', type: 'KMarkPointDatum[]', def: '—', desc: '标注点配置，详见下方「标注点」分组。' },
    { name: 'markArea', type: 'KMarkAreaDatum[]', def: '—', desc: '标域配置，详见下方「标域」分组。' },
  ],
}

const LINE_CHART_LEVEL: ApiSection = {
  title: '图表级专属配置',
  fields: [
    { name: 'labels', type: 'string[]', def: '必填', desc: 'x 轴类目标签数组，与每个系列 data 一一对应。numericX 开启时传数值字符串（如 "0.5"）。' },
    { name: 'series', type: 'KLineSeries[]', def: '必填', desc: '系列列表，见下方系列配置。' },
    { name: 'smooth', type: 'boolean', def: 'false', desc: '全局平滑开关（系列级 smooth 优先级更高）。' },
    { name: 'area', type: 'boolean', def: 'false', desc: '全局面积开关（系列级 area 优先级更高）。' },
    { name: 'step', type: "boolean | 'start' | 'middle' | 'end'", def: 'false', desc: '全局阶梯开关（系列级 step 优先级更高）。' },
    { name: 'boundaryGap', type: 'boolean', def: 'false', desc: '两端留白模式：false（缺省）首尾点贴齐轴两端，是 ECharts 折线惯例；true 点落在类目带中心、两端留半步空白（类目柱状习惯）。' },
    { name: 'bump', type: 'boolean', def: 'false', desc: '凹凸图：把各系列按类目换算成名次（1 = 最高画在顶端），粗线 + 全点，适合排名变化场景。' },
    { name: 'numericX', type: 'boolean', def: 'false', desc: '双数值轴：labels 传数值字符串，x 轴按线性比例尺取刻度（函数绘图 y=f(x)、散点连线的底层能力）。' },
    { name: 'vertical', type: 'boolean', def: 'false', desc: '垂直折线图：类目轴在 y（自下而上）、数值轴在 x，整体由水平图翻转而来。' },
    { name: 'showSymbol', type: 'boolean', def: 'true', desc: '是否常驻显示数据点：false 时不画点（悬停仍出现强调点），适合 AQI 这类密集数据。' },
    { name: 'yAxis2', type: 'KAxisOption', def: '—', desc: '次数值轴（右侧），配合系列 yAxisIndex: 1 使用。' },
    { name: 'xAxis2', type: 'KAxisOption', def: '—', desc: '次类目轴（顶部），展示与 x 轴相同的类目。' },
    { name: 'valueFormatter', type: '(value, name?) => string', def: '—', desc: 'tooltip 数值自定义格式化（对齐 ECharts tooltip.valueFormatter）：返回字符串替换默认数值展示，如 (v) => `¥${v} 万`。' },
    { name: 'dataZoom', type: 'boolean | KDataZoomOption', def: 'false', desc: 'dataZoom 缩放，详见下方「dataZoom 缩放」分组。' },
    { name: 'valueBands / visualPieces', type: 'KValueBand[]', def: '—', desc: '数值参考带 / 分段着色，详见下方「数值参考带」分组。' },
  ],
}

// ============ 柱形图 ============

const BAR_CHART_LEVEL: ApiSection = {
  title: '图表级专属配置',
  fields: [
    { name: 'labels', type: 'string[]', def: '必填', desc: 'x 轴类目标签；横向模式（horizontal: true）时作为 y 轴类目。' },
    { name: 'series', type: 'KBarSeries[]', def: '必填', desc: '系列列表，见下方系列配置。' },
    { name: 'horizontal', type: 'boolean', def: 'false', desc: '横向条形图：类目轴在 y、数值轴在 x，柱子自左向右生长。类目名很长时的首选布局。' },
    { name: 'barWidth', type: 'number', def: '自适应', desc: '柱宽（px，对齐 ECharts barWidth）。不传按槽位自适应（占槽位 80%），类目多时自动变细。' },
    { name: 'barGap', type: 'number', def: '0.25', desc: '同类目内系列柱之间的空隙占柱宽比例（对齐 ECharts barGap）。0 表示紧贴，越大越松。' },
    { name: 'barRadius', type: 'number', def: '0', desc: '柱体圆角半径（px，对齐 ECharts borderRadius），仅生长方向前端两角圆角。堆叠时每段都会圆角，建议单系列使用。' },
    { name: 'stackMode', type: "'value' | 'percent'", def: "'value'", desc: "堆叠模式：'value' 原始值堆叠（缺省）/ 'percent' 每个类目归一化为 100% 堆叠，看构成占比。" },
    { name: 'showBackground', type: 'boolean', def: 'false', desc: '柱形浅灰背景带（对齐 ECharts showBackground）：每个类目画一根全高背景柱，方便对比差距。' },
    { name: 'backgroundColor', type: 'KColor', def: '浅灰', desc: '背景带颜色（纯色或渐变配置），配合 showBackground 使用。' },
    { name: 'hoverHighlight', type: 'boolean | KColor', def: 'true', desc: '悬停高亮带（默认开启）：鼠标悬停时一根主题色淡色带平滑滑动到当前类目，独立开关不依赖 showBackground。传颜色对象可自定义（纯色/渐变），false 关闭。' },
    { name: 'staggerLabels', type: 'boolean', def: 'false', desc: 'x 轴类目标签交错两行显示（奇偶行错开），类目多或正负柱避让时开启，仅纵向模式。' },
    { name: 'waterfall', type: 'boolean', def: 'false', desc: '瀑布图模式：取第一个系列数据按累计浮动柱绘制（正增绿 / 负减红，点级 color 可覆盖），带阶梯连接线。' },
    { name: 'yAxis2', type: 'KAxisOption', def: '—', desc: '次数值轴（右侧）：折柱混合时 type: "line" 且 yAxisIndex: 1 的系列使用。' },
    { name: 'valueFormatter', type: '(value, name?) => string', def: '—', desc: 'tooltip 数值自定义格式化。' },
    { name: 'dataZoom', type: 'boolean | KDataZoomOption', def: 'false', desc: 'dataZoom 缩放，见折线图同名字段（横向模式不支持 inside 滚轮缩放）。' },
    { name: 'animationDelay', type: 'number | ((index: number) => number)', def: '0', desc: '入场逐柱延迟 ms（对齐 ECharts animationDelay）：每根柱依次错峰生长，传 90 表示相邻柱间隔 90ms 依次入场；传函数可按类目下标自定义延迟。' },
  ],
}

const BAR_SERIES: ApiSection = {
  title: '系列配置 KBarSeries（series 数组项）',
  fields: [
    { name: 'name', type: 'string', def: '必填', desc: '系列名称：图例、tooltip 中展示。' },
    { name: 'data', type: 'SeriesDatum[]', def: '必填', desc: '数据点，长度与 labels 对齐；支持点级 color 覆盖（瀑布图红绿即由点级 color 实现）。' },
    F_SERIES_COLOR,
    { name: 'type', type: "'bar' | 'line'", def: "'bar'", desc: "系列形态：'bar' 柱（缺省）/ 'line' 折线。折柱混合图：一个组件里部分系列画柱、部分画线。" },
    { name: 'smooth', type: 'boolean', def: 'false', desc: "折线形态平滑（仅 type: 'line' 生效）。" },
    { name: 'stack', type: 'string', def: '—', desc: '堆叠分组：相同 stack 值的系列纵向（横向图则横向）堆到同一根柱上。' },
    { name: 'yAxisIndex', type: '0 | 1', def: '0', desc: "所属数值轴：0 左轴（缺省）/ 1 右轴（仅 type: 'line' 系列生效）。" },
    { name: 'markLine / markPoint / markArea', type: '见对应分组', def: '—', desc: '标注系列，详见下方三个分组。' },
  ],
}

// ============ 雷达图 ============

const RADAR_SERIES: ApiSection = {
  title: '系列与维度配置',
  fields: [
    { name: 'indicators', type: 'KRadarIndicator[]', def: '必填', desc: '维度指标列表（至少 3 个）。每项：{ name: 维度名, max?: 该维度满格值（缺省取各系列在该维度的最大值） }。' },
    { name: 'series', type: 'KRadarSeries[]', def: '必填', desc: '数据系列：{ name, data: number[], area? }。data 顺序与 indicators 一一对应，缺位按 0 处理。' },
    { name: 'series[].area', type: 'boolean', def: '读组件级 area', desc: '该系列是否填充面积（系列级优先于全局 area）。' },
    { name: 'series[].color', type: 'string', def: '色板分配', desc: '点级颜色覆盖。' },
    { name: 'shape', type: "'polygon' | 'circle'", def: "'polygon'", desc: "网格形状：polygon 多边形（缺省）/ circle 圆形。" },
    { name: 'splitNumber', type: 'number', def: '5', desc: '网格圈数。' },
    { name: 'startAngle', type: 'number', def: '0', desc: '起始角度（度，0 = 12 点方向，顺时针）。' },
    { name: 'axisName', type: 'boolean', def: 'true', desc: '是否显示维度名称。' },
    { name: 'area', type: 'boolean', def: 'true', desc: '全局面积开关。' },
  ],
}

// ============ K 线图 ============

const CANDLE: ApiSection = {
  title: '数据与专属配置',
  fields: [
    { name: 'labels', type: 'string[]', def: '必填', desc: 'x 轴类目标签（交易日等），与 data 一一对应。' },
    { name: 'data', type: 'KCandleDatum[]', def: '必填', desc: 'K 线数据四元组：[开盘价, 收盘价, 最低价, 最高价]。收盘 ≥ 开盘为阳线（红），反之为阴线（绿）。' },
    { name: 'bullColor', type: 'string', def: "'#F5455C'", desc: '阳线颜色（收盘 ≥ 开盘），默认红涨。' },
    { name: 'bearColor', type: 'string', def: "'#00B578'", desc: '阴线颜色（收盘 < 开盘），默认绿跌。' },
    { name: 'ma', type: 'number[]', def: '[5, 10]', desc: '叠加均线周期列表，如 [5, 10, 20]；传空数组不绘制。均线基于全量数据计算。' },
    { name: 'legend', type: "boolean | { position? }", def: 'false', desc: 'MA 均线图例（点击可切换各条均线显隐），位置规则同通用 legend。' },
  ],
}

// ============ 平行坐标 / 主题河流 ============

const PARALLEL: ApiSection = {
  title: '数据与专属配置',
  fields: [
    { name: 'dimensions', type: 'KParallelDimension[]', def: '必填', desc: '维度定义（按轴顺序），每项：{ name, min?, max? }，值域缺省按数据自动推算。' },
    { name: 'data', type: 'KParallelDatum[]', def: '必填', desc: '数据记录：{ name?, values: number[], color? }。values 与 dimensions 一一对应；短了按 null 跳过该段（线在此断开）。' },
    { name: 'lineWidth', type: 'number', def: '2', desc: '折线宽度（px）。' },
  ],
}

const THEME_RIVER: ApiSection = {
  title: '数据与专属配置',
  fields: [
    { name: 'labels', type: 'string[]', def: '必填', desc: '时间轴标签（每列一个时间点）。' },
    { name: 'series', type: 'KThemeRiverSeries[]', def: '必填', desc: '系列列表：{ name, data: number[], color? }。data 与 labels 一一对应，河流带厚度按数值比例映射。' },
    { name: 'smooth', type: 'boolean', def: 'true', desc: '河流带边缘是否平滑曲线。' },
    { name: 'fillOpacity', type: 'number', def: '内置值', desc: '流带颜色不透明度 0~1。' },
  ],
}

// ============ 饼图家族 ============

const PIE_PROPS: ApiSection = {
  title: '组件 Props',
  note: '环形图（ring）= 饼图 + innerRadius: 0.6；玫瑰图（rose）= 饼图 + roseType: "radius"。三者共用同一套 props。',
  fields: [
    { name: 'data', type: 'KPieDatum[]', def: '必填', desc: '数据项列表：{ name, value, color? }。占比按可见数据（未被图例隐藏的）合计计算。' },
    { name: 'innerRadius', type: 'number', def: '0（饼）/ 0.6（环）', desc: '内半径比例 0~1：0 实心饼图，0.6 环形图。大于 0 时可用 centerTitle / centerSubtitle 在中心写字。' },
    { name: 'roseType', type: "'radius' | 'area'", def: '—', desc: '玫瑰模式：radius 扇区角度均分、半径按值映射；area 角度按值、半径随值微调。南丁格尔玫瑰图。' },
    { name: 'startAngle', type: 'number', def: '0', desc: '起始角度（度，0 = 12 点方向，顺时针）。' },
    { name: 'sweepAngle', type: 'number', def: '360', desc: '总扫描角（度，≤360）：180 即半环形图（进度盘常用）。' },
    { name: 'label', type: 'boolean', def: 'true', desc: '是否显示外部标签与引导线。' },
    { name: 'labelLayout', type: "'default' | 'aligned'", def: "'default'", desc: "标签布局：default 跟随扇区角度（缺省）/ aligned 左右分侧对齐 + 纵向分布防重叠（标签多时推荐）。" },
    { name: 'centerTitle / centerSubtitle', type: 'string', def: "''", desc: '环形中心主 / 副标题（innerRadius > 0 时生效）。' },
    { name: 'legendType', type: "'plain' | 'scroll'", def: "'plain'", desc: "图例类型：plain 常规换行 / scroll 超出宽度时横向滚动并显示分页箭头（对齐 ECharts legend.type）。" },
    { name: 'legendOrient', type: "'horizontal' | 'vertical'", def: "'horizontal'", desc: "图例排布方向：horizontal 横排在图上方 / vertical 竖排在图右侧（配合 scroll 上下分页，对齐 ECharts legend.orient）。" },
    { name: 'selectedMode', type: "'single' | 'multiple'", def: '—', desc: '选中模式（仅实心饼图支持扇区拆开位移）：single 单选 / multiple 多选；环形图与玫瑰图忽略。' },
    { name: 'selectedOffset', type: 'number', def: '10', desc: '选中扇区沿中角外移距离（px）。' },
    { name: 'itemBorder', type: 'boolean', def: 'true', desc: '扇区白色描边；传 false 即无边框。' },
    { name: 'itemRadius', type: 'number', def: '0', desc: '扇区圆角半径（px）。' },
    { name: 'itemGap', type: 'number', def: '0', desc: '相邻扇区间距（度）。' },
  ],
}

// ============ 层级类（旭日 / 树图 / 矩阵树 / 打包） ============

const SUNBURST: ApiSection = {
  title: '数据与专属配置',
  fields: [
    { name: 'data', type: 'KSunburstDatum[]', def: '必填', desc: '树形数据：{ name, value?, color?, children? }。顶层多项同时作为最内环；value 缺省自动取子级合计。' },
    { name: 'innerRadius', type: 'number', def: '0.15', desc: '内圈半径比例 0~0.8。' },
    { name: 'minAngle', type: 'number', def: '2', desc: '最小绘制角度（度）：小于该值的扇区不绘制，防止挤成细缝。' },
    { name: 'label', type: 'boolean', def: 'true', desc: '是否显示径向标签（沿半径方向排列的文字）。' },
  ],
}

const TREE: ApiSection = {
  title: '数据与专属配置',
  fields: [
    { name: 'data', type: 'KTreeDatum[]', def: '必填', desc: '树数据：{ name, value?, color?, children? }。顶层多项时作为多棵并排的森林；叶子 value 缺省按 0，父节点 value 缺省自动汇总子级。' },
    { name: 'orient', type: "TreeOrient（'LR' / 'TB' / 'radial' 等）", def: '横向', desc: '布局方向：横向（根在左）/ 纵向（根在上）/ 径向（根在中心，子级放射展开）。' },
    { name: 'levelGap', type: 'number', def: '自动填满', desc: '层间距 px（径向布局忽略）。' },
    { name: 'nodeGap', type: 'number', def: '20', desc: '叶节点间距上限 px，空间不足自动压缩。' },
    { name: 'nodeRadius', type: 'number', def: '6', desc: '节点圆点半径 px。' },
    { name: 'label', type: 'boolean', def: 'true', desc: '是否显示节点标签。' },
  ],
}

const TREEMAP: ApiSection = {
  title: '数据与专属配置',
  fields: [
    { name: 'data', type: 'KTreeDatum[]', def: '必填', desc: '层级数据（同树图结构），叶子节点 value 参与矩形面积分配。' },
    { name: 'gap', type: 'number', def: '1', desc: '矩形间隙 px。' },
    { name: 'label', type: 'boolean', def: 'true', desc: '是否显示叶子名称标签（矩形太小放不下时自动跳过）。' },
  ],
}

const CIRCLE_PACKING: ApiSection = {
  title: '数据与专属配置',
  fields: [
    { name: 'data', type: 'KTreeDatum[]', def: '必填', desc: '层级数据（同树图结构），叶子节点 value 决定圆面积。' },
    { name: 'gap', type: 'number', def: '6', desc: '圆间距 px。' },
    { name: 'label', type: 'boolean', def: 'true', desc: '是否显示圆内名称标签（空间不足自动跳过）。' },
  ],
}

// ============ 漏斗图 ============

const FUNNEL: ApiSection = {
  title: '数据与专属配置',
  fields: [
    { name: 'data', type: 'KFunnelDatum[]', def: '必填', desc: '数据项：{ name, value, color? }。层宽按 value / 最大值映射，展示顺序由 sort 决定。' },
    { name: 'sort', type: "'desc' | 'asc' | 'none'", def: "'desc'", desc: "排序：desc 从大到小（缺省）/ asc 从小到大 / none 按传入顺序。" },
    { name: 'align', type: "'center' | 'left' | 'right'", def: "'center'", desc: '水平对齐方式。' },
    { name: 'shape', type: "'funnel' | 'triangle' | 'pyramid' | 'square' | 'circle'", def: "'funnel'", desc: "形态：funnel 梯形漏斗（缺省）/ triangle 倒三角 / pyramid 正金字塔 / square 方形 / circle 圆泡漏斗。" },
    { name: 'gap', type: 'number', def: '6', desc: '层间距 px。' },
    { name: 'label', type: 'boolean', def: 'true', desc: '标签：层内显示名称、层外引导线显示数值。' },
  ],
}

export const DOCS_A: ChartApiDoc[] = [
  {
    slug: 'line-chart',
    intro: '直角坐标系折线图：展示趋势变化的首选。支持平滑 / 阶梯 / 面积 / 堆叠 / 双轴 / 凹凸图 / 对数轴 / 双数值轴等形态，以及标线、标注点、标域、滑条缩放等标注能力，配置语义与 ECharts 对齐。',
    sections: [LINE_CHART_LEVEL, LINE_SERIES, SEC_DATUM_ITEM, SEC_AXIS, SEC_MARKLINE, SEC_MARKPOINT, SEC_MARKAREA, SEC_VALUEBAND, SEC_DATAZOOM, SEC_GRADIENT, SEC_COMMON],
  },
  {
    slug: 'bar-chart',
    intro: '直角坐标系柱形图：类目对比的首选。支持分组 / 堆叠 / 百分比堆叠 / 横向条形 / 瀑布图 / 折柱混合 / 背景带 / 柱宽圆角等能力，标注系列与轴配置与折线图完全一致。',
    sections: [BAR_CHART_LEVEL, BAR_SERIES, SEC_DATUM_ITEM, SEC_AXIS, SEC_MARKLINE, SEC_MARKPOINT, SEC_MARKAREA, SEC_DATAZOOM, SEC_GRADIENT, SEC_COMMON],
  },
  {
    slug: 'radar-chart',
    intro: '雷达图：多维能力 / 指标对比，支持多边形与圆形网格、面积填充、多系列叠加。',
    sections: [RADAR_SERIES, { title: '通用 Props', note: '含 title / height / emptyText / padding / option。', fields: [...SEC_COMMON.fields, { name: 'height', type: 'number', def: '360', desc: '图表高度 px（宽度随容器自适应）。' }] }],
  },
  {
    slug: 'candlestick-chart',
    intro: 'K 线（蜡烛）图：金融行情标配，内置 MA 均线与红涨绿跌配色。',
    sections: [CANDLE, { title: '通用 Props', note: '含 title / height / emptyText / padding / option。', fields: SEC_COMMON.fields }],
  },
  {
    slug: 'parallel-chart',
    intro: '平行坐标图：多维数据每一维一根竖轴，一条折线代表一条记录，适合观察多维分布与相关性。',
    sections: [PARALLEL, { title: '通用 Props', note: '含 title / height / emptyText / padding / option。', fields: SEC_COMMON.fields }],
  },
  {
    slug: 'theme-river-chart',
    intro: '主题河流图：多系列随时间的数值变化，以层叠流带呈现，比堆叠面积图更有整体感。',
    sections: [THEME_RIVER, { title: '通用 Props', note: '含 title / height / emptyText / padding / option。', fields: SEC_COMMON.fields }],
  },
  {
    slug: 'pie-chart',
    intro: '饼图：占比构成的基础形态，支持扇区选中拆开、圆角扇区、分侧标签布局与滚动图例。',
    sections: [PIE_PROPS, SEC_GRADIENT, { title: '通用 Props', note: '含 title / height / emptyText / padding / option。', fields: [...SEC_COMMON.fields, { name: 'height', type: 'number', def: '320', desc: '图表高度 px（宽度随容器自适应）。' }] }],
  },
  {
    slug: 'ring-chart',
    intro: '环形图：innerRadius 固定为 0.6 的饼图变体，中心可放主副标题，其余 props 与饼图完全一致。',
    sections: [PIE_PROPS, { title: '通用 Props', note: '含 title / height / emptyText / padding / option。', fields: [...SEC_COMMON.fields, { name: 'height', type: 'number', def: '320', desc: '图表高度 px（宽度随容器自适应）。' }] }],
  },
  {
    slug: 'rose-chart',
    intro: '玫瑰图（南丁格尔图）：roseType 固定为 radius 的饼图变体，扇区角度均分、半径按数值映射，适合对比量级差异明显的类目。',
    sections: [PIE_PROPS, { title: '通用 Props', note: '含 title / height / emptyText / padding / option。', fields: [...SEC_COMMON.fields, { name: 'height', type: 'number', def: '320', desc: '图表高度 px（宽度随容器自适应）。' }] }],
  },
  {
    slug: 'sunburst-chart',
    intro: '旭日图：多级占比的环形展开，父级 value 缺省自动汇总子级。',
    sections: [SUNBURST, { title: '通用 Props', note: '含 title / height / emptyText / padding / option。', fields: SEC_COMMON.fields }],
  },
  {
    slug: 'tree-chart',
    intro: '树图：层级关系的节点连线展示，支持横向 / 纵向 / 径向三种布局与森林（多根）模式。',
    sections: [TREE, { title: '通用 Props', note: '含 title / height / emptyText / padding / option。', fields: SEC_COMMON.fields }],
  },
  {
    slug: 'treemap-chart',
    intro: '矩阵树图：用矩形面积表达层级数值，空间利用率高。',
    sections: [TREEMAP, { title: '通用 Props', note: '含 title / height / emptyText / padding / option。', fields: SEC_COMMON.fields }],
  },
  {
    slug: 'circle-packing-chart',
    intro: '圆填充图：用嵌套圆面积表达层级数值，视觉上比矩形更柔和。',
    sections: [CIRCLE_PACKING, { title: '通用 Props', note: '含 title / height / emptyText / padding / option。', fields: SEC_COMMON.fields }],
  },
  {
    slug: 'funnel-chart',
    intro: '漏斗图：转化漏斗 / 流程递减，支持五种形态与排序方向。',
    sections: [FUNNEL, { title: '通用 Props', note: '含 title / height / emptyText / padding / option。', fields: [...SEC_COMMON.fields, { name: 'height', type: 'number', def: '400', desc: '图表高度 px（宽度随容器自适应）。' }] }],
  },
]
