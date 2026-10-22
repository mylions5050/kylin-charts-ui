/**
 * KCharts 核心类型定义
 *
 * 设计原则：
 * 1. 图表 = 坐标系（Coordinate）+ 系列（Series）+ 场景图（SceneGraph）
 * 2. 所有类型平台无关：不依赖 DOM / Canvas，为后续双渲染引擎预留
 */

// ============ 图表类型 ============

/** 图表类型全集（按路线图逐步实现） */
export type ChartType =
  | 'line'
  | 'bar'
  | 'pie'
  | 'ring'
  | 'rose'
  | 'radar'
  | 'funnel'
  | 'scatter'
  | 'area'
  | 'candlestick'
  | 'sunburst'
  | 'treemap'
  | 'heatmap'
  | 'calendar-heatmap'
  | 'gauge'
  | 'sankey'
  | 'mixed'

// ============ 数据类型 ============

/** 系列数据点：裸值 / null 断点 / 携带配置的对象（归一化见 utils/series-data） */
export type SeriesDatum = number | null | SeriesDataItem

/** 携带配置的数据点 */
export interface SeriesDataItem {
  value: number | null
  /** 点级颜色（覆盖系列色） */
  color?: string
  /** 点级文本标签 */
  label?: { show?: boolean }
  /** 业务数据透传（事件回调原样带回） */
  meta?: Record<string, unknown>
}

// ============ 颜色与渐变（对齐 ECharts graphic 配置形态） ============

/** 渐变色标：offset 为 0 ~ 1 的相对位置 */
export interface KGradientStop {
  offset: number
  color: string
}

/** 线性渐变（对齐 ECharts LinearGradient）：x/y/x2/y2 为 0 ~ 1 的相对包围盒坐标，缺省自上而下 */
export interface KLinearGradient {
  type: 'linear'
  /** 起点相对 x（缺省 0） */
  x?: number
  /** 起点相对 y（缺省 0） */
  y?: number
  /** 终点相对 x（缺省 0） */
  x2?: number
  /** 终点相对 y（缺省 1） */
  y2?: number
  /** 色标列表（按 offset 升序使用） */
  colorStops: KGradientStop[]
}

/** 径向渐变（对齐 ECharts RadialGradient）：x/y 为圆心相对坐标，r 为相对半径（0 ~ 1） */
export interface KRadialGradient {
type: 'radial'
/** 坐标模式：'obb' 相对元素包围盒 0~1（缺省，与 ECharts 一致）/ 'user' 画布绝对像素坐标（进度环沿半径渐变等场景） */
units?: 'obb' | 'user'
/** 圆心相对 x（缺省 0.5；units='user' 时为画布绝对坐标 px） */
x?: number
/** 圆心相对 y（缺省 0.5；units='user' 时为画布绝对坐标 px） */
y?: number
/** 相对半径（缺省 0.5；units='user' 时为画布绝对半径 px） */
r?: number
  /** 色标列表（按 offset 升序使用） */
  colorStops: KGradientStop[]
}

/** 渐变配置统一类型 */
export type KGradient = KLinearGradient | KRadialGradient

/** 颜色：纯色字符串或渐变配置（可用于 series.color、背景带、仪表盘刻度色等一切着色字段） */
export type KColor = string | KGradient

/** 系列基础结构 */
export interface SeriesBase {
  /** 系列名称（图例 / tooltip 使用） */
  name: string
  /** 系列颜色，纯色或渐变配置，缺省时按主题色板自动分配 */
  color?: KColor
}

/** 阶梯折线转折位置（对齐 ECharts step 语义） */
export type StepPosition = 'start' | 'middle' | 'end'

/** 折线符号形状（对齐 ECharts symbol）：emptyCircle 白心圆环为默认，none 隐藏点 */
export type KLineSymbol = 'circle' | 'emptyCircle' | 'rect' | 'triangle' | 'diamond' | 'pin' | 'arrow' | 'none'

