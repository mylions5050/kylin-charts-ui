import { BaseChart } from './base-chart'
import { clamp } from '../utils/math'
import { withAlpha } from '../utils/color'
import { defaultTheme } from '../theme'
import type { KChartTheme } from '../theme'
import { sampleHeatColor } from './heatmap-chart'
import { group, path, text } from '../scene/nodes'
import type { GroupNode } from '../scene/nodes'
import {
  createGeoProjection,
  featureCenter,
  geometryToPath,
  pointInFeature,
} from '../utils/geo'
import type {
  GeoFeature,
  GeoFeatureCollection,
  GeoProjectionType,
} from '../utils/geo'
import type { HoverInfo, Padding, RenderContext } from '../types'

/** 地图数据项：区域名与数值（name 与 GeoJSON properties.name 匹配） */
export interface KMapDatum {
  /** 区域名（如「广东省」） */
  name: string
  /** 数值（choropleth 色深映射，负值同样支持） */
  value: number
}

/** 地图图配置 */
export interface MapChartOption {
  /** GeoJSON 数据（FeatureCollection），由使用者提供，本库不内置 */
  geoJson: GeoFeatureCollection
  /** 区域数值列表（按 name 匹配 GeoJSON，无匹配的区域用底色） */
  data?: KMapDatum[]
  /** 投影：linear 线性经纬度（缺省）/ mercator 等角圆柱 */
  projection?: GeoProjectionType
  /** 经度相对纬度缩放系数（仅 linear 生效），缺省 0.75（中国地图惯例值） */
  aspectScale?: number
  /** choropleth 色标梯度（低 → 高），缺省品牌紫渐变 */
  colorStops?: string[]
  /** 无数据区域底色，缺省跟随主题网格色 */
  regionColor?: string
  /** 区域边界色，缺省主题文字色半透明 */
  borderColor?: string
  /** 区域边界宽 px，缺省 1 */
  borderWidth?: number
  /** 区域名标签 */
  label?: { show?: boolean }
  theme?: Partial<KChartTheme>
  padding?: Partial<Padding>
  emptyText?: string
}

const DEFAULT_PADDING: Padding = { top: 16, right: 16, bottom: 16, left: 16 }

/** 内部区域模型（绘制与命中检测共用；path 已投影缓存，入场动画零重算） */
interface MapRegion {
  /** GeoJSON features 下标（悬停索引与其同源） */
  index: number
  name: string
  value: number | null
  d: string
  centerX: number
  centerY: number
}

/**
 * 地图图（Map / Choropleth）
 * GeoJSON → 投影 → SVG path，区域数值映射色深（分区统计图）。
 * 悬停索引 = features 下标；入场按区域错峰浮现。
 */
export class MapChart extends BaseChart<MapChartOption> {
  private model: MapRegion[] | null = null
  private cacheSig = ''

  protected build(option: MapChartOption, ctx: RenderContext): GroupNode {
    const theme: KChartTheme = { ...defaultTheme, ...option.theme }
    const pad: Padding = { ...DEFAULT_PADDING, ...option.padding }
    const plotW = Math.max(0, ctx.width - pad.left - pad.right)
    const plotH = Math.max(0, ctx.height - pad.top - pad.bottom)
    const model = this.getModel(option, plotW, plotH, pad)
    if (model.length === 0) {
      return group({
        key: 'empty',
        children: [
          text(ctx.width / 2, ctx.height / 2, option.emptyText ?? '暂无数据', {
            anchor: 'middle',
            fontSize: 14,
            fill: theme.emptyColor,
            fontFamily: theme.fontFamily,
          }),
        ],
      })
    }

    const border = option.borderColor ?? withAlpha(theme.textColor, 0.45)
    const borderWidth = option.borderWidth ?? 1
    const baseFill = option.regionColor ?? theme.gridColor
    const hover = ctx.hoverIndex
    const showLabel = option.label?.show ?? false

    // ---- 区域 path（按区域错峰浮现）----
    // path d 为绘图区系坐标，整体平移 padding 对齐画布；
    // 命中检测（hitTest）对指针坐标做同样的反向扣除，两套坐标系严格对齐
    const regionNodes: GroupNode['children'] = []
    const n = model.length
    model.forEach((region) => {
      const local = clamp(ctx.progress * (n + 4) - region.index * 0.6, 0, 1)
      if (local <= 0) return
      const hovered = hover === region.index
      regionNodes.push(
        path(region.d, {
          key: `region/${region.index}`,
          fill: region.value === null ? baseFill : regionFill(option, region.value),
          stroke: hovered ? theme.colors[0] : border,
          strokeWidth: hovered ? 1.6 : borderWidth,
          cursor: 'pointer',
          opacity: 0.2 + 0.8 * local,
        })
      )
    })

    // ---- 区域名标签（画布系坐标，与平移后的区域 path 对齐）----
    const labelNodes: GroupNode['children'] = []
    if (showLabel) {
      model.forEach((region) => {
        if (!region.name) return
        labelNodes.push(
          text(region.centerX, region.centerY + 4, region.name, {
            key: `label/${region.index}`,
            anchor: 'middle',
            fontSize: Math.max(9, theme.fontSize - 2),
            fill: theme.textColor,
            fontFamily: theme.fontFamily,
            opacity: ctx.progress,
          })
        )
      })
    }

    return group({
      key: 'plot',
      children: [
        group({ key: 'map', x: pad.left, y: pad.top, children: regionNodes }),
        group({ key: 'labels', children: labelNodes }),
      ],
    })
  }

