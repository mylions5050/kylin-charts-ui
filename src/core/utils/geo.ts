/**
 * 地理数据工具（GeoJSON 解析 / 投影 / 路径生成 / 点内判定）
 *
 * 设计取舍：
 * 1. 只依赖标准 GeoJSON（RFC 7946），数据来源由使用者决定（对齐 ECharts registerMap 理念），
 *    本库不内置任何行政区划数据
 * 2. 投影内置 linear（线性经纬度，中国地图行业惯例观感，默认 aspectScale 0.75）
 *    与 mercator（等角圆柱）两种；均为纯函数，无需第三方投影库
 * 3. 坐标只做平移缩放，Polygon 环的绕向交由 SVG 默认 nonzero 填充规则处理
 *    （RFC 7946 规定外环逆时针、内环顺时针，与 nonzero 天然兼容）
 */

// ============ GeoJSON 最小类型定义（按需子集，避免引入完整 @types/geojson） ============

export interface GeoPolygonGeometry {
  type: 'Polygon'
  /** rings[0] 为外环，其余为内环（洞） */
  coordinates: number[][][]
}

export interface GeoMultiPolygonGeometry {
  type: 'MultiPolygon'
  coordinates: number[][][][]
}

export type GeoGeometry = GeoPolygonGeometry | GeoMultiPolygonGeometry

export interface GeoFeature {
  type: 'Feature'
  geometry: GeoGeometry
  properties: {
    /** 区域名（与数据按 name 匹配） */
    name?: string
    [key: string]: unknown
  }
}

export interface GeoFeatureCollection {
  type: 'FeatureCollection'
  features: GeoFeature[]
}

// ============ 投影配置 ============

export type GeoProjectionType = 'linear' | 'mercator'

export interface GeoProjectionOption {
  /** 投影类型：linear 线性经纬度（缺省）/ mercator 等角圆柱 */
  projection?: GeoProjectionType
  /**
   * 经度相对纬度的缩放系数（对齐 ECharts geo.aspectScale）。
   * 仅 linear 投影生效，缺省 0.75（中国地图惯例值）；mercator 恒为 1
   */
  aspectScale?: number
  /** 目标绘图区宽度 */
  width: number
  /** 目标绘图区高度 */
  height: number
}

/** 投影后的像素坐标（相对绘图区左上角） */
export interface GeoProjectedPoint {
  x: number
  y: number
}

/** 投影函数：经纬度 → 像素坐标（已 fit 至绘图区并保持纵横比、居中） */
export type GeoProjectFn = (lon: number, lat: number) => GeoProjectedPoint

/** 墨卡托纵坐标（单位与经度弧长一致，无极值发散风险由数据域保证） */
function mercatorY(lat: number): number {
  const clamped = Math.max(-85, Math.min(85, lat))
  const s = Math.sin((clamped * Math.PI) / 180)
  return 0.5 * Math.log((1 + s) / (1 - s))
}

/**
 * 计算包围盒并创建投影函数。
 * 流程：经纬度 → 原始平面坐标 → 整体包围盒 → 等比缩放 fit 绘图区（留白居中）
 */
export function createGeoProjection(features: GeoFeature[], option: GeoProjectionOption): GeoProjectFn {
  const type = option.projection ?? 'linear'
  const aspect = type === 'mercator' ? 1 : (option.aspectScale ?? 0.75)

  // mercator 的 Y 用弧度制墨卡托公式，X 必须同为弧度，否则经纬度单位不一致会横向拉伸
  const rawX = (lon: number): number =>
    type === 'mercator' ? (lon * Math.PI) / 180 : lon * aspect
  const rawY = (lat: number): number => (type === 'mercator' ? -mercatorY(lat) : -lat)

  // ---- 包围盒（遍历全部坐标一次） ----
  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity
  forEachCoordinate(features, (lon, lat) => {
    const x = rawX(lon)
    const y = rawY(lat)
    if (x < minX) minX = x
    if (x > maxX) maxX = x
    if (y < minY) minY = y
    if (y > maxY) maxY = y
  })

  const bboxW = maxX - minX
  const bboxH = maxY - minY
  const scale =
    bboxW > 0 && bboxH > 0 ? Math.min(option.width / bboxW, option.height / bboxH) : 1
  // 等比 fit 后两个方向的留白均分（居中）
  const offsetX = (option.width - bboxW * scale) / 2
  const offsetY = (option.height - bboxH * scale) / 2

  return (lon, lat) => ({
    x: (rawX(lon) - minX) * scale + offsetX,
    y: (rawY(lat) - minY) * scale + offsetY,
  })
}