/** 折线图系列 */
export interface KLineSeries extends SeriesBase {
  data: SeriesDatum[]
  /** 平滑曲线（Catmull-Rom 转 Bezier），缺省读组件级 smooth；与 step 互斥，step 优先 */
  smooth?: boolean
  /** 阶梯折线：true 等价 'middle'；与 smooth 互斥，step 优先 */
  step?: boolean | StepPosition
  /** 是否填充面积 */
  area?: boolean
  /** 堆叠分组标识：相同 stack 值的系列按顺序累加，area 时填充到上一系列的累计线 */
  stack?: string
  /** 数值轴选择：0 左轴（缺省）/ 1 右轴（需配合 yAxis2 配置） */
  yAxisIndex?: 0 | 1
  /** 标线（对齐 ECharts markLine）：阈值线 / 均值线 / 垂直类目标线 */
  markLine?: KMarkLineGroup | KMarkLineDatum[]
  /** 标注点（对齐 ECharts markPoint）：max/min 或固定点 */
  markPoint?: KMarkPointGroup | KMarkPointDatum[]
  /** 标域（对齐 ECharts markArea）：类目带 / 数值带半透明区间 */
  markArea?: KMarkAreaGroup | KMarkAreaDatum[]
  /** 数据点符号形状（对齐 ECharts symbol），缺省 emptyCircle 白心圆环，none 隐藏点 */
  symbol?: KLineSymbol
  /** 数据点符号大小（直径 px），缺省 6 */
  symbolSize?: number
  /** 数据点符号旋转角度（度），对 rect / triangle / diamond / arrow 生效 */
  symbolRotate?: number
  /** 折线宽度（px），缺省 2 */
  lineWidth?: number
  /** 折线线型（对齐 ECharts lineStyle.type）：solid 缺省 / dashed 虚线 / dotted 点线 */
  lineType?: 'solid' | 'dashed' | 'dotted'
  /** 常驻数据点标签（对齐 ECharts series.label.show）：true 在每个点上方常驻显示数值 */
  label?: boolean | { show?: boolean }
}

/** 标线数据项（对齐 ECharts markLine.data 单项语义） */
export interface KMarkLineDatum {
  /** 水平阈值线：y 轴数值 */
  yAxis?: number
  /** 垂直标线：x 轴类目（标签匹配）或类目下标 */
  xAxis?: string | number
  /** 内置类型：'average' 按本系列非空值求均值画水平线 */
  type?: 'average'
  /** 标线文案覆盖（缺省：average 为「平均值: v」，yAxis 为数值，xAxis 为类目） */
  label?: string
  /** 线与文案颜色，缺省继承系列色 */
  color?: string
}

/** 标线配置组（对齐 ECharts series.markLine） */
export interface KMarkLineGroup {
  data: KMarkLineDatum[]
}

/** 标注点数据项（对齐 ECharts markPoint.data 单项语义，支持 max/min 或固定点） */
export interface KMarkPointDatum {
  /** 内置类型：'max' 本系列最大值 / 'min' 本系列最小值 */
  type?: 'max' | 'min'
  /** 固定点：类目（标签匹配或下标），与 value 搭配使用 */
  xAxis?: string | number
  /** 固定点数值（与 xAxis 搭配；type 与 xAxis/value 同时给出时 type 优先） */
  value?: number
  /** 标注文案覆盖（缺省为数值） */
  label?: string
  /** 标注点颜色，缺省继承系列色 */
  color?: string
}

/** 标注点配置组（对齐 ECharts series.markPoint） */
export interface KMarkPointGroup {
  data: KMarkPointDatum[]
}

/**
 * 标域数据项（对齐 ECharts markArea.data 单项语义）：
 * 类目带区间（xAxis~xAxis2）或数值带区间（yAxis~yAxis2），可同时给出生成矩形区域
 */
export interface KMarkAreaDatum {
  /** x 区间起点：类目标签或下标；单个类目带时也接受（宽为半步） */
  xAxis?: string | number
  /** x 区间终点：类目标签或下标 */
  xAxis2?: string | number
  /** y 区间下界（数值轴） */
  yAxis?: number
  /** y 区间上界（数值轴） */
  yAxis2?: number
  /** 区域颜色，缺省半透明主题蓝 */
  color?: string
  /** 区域左上角文案 */
  label?: string
}

