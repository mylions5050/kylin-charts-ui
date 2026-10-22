import type { ApiSection, ChartApiDoc } from './types'
import { SEC_COMMON, SEC_AXIS, SEC_GRADIENT } from './shared'

/** 通用（不传 height 时填满父容器的图表） */
const COMMON_FILL: ApiSection = { title: '通用 Props', note: '含 title / height（不传填满父容器）/ emptyText / padding / option。', fields: SEC_COMMON.fields }

// ============ 关系网络 ============

const SANKEY: ApiSection = {
  title: '数据与专属配置',
  fields: [
    { name: 'nodes', type: 'KSankeyNode[]', def: '必填', desc: '节点列表：{ name, value?, color? }。name 需唯一，节点高度按流量（max(入和, 出和)）比例映射。' },
    { name: 'links', type: 'KSankeyLink[]', def: '必填', desc: '链路列表：{ source, target, value, color? }。source / target 按节点 name 关联，链路厚度按 value 比例映射。' },
    { name: 'nodeWidth', type: 'number', def: '16', desc: '节点矩形宽度 px。' },
    { name: 'orient', type: "'horizontal' | 'vertical'", def: "'horizontal'", desc: "布局方向：horizontal 横向（层从左到右展开，缺省）/ vertical 纵向（层从上到下展开，适合高瘦容器）。" },
    { name: 'draggable', type: 'boolean', def: 'false', desc: '是否允许拖拽节点（拖拽后链路实时跟随，位置持久保留）。' },
    { name: 'nodeGap', type: 'number', def: '12', desc: '同层节点最小间距 px。' },
    { name: 'curvature', type: 'number', def: '0.5', desc: '链路弯曲度 0~1，0 为直线。' },
    { name: 'label', type: 'boolean', def: 'true', desc: '是否显示节点名称标签。' },
  ],
}

const CHORD: ApiSection = {
  title: '数据与专属配置',
  fields: [
    { name: 'nodes', type: 'KChordNode[]', def: '必填', desc: '节点列表：{ name, color? }，对应圆上弧段，弧长由关联链路流量自动汇总。' },
    { name: 'links', type: 'KChordLink[]', def: '必填', desc: '链路列表：{ source, target, value }，为节点间流量；自环与未知节点链路自动跳过。' },
    { name: 'padAngle', type: 'number', def: '3', desc: '节点弧之间的间隙角（度）。' },
    { name: 'label', type: 'boolean', def: 'true', desc: '是否显示节点名称标签。' },
  ],
}

const GRAPH: ApiSection = {
  title: '数据与专属配置',
  fields: [
    { name: 'nodes', type: 'KGraphNode[]', def: '必填', desc: '节点列表：{ name, value?, color?, category?, x?, y? }。半径按 √value 映射（缺省 10）；layout 为 none 时 x / y 生效。' },
    { name: 'links', type: 'KGraphLink[]', def: '必填', desc: '链路列表：{ source, target, value? }。source / target 支持节点 name 或下标；线宽按 value 比例映射；未知节点与自环自动跳过。' },
    { name: 'categories', type: 'KGraphCategory[]', def: '—', desc: '类目列表：{ name, color? }，节点按 category 下标取类目色分组配色。' },
    { name: 'layout', type: "'force' | 'circular' | 'none'", def: "'force'", desc: "布局方式：force 力导向（自动疏散）/ circular 环形（均匀围一圈）/ none 固定坐标（用节点 x / y）。" },
    { name: 'force', type: '{ linkDistance?, repulsion?, iterations? }', def: '自动推算', desc: '力导向参数：linkDistance 期望边长 px（缺省按画布面积/节点数推算，收敛到 55~150）、repulsion 节点间斥力（缺省 linkDistance²）、iterations 迭代次数（缺省 300，越大越稳定）。' },
    { name: 'nodeMin / nodeMax', type: 'number', def: '—', desc: '节点半径上下限（px），控制大小差异过大时的视觉平衡。' },
    { name: 'label', type: 'boolean', def: 'true', desc: '是否显示节点名称标签。' },
  ],
}

// ============ 分布与密度 ============

const SCATTER_SERIES: ApiSection = {
  title: '系列配置 KScatterSeries（series 数组项）',
  fields: [
    { name: 'name', type: 'string', def: '必填', desc: '系列名称：图例、tooltip 中展示。' },
    { name: 'data', type: 'KScatterDatum[]', def: '必填', desc: '数据点：[x, y] 二元组；第三位 size（点半径 px）可选，传了就是气泡图。' },
    { name: 'color', type: 'KColor', def: '按主题色板分配', desc: '系列颜色覆盖，支持纯色或渐变配置。' },
    { name: 'radius', type: 'number', def: '4', desc: '默认点半径 px（数据项第三位 size 优先于该值）。' },
  ],
}