  /** 命中检测：射线法逐区域判定（省级规模性能无虞） */
  protected hitTest(x: number, y: number): number | null {
    const model = this.model
    if (!model || model.length === 0) return null
    const features = this.modelFeatures
    if (!features) return null
    const project = this.modelProject
    if (!project) return null
    for (const region of model) {
      // 指针坐标为画布系，投影为绘图区系，先扣去 padding 再判定
      if (pointInFeature(x - this.modelPad.left, y - this.modelPad.top, features[region.index], project)) {
        return region.index
      }
    }
    return null
  }

  protected getHoverInfo(index: number): HoverInfo {
    const region = this.model?.find((r) => r.index === index)
    if (!region) return { index, x: 0, y: 0 }
    return { index, x: Math.round(region.centerX * 100) / 100, y: Math.round(region.centerY * 100) / 100 }
  }

  // ============ 投影与路径缓存 ============

  private modelFeatures: GeoFeature[] | null = null
  private modelProject: ReturnType<typeof createGeoProjection> | null = null
  private modelPad: Padding = DEFAULT_PADDING

  private getModel(option: MapChartOption, plotW: number, plotH: number, pad: Padding): MapRegion[] {
    const features = option.geoJson?.features ?? []
    const sig = JSON.stringify([
      features.map((f) => f.properties?.name),
      option.data,
      option.projection,
      option.aspectScale,
      plotW,
      plotH,
    ])
    if (this.model && sig === this.cacheSig) return this.model
    this.cacheSig = sig

    if (features.length === 0 || plotW <= 0 || plotH <= 0) {
      this.model = []
      this.modelFeatures = null
      this.modelProject = null
      return this.model
    }

    const project = createGeoProjection(features, {
      projection: option.projection,
      aspectScale: option.aspectScale,
      width: plotW,
      height: plotH,
    })

    // 数据按区域名建立映射（重名时后者优先）
    const valueMap = new Map<string, number>()
    for (const d of option.data ?? []) valueMap.set(d.name, d.value)

    const regions: MapRegion[] = features.map((f, index) => {
      const name = f.properties?.name ?? ''
      const center = featureCenter(f, project)
      return {
        index,
        name,
        value: valueMap.has(name) ? (valueMap.get(name) as number) : null,
        d: f.geometry ? geometryToPath(f.geometry, project) : '',
        centerX: center.x + pad.left,
        centerY: center.y + pad.top,
      }
    })

    this.model = regions
    this.modelFeatures = features
    this.modelProject = project
    this.modelPad = pad
    return this.model
  }
}

// ============ 纯函数工具 ============

/** 值域归一化后的 choropleth 填充色（复用热力图取色器） */
function regionFill(option: MapChartOption, value: number): string {
  const stops = option.colorStops ?? ['#EBEDF5', '#B9A5FF', '#7C5CFC', '#4B2FD6']
  const data = option.data ?? []
  let min = Infinity
  let max = -Infinity
  for (const d of data) {
    min = Math.min(min, d.value)
    max = Math.max(max, d.value)
  }
  const t = max > min ? clamp((value - min) / (max - min), 0, 1) : 0.5
  return sampleHeatColor(stops, t)
}