/** 标域配置组（对齐 ECharts series.markArea） */
export interface KMarkAreaGroup {
  data: KMarkAreaDatum[]
}

/** 柱形图系列 */
export interface KBarSeries extends SeriesBase {
  data: SeriesDatum[]
  /** 堆叠分组标识：相同 stack 值的系列纵向/横向堆叠在同一根柱上，缺省为分组并排 */
  stack?: string
  /** 系列形态：'bar'（缺省）为柱，'line' 为叠加折线（折柱混合） */
  type?: 'bar' | 'line'
  /** 折线形态（type='line' 时生效）：平滑曲线 */
  smooth?: boolean
  /** 所属数值轴：0 左轴（缺省）/ 1 右轴（需配 option.yAxis2） */
  yAxisIndex?: 0 | 1
  /** 标线（对齐 ECharts markLine）：阈值线 / 均值线 / 垂直类目标线 */
  markLine?: KMarkLineGroup | KMarkLineDatum[]
  /** 标注点（对齐 ECharts markPoint）：max/min 或固定点 */
  markPoint?: KMarkPointGroup | KMarkPointDatum[]
  /** 标域（对齐 ECharts markArea）：类目带 / 数值带半透明区间 */
  markArea?: KMarkAreaGroup | KMarkAreaDatum[]
}

/** 饼图 / 环形图 / 玫瑰图数据项 */
export interface KPieDatum {
  /** 名称（图例 / 标签 / tooltip 使用） */
  name: string
  /** 数值（占比按可见数据合计计算） */
  value: number
  /** 扇区颜色（纯色或渐变），缺省按主题色板自动分配 */
  color?: KColor
}

/** 雷达图维度指标 */
export interface KRadarIndicator {
  /** 维度名称（轴标签） */
  name: string
  /** 该维度最大值（半径满格），缺省取各系列在该维度的最大值 */
  max?: number
}

/** 雷达图系列（data 顺序与 indicators 一一对应，缺位按 0 处理） */
export interface KRadarSeries extends SeriesBase {
  data: number[]
  /** 是否填充面积，缺省读组件级 area */
  area?: boolean
}

/** 漏斗图数据项（展示顺序由 sort 决定，颜色与图例按原数据索引分配） */
export interface KFunnelDatum {
  /** 阶段名称 */
  name: string
  /** 数值（宽度按 value / 最大值 映射） */
  value: number
  /** 层级颜色，缺省按主题色板自动分配 */
  color?: string
}

/** 桑基图节点（流量汇集点，高度 = max(入和, 出和, value) 按比例映射） */
export interface KSankeyNode {
  /** 节点名称（links 的 source / target 均按 name 关联，需唯一） */
  name: string
  /** 节点自身流量参考值；缺省自动推断为 max(入和, 出和) */
  value?: number
  /** 节点颜色，缺省按主题色板自动分配 */
  color?: string
}

/** 桑基图链路（从 source 节点右侧流向 target 节点左侧） */
export interface KSankeyLink {
  /** 源节点名称 */
  source: string
  /** 目标节点名称 */
  target: string
  /** 流量值（链路厚度按 value 比例映射） */
  value: number
  /** 链路颜色，缺省继承源节点色并加透明度 */
  color?: string
}

/** 旭日图节点（树形层级，value 缺省时自动取子级合计） */
export interface KSunburstDatum {
  /** 节点名称（环内径向标签） */
  name: string
  /** 数值；有子级时缺省取子级合计，叶子节点建议显式给出 */
  value?: number
  /** 节点颜色，缺省顶层按色板分配、子级继承父级色并随层级降透明度 */
  color?: string
  /** 子级列表（递归层级） */
  children?: KSunburstDatum[]
}

// ============ K 线图数据类型 ============

/** K 线（蜡烛）图数据项：[开盘价, 收盘价, 最低价, 最高价] */
export type KCandleDatum = [open: number, close: number, low: number, high: number]

// ============ 散点图数据类型 ============

/** 散点图数据项：[x, y]；第三位 size（点半径 px）可选，用于气泡图 */
export type KScatterDatum = [x: number, y: number, size?: number]