const SCATTER_PROPS: ApiSection = {
  title: '组件 Props',
  fields: [
    { name: 'series', type: 'KScatterSeries[]', def: '必填', desc: '系列列表，见下方系列配置。' },
    { name: 'xAxis / yAxis', type: 'KAxisOption', def: '—', desc: 'x / y 均为数值轴，配置见下方轴配置分组。' },
    { name: 'legend', type: "boolean | { position?: 'top' | 'bottom' }", def: 'false', desc: '图例（点击切换系列显隐），位置规则见折线图。' },
    { name: 'valueFormatter', type: '(value, name?) => string', def: '—', desc: 'tooltip 数值格式化：入参为数值与行名（x / y / size / 系列名），如 (v, n) => n === "x" ? `${v}ms` : `${v}%`。' },
    { name: 'height', type: 'number', def: '不传填满父容器', desc: '图表高度 px。' },
  ],
}

const HEATMAP: ApiSection = {
  title: '数据与专属配置',
  fields: [
    { name: 'rows', type: 'string[]', def: '必填', desc: '行类目（第一行绘制在顶部）。' },
    { name: 'columns', type: 'string[]', def: '必填', desc: '列类目（自左向右）。' },
    { name: 'data', type: 'KHeatmapDatum[]', def: '必填', desc: '热力数据：[列索引, 行索引, 数值]。缺失的行列组合不绘制（稀疏留白）。' },
    { name: 'colorStops', type: 'string[]', def: '品牌蓝浅→深', desc: '渐变色标（≥2 个），按值域线性插值。例如 ["#E8F3FF", "#1D2129"]。' },
    { name: 'label', type: 'boolean', def: 'true', desc: '是否显示单元格数值标签（格子太小时自动跳过）。' },
    { name: 'cellGap', type: 'number', def: '2', desc: '单元格间距 px。' },
    { name: 'min / max', type: 'number', def: '数据最值', desc: '值域上下界覆盖。缺省取数据最小 / 最大值；固定值域可让色标中点对准特定值（如 0）。' },
  ],
}

const BOXPLOT: ApiSection = {
  title: '数据与专属配置',
  fields: [
    { name: 'labels', type: 'string[]', def: '必填', desc: 'x 轴类目标签，与各系列 data 一一对应。' },
    { name: 'series', type: 'KBoxplotSeries[]', def: '必填', desc: '系列列表：{ name, data, color? }。每个类目一个盒，多系列并排。' },
    { name: 'series[].data', type: 'KBoxplotDatum[]', def: '必填', desc: '五数概括：[下须 min, Q1, 中位数, Q3, 上须 max] 裸元组，或对象 { value: 五数, outliers?: 异常点数组, color? }。' },
    { name: 'boxWidth', type: 'number', def: '0.6', desc: '盒宽占槽位比例 0~1。' },
    { name: 'xAxis / yAxis', type: 'KAxisOption', def: '—', desc: '轴配置（name 展示轴名称），见下方轴配置分组。' },
    { name: 'legend', type: "boolean | { position?: 'top' | 'bottom' }", def: 'false', desc: '图例（点击切换系列显隐）。' },
  ],
}

const MAP: ApiSection = {
  title: '数据与专属配置',
  note: '地图 GeoJSON 由使用者提供（本库不内置行政区划数据），可从 DataV.GeoAtlas 等公开数据源获取。',
  fields: [
    { name: 'geoJson', type: 'GeoFeatureCollection', def: '必填', desc: 'GeoJSON 数据（FeatureCollection）。' },
    { name: 'data', type: 'KMapDatum[]', def: '[]', desc: '区域数值：{ name, value }。按 name 与 GeoJSON properties.name 匹配做色深映射（choropleth），无匹配区域用底色。' },
    { name: 'projection', type: "'linear' | 'mercator'", def: "'linear'", desc: "投影方式：linear 线性经纬度（缺省）/ mercator 等角圆柱（更接近视觉习惯）。" },
    { name: 'aspectScale', type: 'number', def: '0.75', desc: '经度相对纬度缩放系数（仅 linear 生效），0.75 为中国地图惯例值。' },
    { name: 'colorStops', type: 'string[]', def: '品牌紫渐变', desc: '色标梯度（低 → 高）。' },
    { name: 'regionColor', type: 'string', def: '内置底色', desc: '无数据区域底色。' },
    { name: 'label', type: 'boolean', def: 'false', desc: '是否显示区域名标签。' },
    { name: 'onRegionClick', type: '(index: number) => void', def: '—', desc: '区域点击回调（参数为 GeoJSON features 下标），配合地图下钻等交互。' },
  ],
}