// ============ 坐标遍历 ============

/** 深度遍历 FeatureCollection 的全部 [lon, lat] 坐标 */
export function forEachCoordinate(features: GeoFeature[], fn: (lon: number, lat: number) => void): void {
  for (const f of features) {
    const g = f.geometry
    if (!g) continue
    if (g.type === 'Polygon') {
      for (const ring of g.coordinates) for (const c of ring) fn(c[0], c[1])
    } else if (g.type === 'MultiPolygon') {
      for (const poly of g.coordinates) for (const ring of poly) for (const c of ring) fn(c[0], c[1])
    }
  }
}

// ============ 路径生成 ============

function r2(v: number): number {
  return Math.round(v * 100) / 100
}

/** 单环 → 「M x,y L ... Z」子路径 */
function ringToPath(ring: number[][], project: GeoProjectFn): string {
  if (ring.length === 0) return ''
  let d = ''
  for (let i = 0; i < ring.length; i++) {
    const p = project(ring[i][0], ring[i][1])
    d += (i === 0 ? 'M' : 'L') + r2(p.x) + ' ' + r2(p.y)
  }
  return d + 'Z'
}

/** 单个 Feature 几何 → 完整 path d（Polygon 单环 / MultiPolygon 多环拼接，外环 + 洞同串，nonzero 填充） */
export function geometryToPath(geometry: GeoGeometry, project: GeoProjectFn): string {
  if (geometry.type === 'Polygon') {
    return geometry.coordinates.map((ring) => ringToPath(ring, project)).join('')
  }
  return geometry.coordinates
    .map((poly) => poly.map((ring) => ringToPath(ring, project)).join(''))
    .join('')
}

// ============ 命中判定 ============

/** 射线法：点是否在单环内（外环 / 内环洞通用） */
export function pointInRing(x: number, y: number, ring: number[][], project: GeoProjectFn): boolean {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = project(ring[i][0], ring[i][1])
    const b = project(ring[j][0], ring[j][1])
    const intersect =
      a.y > y !== b.y > y && x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x
    if (intersect) inside = !inside
  }
  return inside
}

/** 点是否在 Feature 内：落在任一多边形的外环内且不在其洞内 */
export function pointInFeature(x: number, y: number, feature: GeoFeature, project: GeoProjectFn): boolean {
  const g = feature.geometry
  if (!g) return false
  const polys = g.type === 'Polygon' ? [g.coordinates] : g.coordinates
  for (const poly of polys) {
    if (poly.length === 0) continue
    if (!pointInRing(x, y, poly[0], project)) continue
    let inHole = false
    for (let i = 1; i < poly.length; i++) {
      if (pointInRing(x, y, poly[i], project)) {
        inHole = true
        break
      }
    }
    if (!inHole) return true
  }
  return false
}

// ============ 中心点 ============

/**
 * Feature 的锚点（标签 / 悬停引导点用）：
 * 取面积最大的多边形（飞地场景取主体）的包围盒中心
 */
export function featureCenter(feature: GeoFeature, project: GeoProjectFn): GeoProjectedPoint {
  const g = feature.geometry
  if (!g) return { x: 0, y: 0 }
  const polys = g.type === 'Polygon' ? [g.coordinates] : g.coordinates
  let bestArea = -1
  let bestBBox: [number, number, number, number] = [0, 0, 0, 0]
  for (const poly of polys) {
    if (poly.length === 0) continue
    let minX = Infinity
    let maxX = -Infinity
    let minY = Infinity
    let maxY = -Infinity
    for (const c of poly[0]) {
      const p = project(c[0], c[1])
      if (p.x < minX) minX = p.x
      if (p.x > maxX) maxX = p.x
      if (p.y < minY) minY = p.y
      if (p.y > maxY) maxY = p.y
    }
    const area = (maxX - minX) * (maxY - minY)
    if (area > bestArea) {
      bestArea = area
      bestBBox = [minX, minY, maxX, maxY]
    }
  }
  return { x: (bestBBox[0] + bestBBox[2]) / 2, y: (bestBBox[1] + bestBBox[3]) / 2 }
}