/** 散点图系列 */
export interface KScatterSeries {
  /** 系列名称（图例与 tooltip 展示） */
  name: string
  /** 数据点列表（x / y 为数值，双轴均为数值轴） */
  data: KScatterDatum[]
  /** 系列颜色，缺省按主题色板自动分配 */
  color?: string
  /** 默认点半径 px（数据项第三位 size 优先于该值），缺省 4 */
  radius?: number
}

// ============ 热力图数据类型 ============

/** 热力图数据项：[列索引, 行索引, 数值]；缺失的行列组合不绘制（稀疏留白） */
export type KHeatmapDatum = [column: number, row: number, value: number]

// ============ 树图数据类型 ============

/** 树图节点：叶子节点的 value 缺省时按 0 处理；父节点 value 缺省时自动取子级合计 */
export interface KTreeDatum {
  /** 节点名称（节点旁标签与 tooltip） */
  name: string
  /** 数值；父节点缺省自动汇总子级 */
  value?: number
  /** 节点颜色，缺省顶层按色板分配、子级继承父级色并随层级降透明度 */
  color?: string
  /** 子级列表（递归层级） */
  children?: KTreeDatum[]
}

// ============ 盒须图数据类型 ============

/** 盒须图五数概括：[下须 min, Q1, 中位数, Q3, 上须 max] */
export type KBoxFive = [min: number, q1: number, median: number, q3: number, max: number]

/** 盒须图数据项（对象形态，支持异常点与点级颜色） */
export interface KBoxplotItem {
  /** 五数概括 [下须, Q1, 中位数, Q3, 上须] */
  value: KBoxFive
  /** 上须 / 下须之外的离散异常点（须外圆点） */
  outliers?: number[]
  /** 点级颜色覆盖 */
  color?: string
}

/** 盒须图数据项：支持裸五数概括元组或携带异常点的对象双形态 */
export type KBoxplotDatum = KBoxFive | KBoxplotItem

/** 盒须图系列（每个类目一个盒，data 与 labels 一一对应） */
export interface KBoxplotSeries {
  /** 系列名称（图例与 tooltip） */
  name: string
  /** 盒须数据（长度对齐 labels，缺项跳过） */
  data: KBoxplotDatum[]
  /** 系列颜色，缺省按主题色板自动分配 */
  color?: string
}

// ============ 和弦图数据类型 ============

/** 和弦图节点（圆上弧段），弧长由关联链路流量自动汇总 */
export interface KChordNode {
  /** 节点名称（弧旁标签与 tooltip） */
  name: string
  /** 节点颜色，缺省按主题色板自动分配 */
  color?: string
}

/** 和弦图链路（弦），source / target 为节点 name；自环与未知节点链路自动跳过 */
export interface KChordLink {
  source: string
  target: string
  value: number
}

// ============ 关系图数据类型 ============

/** 关系图节点（force / circular / none 三种布局共用） */
export interface KGraphNode {
  /** 节点名称（links 按 name 关联时需唯一，重名时后者优先；标签与 tooltip 展示） */
  name: string
  /** 节点权重（半径按 √value 比例映射），缺省 10 */
  value?: number
  /** 节点颜色（优先级高于类目色），缺省按类目色 / 主题色板 */
  color?: string
  /** 类目下标（categories 数组索引），缺省无类目 */
  category?: number
  /** 固定横坐标 px（layout 'none' 时生效，缺省居中） */
  x?: number
  /** 固定纵坐标 px（layout 'none' 时生效，缺省居中） */
  y?: number
}

/** 关系图链路，source / target 支持节点 name 或节点下标；未知节点与自环自动跳过 */
export interface KGraphLink {
  source: string | number
  target: string | number
  /** 链路权重（线宽按比例映射），缺省 1 */
  value?: number
}

/** 关系图类目（节点配色分组，tooltip 展示类目名） */
export interface KGraphCategory {
  /** 类目名称 */
  name: string
  /** 类目颜色，缺省按主题色板顺序分配 */
  color?: string
}

// ============ 布局类型 ============