// ============ 状态与进度 ============

const GAUGE: ApiSection = {
  title: '数据与专属配置',
  fields: [
    { name: 'data', type: 'KGaugeDatum', def: '必填', desc: '仪表数据（单值）：{ name?, value, min?, max?, unit? }。min / max 为量程（缺省 0~100），unit 为数值后缀（如 %、℃）。' },
    { name: 'stops', type: 'KGaugeStop[]', def: '主题主色渐变', desc: '阈值色标：[{ value: 0~1 进度位置, color }]，如 [{ value: 0.7, color: "#00B578" }, { value: 1, color: "#F53F3F" }] 表示 70% 以下绿、以上红。' },
    { name: 'startAngle / endAngle', type: 'number', def: '内置值', desc: '起始 / 结束角（数学角，度）。默认 210° → -30°（约 240° 表盘）。' },
    { name: 'radiusRatio', type: 'number', def: '内置值', desc: '半径占绘图区比例 0~1。' },
    { name: 'axisWidth', type: 'number', def: '内置值', desc: '轴带宽度 px。' },
    { name: 'tickCount', type: 'number', def: '内置值', desc: '刻度数量。' },
    { name: 'height', type: 'number', def: '不传填满父容器', desc: '图表高度 px。' },
  ],
}

const WORDCLOUD: ApiSection = {
  title: '数据与专属配置',
  fields: [
    { name: 'data', type: 'KWordcloudDatum[]', def: '必填', desc: '词频数据：{ name, value, color? }。字号按 √value 映射。' },
    { name: 'minFont / maxFont', type: 'number', def: '内置值', desc: '最小 / 最大字号 px，超出范围的值按极值截断。' },
    { name: 'rotateRatio', type: 'number', def: '内置值', desc: '旋转比例 0~1：该比例的词竖排，其余横排；0 则全部横排。' },
  ],
}

const CALENDAR: ApiSection = {
  title: '数据与专属配置',
  fields: [
    { name: 'data', type: 'KCalendarDatum[]', def: '必填', desc: '数据列表：{ date: "YYYY-MM-DD", value }。' },
    { name: 'cellSize', type: 'number', def: '自适应', desc: '单元格边长 px（过大时自动缩小适配容器）。' },
    { name: 'weekStart', type: '0 | 1', def: '0', desc: '一周起始：0 = 周日（缺省），1 = 周一。' },
    { name: 'gap', type: 'number', def: '内置值', desc: '格间距 px。' },
  ],
}

const BULLET: ApiSection = {
  title: '数据与专属配置',
  fields: [
    { name: 'data', type: 'KBulletDatum[]', def: '必填', desc: '子弹图数据（多行）：{ name, value, target?, ranges?, unit?, color? }。' },
    { name: 'data[].ranges', type: 'number[]', def: '1.25 倍单段', desc: '定性分段阈值（升序），如 [60, 85, 100] 画三段底色带（差 / 良 / 优）。' },
    { name: 'data[].target', type: 'number', def: '—', desc: '目标值：行内竖线标记，一眼对比实际 vs 目标。' },
    { name: 'rangeHeight / barHeight', type: 'number', def: '内置值', desc: '分段底色带高 / 实际值条高 px。' },
    { name: 'labelWidth', type: 'number', def: '自适应', desc: '左侧名称列宽 px。' },
  ],
}

const PROGRESS_BAR: ApiSection = {
  title: '数据与专属配置',
  fields: [
    { name: 'data', type: 'KProgressBarDatum[]', def: '必填', desc: '进度条数据（多行）：{ name, value, max?, unit?, color? }。' },
    { name: 'data[].color', type: 'KColor', def: '按色板循环', desc: '条颜色，支持纯色或 linear / radial 渐变（横向线性渐变沿条身过渡）；tooltip 色点同步以 CSS 渐变展示。' },
    { name: 'barHeight', type: 'number', def: '内置值', desc: '条高 px。' },
    { name: 'labelWidth', type: 'number', def: '自适应', desc: '左侧名称列宽 px。' },
    { name: 'showTrack', type: 'boolean', def: 'true', desc: '是否显示底轨道。' },
  ],
}

