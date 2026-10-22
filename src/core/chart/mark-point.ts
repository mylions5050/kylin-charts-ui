import { group, path, text } from '../scene/nodes'
import type { GroupNode } from '../scene/nodes'
import type { KMarkPointDatum, KMarkPointGroup, SeriesDatum } from '../types'
import { normalizeData } from '../utils/series-data'

/** resolveMarkPoints 入参：折线 / 柱形等系列共有的最小结构 */
type MarkPointSeries = {
  data: SeriesDatum[]
  markPoint?: KMarkPointGroup | KMarkPointDatum[]
}

/** 解析后的标注点（数据空间：类目下标 + 数值，由各图表换算成像素） */
export interface ResolvedMarkPoint {
  idx: number
  v: number
  label: string
  color?: string
}

/** 数值文案：整数原样，小数最多两位 */
function round2(v: number): string {
  if (Number.isInteger(v)) return String(v)
  return String(Number(v.toFixed(2)))
}

/**
 * markPoint 解析：双形态（数组 / { data }）归一化。
 * type='max'/'min' 基于本系列全量非空值取极值（dataZoom 切片前调用，极值不随窗口变化）；
 * 固定点用 xAxis（类目标签或下标）+ value 描述；越界项跳过。
 */
export function resolveMarkPoints(series: MarkPointSeries, labels: string[]): ResolvedMarkPoint[] {
  const raw = Array.isArray(series.markPoint) ? series.markPoint : series.markPoint?.data
  if (!raw?.length) return []
  const values = normalizeData(series.data)
  const out: ResolvedMarkPoint[] = []
  for (const d of raw) {
    if (d.type === 'max' || d.type === 'min') {
      const vals = values.map((x) => x.value).filter((v): v is number => v !== null)
      if (vals.length === 0) continue
      const v = d.type === 'max' ? Math.max(...vals) : Math.min(...vals)
      const idx = values.findIndex((x) => x.value === v)
      if (idx < 0) continue
      out.push({ idx, v, label: d.label ?? round2(v), color: d.color })
      continue
    }
    if (d.value === undefined || !Number.isFinite(d.value)) continue
    let idx = typeof d.xAxis === 'number' ? d.xAxis : labels.indexOf(String(d.xAxis))
    if (idx < 0) {
      const num = Number(d.xAxis)
      if (Number.isInteger(num) && labels[num] !== undefined) idx = num
    }
    if (idx < 0 || idx >= labels.length) continue
    out.push({ idx, v: d.value, label: d.label ?? round2(d.value), color: d.color })
  }
  return out
}

/**
 * markPoint 标注点场景图（直角坐标系图表共用：折线 / 柱形）。
 * ECharts 同款「水滴 pin」造型：尖端指向数据点，圆头内嵌白色数值文案。
 */
export function buildMarkPointNodes(opts: {
  /** 各系列的标注点与颜色（顺序即系列顺序，供 key 稳定） */
  items: Array<{ points: ResolvedMarkPoint[]; color: string; scaleValue: (v: number) => number; catAt: (index: number) => number }>
  fontSize: number
  fontFamily: string
  /** 转置模式（横向柱图）：值轴在水平方向，pin 尖端指向右侧 */
  transpose?: boolean
}): GroupNode | null {
  const { items, fontSize, fontFamily } = opts
  const labelSize = Math.max(9, fontSize - 1)
  const nodes: GroupNode['children'] = []
  items.forEach((item, si) => {
    item.points.forEach((mp, pi) => {
      const px = Math.round(item.scaleValue(mp.v) * 100) / 100
      const pc = Math.round(item.catAt(mp.idx) * 100) / 100
      const x = opts.transpose ? px : pc
      const y = opts.transpose ? pc : px
      const c = mp.color ?? item.color
      nodes.push(
        path(opts.transpose ? pinPathRight(x, y, 11) : pinPath(x, y, 11), {
          key: `markpoint/${si}/${pi}`,
          fill: c,
        })
      )
      // 圆头中心：竖置在尖端上方，转置在尖端左侧
      nodes.push(
        text(opts.transpose ? x - 12.5 : x, opts.transpose ? y + labelSize / 2 - 1 : y - 12.5, mp.label, {
          key: `markpointlabel/${si}/${pi}`,
          anchor: 'middle',
          fontSize: labelSize,
          fill: '#FFFFFF',
          fontFamily,
        })
      )
    })
  })
  if (nodes.length === 0) return null
  return group({ key: 'markpoints', children: nodes })
}

/** 水滴 pin 路径：尖端位于 (x,y)，圆头半径 r（对齐 ECharts markPoint symbol='pin'） */
function pinPath(x: number, y: number, r: number): string {
  // 头部圆心：尖端向上偏移 1.4r；两侧肩点接入尖端形成水滴轮廓
  const cy = y - r * 1.4
  // 圆上与尖端连线相切的两个点（约 ±30°）
  const lx = x - r * 0.82
  const ly = cy + r * 0.57
  const rx = x + r * 0.82
  const ry = cy + r * 0.57
  return (
    `M${r2c(x)},${r2c(y)}` +
    `L${r2c(lx)},${r2c(ly)}` +
    `A${r},${r},0,1,1,${r2c(rx)},${r2c(ry)}Z`
  )
}

/** 转置 pin：尖端位于 (x,y) 指向右侧，圆头在左 */
function pinPathRight(x: number, y: number, r: number): string {
  const cx = x - r * 1.4
  const ty = y - r * 0.82
  const tx = cx + r * 0.57
  const by = y + r * 0.82
  const bx = cx + r * 0.57
  return (
    `M${r2c(x)},${r2c(y)}` +
    `L${r2c(tx)},${r2c(ty)}` +
    `A${r},${r},0,1,1,${r2c(bx)},${r2c(by)}Z`
  )
}

function r2c(v: number): number {
  return Math.round(v * 100) / 100
}