/** 轴配置（x / y 通用，折线图 / 柱形图等直角坐标系图表共用） */
export interface KAxisOption {
  /** 是否显示轴（轴线 + 刻度 + 标签），默认 true */
  show?: boolean
  /** 轴名称（如“销售额”“月份”） */
  name?: string
  /** 轴类型：value 线性（缺省）/ log 对数（以 10 为底，域内刻度落在 10 的整数次幂） */
  type?: 'value' | 'log'
  /**
   * 刻度标签自定义格式化：只改文案，不影响刻度取值与布局。
   * 典型场景：数据量大时 y 轴显示中文数量级（10000 -> 1万）。
   * 可配合 formatCnNumber 使用；缺省用内置数值格式
   */
  labelFormatter?: (value: number) => string
  /**
   * 刻度标签倾斜角度（度）：正数向右倾斜（"/" 形，如 45），负数向左（"\" 形）。
   * 常用于 x 轴类目文案过长导致的重叠；底部空间会按最长标签自动预留（封顶 48px）
   */
  labelRotate?: number
  /** 数值轴固定最小值（对齐 ECharts axis.min）：不传用自适应域 */
  min?: number
  /** 数值轴固定最大值（对齐 ECharts axis.max）：不传用自适应域 */
  max?: number
  /** 轴反向（对齐 ECharts inverse）：y 轴反向后最大值在底部、0 在顶部 */
  inverse?: boolean
  /** 数值轴网格线显隐（对齐 ECharts splitLine），缺省 true */
  splitLine?: boolean
  /** 轴名位置（对齐 ECharts nameLocation）：end 缺省在轴末端 / start 轴起点 / middle 居中 */
  nameLocation?: 'start' | 'middle' | 'end'
  /** 轴名与轴线的距离（px），缺省沿用图表内置值 */
  nameGap?: number
  /** 刻度标签文字颜色，缺省用主题 textColor */
  labelColor?: string
  /** 刻度标签字号，缺省用主题 fontSize */
  labelFontSize?: number
  /** 轴名文字颜色（对齐 ECharts nameTextStyle.color），缺省用主题 textColor */
  nameColor?: string
  /**
   * 类目轴刻度标签稀疏显示（对齐 ECharts axisLabel.interval）：每 n+1 个显示 1 个。
   * 缺省按宽度自动抽稀；显式指定后以用户值优先
   */
  labelInterval?: number
  /** 网格线样式（对齐 ECharts splitLine.lineStyle）：缺省用主题 gridColor 实线 */
  splitLineStyle?: { color?: string; dash?: number[] }
}

/** 画布内边距 */
export interface Padding {
  top: number
  right: number
  bottom: number
  left: number
}

/** 二维点 */
export interface Point {
  x: number
  y: number
}

/** 悬停信息（图表 → 组件层，用于 tooltip 定位） */
export interface HoverInfo {
  /** 悬停命中的数据索引 */
  index: number
  /** 悬停引导点像素坐标（相对图表容器） */
  x: number
  y: number
}

// ============ 渲染上下文 ============

/** 图表构建场景图时拿到的上下文 */
export interface RenderContext {
  width: number
  height: number
  /** 当前悬停的数据索引（无悬停为 null） */
  hoverIndex: number | null
  /** 入场动画进度 0 ~ 1（动画完成后恒为 1） */
  progress: number
}

// ============ 事件 ============

/**
* dataZoom 缩放（对齐 ECharts dataZoom）：
* true 等价 { start: 0, end: 100 }；start/end 为窗口起止百分比（0~100）。
* slider（缺省 true）：底部滑条，支持窗口拖拽平移、两端手柄缩放、点击轨道定位。
* inside（缺省 true）：绘图区内交互——鼠标滚轮以指针为锚点缩放、窗口非全域时按住拖拽平移（垂直折线/横向柱图暂不支持 inside）。
*/
export interface KDataZoomOption {
/** 窗口起始百分比 0~100，缺省 0 */
start?: number
/** 窗口结束百分比 0~100，缺省 100 */
end?: number
/** 绘图区滚轮缩放 + 拖拽平移（对齐 dataZoom-inside），缺省 true */
inside?: boolean
/** 底部滑条（对齐 dataZoom-slider），缺省 true；传 false 可纯滚轮缩放 */
slider?: boolean
}