const PROGRESS_RING: ApiSection = {
  title: '数据与专属配置',
  fields: [
    { name: 'data', type: 'KProgressDatum', def: '必填', desc: '进度数据（单值）：{ name?, value, max?, unit? }。' },
    { name: 'color', type: 'KColor', def: '主题主色', desc: '进度弧颜色（纯色或渐变，渐变沿弧线包围盒方向过渡）。' },
    { name: 'bandGradient', type: '{ from: string; to: string }', def: '—', desc: '进度弧径向渐变（沿环带半径方向从内缘色 from 渐变到外缘色 to）：精确贴合环带不偏心，设置后优先于 color。' },
    { name: 'lineCap', type: "'butt' | 'round'", def: "'butt'", desc: '环带端点样式："round" 进度弧两端圆头（对齐 stroke-linecap），缺省平头。' },
    { name: 'clockwise', type: 'boolean', def: 'true', desc: '扫描方向：true 顺时针（缺省，从 12 点向右扫）；false 逆时针（从 12 点向左扫）。' },
    { name: 'trackWidth', type: 'number', def: '内置值', desc: '环带宽度 px。' },
    { name: 'radiusRatio', type: 'number', def: '内置值', desc: '半径比例 0~1。' },
    { name: 'showTrack', type: 'boolean', def: 'true', desc: '是否显示底环。' },
  ],
}

const MULTI_RING: ApiSection = {
  title: '数据与专属配置',
  fields: [
    { name: 'data', type: 'KProgressDatum[]', def: '必填', desc: '多环进度数据：{ name?, value, max?, unit? }。第 0 项为最外环。' },
    { name: 'ringGap', type: 'number', def: '内置值', desc: '环间间隙 px。' },
    { name: 'showSummary', type: 'boolean', def: 'true', desc: '是否在中心显示汇总百分比。' },
  ],
}

export const DOCS_B: ChartApiDoc[] = [
  {
    slug: 'sankey-chart',
    intro: '桑基图：流量 / 能量 / 成本从源到目标的分流汇聚，节点高度与链路厚度均按数值比例映射。',
    sections: [SANKEY, COMMON_FILL],
  },
  {
    slug: 'chord-chart',
    intro: '和弦图：环形弧段 + 内部弦线，展示节点间双向流量关系，弧长由关联链路自动汇总。',
    sections: [CHORD, COMMON_FILL],
  },
  {
    slug: 'graph-chart',
    intro: '关系图：力导向 / 环形 / 固定坐标三种布局的节点 — 链路网络，支持类目分组配色。',
    sections: [GRAPH, COMMON_FILL],
  },
  {
    slug: 'scatter-chart',
    intro: '散点图：双数值轴分布观察，第三位 size 可升级为气泡图，轴配置与折线 / 柱形完全一致。',
    sections: [SCATTER_PROPS, SCATTER_SERIES, SEC_AXIS, COMMON_FILL],
  },
  {
    slug: 'heatmap-chart',
    intro: '热力图：行列交叉的数值密度展示，渐变色标按值域线性插值，支持稀疏留白。',
    sections: [HEATMAP, COMMON_FILL],
  },
  {
    slug: 'boxplot-chart',
    intro: '盒须图（箱线图）：用五数概括（下须 / Q1 / 中位数 / Q3 / 上须）展示数据分布与离散度，支持异常点标注。',
    sections: [BOXPLOT, SEC_AXIS, COMMON_FILL],
  },
  {
    slug: 'map-chart',
    intro: '地图：基于 GeoJSON 的填色地图（choropleth），区域数值驱动色深，支持点击下钻。',
    sections: [MAP, COMMON_FILL],
  },
  {
    slug: 'gauge-chart',
    intro: '仪表盘：单值进度表盘，支持阈值色标与自定义角度范围。',
    sections: [GAUGE, COMMON_FILL],
  },
  {
    slug: 'wordcloud-chart',
    intro: '词云：词频驱动字号的热门关键词展示，支持横竖排混排与字号区间。',
    sections: [WORDCLOUD, COMMON_FILL],
  },
  {
    slug: 'calendar-chart',
    intro: '日历热力图：按日期格子展示热度（如 GitHub 提交热力图），支持周起始日切换。',
    sections: [CALENDAR, COMMON_FILL],
  },
  {
    slug: 'bullet-chart',
    intro: '子弹图：一行一个指标的「底色分段带 + 实际值条 + 目标线」，密集指标盘的经典方案。',
    sections: [BULLET, COMMON_FILL],
  },
  {
    slug: 'progress-bar-chart',
    intro: '线性进度条：多行指标进度一览，支持底轨道、自定义量程与渐变色条。',
    sections: [PROGRESS_BAR, COMMON_FILL],
  },
  {
    slug: 'progress-ring-chart',
    intro: '进度环：单值环形进度，中心显示数值与单位。',
    sections: [PROGRESS_RING, SEC_GRADIENT, COMMON_FILL],
  },
  {
    slug: 'multi-ring-chart',
    intro: '多环进度：多个指标同心环并列，中心可显示汇总百分比。',
    sections: [MULTI_RING, COMMON_FILL],
  },
]