/** BaseChart 对外事件集合 */
export interface ChartEvents {
  /** 悬停变化（离开图表时 info 为 null） */
  onHover?: (info: HoverInfo | null) => void
  /** 点击命中数据项（index 与悬停索引同源；拖拽/滑动不触发） */
  onClick?: (index: number, info: HoverInfo) => void
}

// ============ 仪表盘数据类型 ============

/** 仪表盘阈值色标（value 为 0~1 的进度位置） */
export interface KGaugeStop {
  /** 色标位置 0~1 */
  value: number
  /** 该位置起的颜色 */
  color: string
}

/** 仪表盘数据（单值 + 可选展示配置） */
export interface KGaugeDatum {
  /** 指标名称（tooltip / 图内展示） */
  name?: string
  /** 当前值 */
  value: number
  /** 量程下限，缺省 0 */
  min?: number
  /** 量程上限，缺省 100 */
  max?: number
  /** 数值单位（展示在数值后） */
  unit?: string
}

// ============ 日历热力图数据类型 ============

/** 日历热力图数据项（date 为 'YYYY-MM-DD'） */
export interface KCalendarDatum {
  /** 日期，格式 'YYYY-MM-DD' */
  date: string
  /** 热度值 */
  value: number
}

// ============ 平行坐标数据类型 ============

/** 平行坐标维度（一条竖轴） */
export interface KParallelDimension {
  /** 维度名称（轴底部展示） */
  name: string
  /** 维度值域下限，缺省按数据自动推算 */
  min?: number
  /** 维度值域上限，缺省按数据自动推算 */
  max?: number
}

/** 平行坐标数据项（values 与 dimensions 一一对应） */
export interface KParallelDatum {
  /** 记录名称（tooltip / 图例展示） */
  name?: string
  /** 各维度取值（长度需与 dimensions 一致，短了按 null 跳过该段） */
  values: number[]
  /** 线条颜色（缺省按色板循环） */
  color?: string
}

// ============ 词云数据类型 ============

/** 词云数据项 */
export interface KWordcloudDatum {
  /** 词语 */
  name: string
  /** 词频（字号按 √value 映射） */
  value: number
  /** 文字颜色（缺省按色板循环） */
  color?: string
}

// ============ 主题河流数据类型 ============

/** 主题河流系列（data 与时间轴 labels 一一对应） */
export interface KThemeRiverSeries {
  /** 系列名称 */
  name: string
  /** 各时间点的值（长度需与 labels 一致） */
  data: number[]
  /** 颜色（缺省按色板循环） */
  color?: string
}

// ============ 进度环数据类型 ============

/** 进度环数据（单值 + 可选展示配置） */
export interface KProgressDatum {
  /** 指标名称（中心 / tooltip 展示） */
  name?: string
  /** 当前值 */
  value: number
  /** 量程上限，缺省 100 */
  max?: number
  /** 数值单位（展示在数值后） */
  unit?: string
  /** 自定义扇区/圆弧颜色（纯色或渐变），缺省按主题色板取色 */
  color?: KColor
}

// ============ 线性进度条数据类型 ============

/** 线性进度条数据项 */
export interface KProgressBarDatum {
  /** 行名称 */
  name: string
  /** 当前值 */
  value: number
  /** 量程上限，缺省 100 */
  max?: number
  /** 数值单位（展示在数值后） */
  unit?: string
  /** 条颜色（纯色或渐变配置），缺省按色板循环 */
  color?: KColor
}

// ============ 子弹图数据类型 ============

/** 子弹图数据项（ranges 为升序分段阈值） */
export interface KBulletDatum {
  /** 行名称 */
  name: string
  /** 实际值 */
  value: number
  /** 目标值（竖线标记，可省略） */
  target?: number
  /** 定性分段阈值（升序，如 [60, 85, 100]；缺省按实际值 1.25 倍单段） */
  ranges?: number[]
  /** 数值单位（展示在数值后） */
  unit?: string
  /** 值条颜色，缺省主题主色 */
  color?: string
}
