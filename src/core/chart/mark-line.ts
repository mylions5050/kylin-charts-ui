import { normalizeData } from '../utils/series-data'
import { group, path, text } from '../scene/nodes'
import type { GroupNode } from '../scene/nodes'
import type { KMarkLineDatum, KMarkLineGroup, SeriesDatum } from '../types'

/** markLine 默认色：亮色主题对齐 ECharts（#333 近黑），暗色主题用可读灰 */
const MARK_LINE_LIGHT = '#333'
const MARK_LINE_DARK = '#A9AEB8'

/** resolveMarkLines 入参：折线 / 柱形等系列共有的最小结构 */
type MarkLineSeries = {
  data: SeriesDatum[]
  markLine?: KMarkLineGroup | KMarkLineDatum[]
}

/** 解析后的标线（kind='y' 水平/垂直阈值线 v 为数值；kind='x' 类目标线 v 为类目下标） */
export interface ResolvedMarkLine {
  kind: 'y' | 'x'
  v: number
  label: string
  color?: string
}

/**
 * markLine 解析：双形态（数组 / { data }）归一化。
 * average 基于全量非空值求均值（在 dataZoom 切片前调用，均值不随缩放窗口变化）；
 * xAxis 支持类目标签匹配或下标；越界项跳过。
 */
export function resolveMarkLines(series: MarkLineSeries, labels: string[]): ResolvedMarkLine[] {
  const raw = Array.isArray(series.markLine) ? series.markLine : series.markLine?.data
  if (!raw?.length) return []
  const out: ResolvedMarkLine[] = []
  for (const d of raw) {
    if (d.type === 'average') {
      const vals = normalizeData(series.data)
        .map((x) => x.value)
        .filter((v): v is number => v !== null)
      if (vals.length === 0) continue
      const avg = vals.reduce((a, b) => a + b, 0) / vals.length
      out.push({ kind: 'y', v: avg, label: d.label ?? `平均值: ${round2(avg)}`, color: d.color })
      continue
    }
    if (d.yAxis !== undefined && Number.isFinite(d.yAxis)) {
      out.push({ kind: 'y', v: d.yAxis, label: d.label ?? round2(d.yAxis), color: d.color })
      continue
    }
    if (d.xAxis !== undefined) {
      let idx = typeof d.xAxis === 'number' ? d.xAxis : labels.indexOf(String(d.xAxis))
      if (idx < 0) {
        // 字符串形式的数字按类目下标兜底（如 xAxis: "3"）
        const num = Number(d.xAxis)
        if (Number.isInteger(num) && labels[num] !== undefined) idx = num
      }
      if (idx < 0 || idx >= labels.length) continue
      out.push({ kind: 'x', v: idx, label: d.label ?? labels[idx], color: d.color })
    }
  }
  return out
}

/**
 * markLine 标线场景图（直角坐标系图表共用：折线 / 柱形等）。
 * valueOnY=true 数值轴纵向（常规折线 / 纵向柱）：y 阈值线为水平线、类目标线为垂直线；
 * valueOnY=false 数值轴横向（横向条形图）：y 阈值线为垂直线、类目标线为水平线。
 * 虚线渲染，文案贴线端部。
 */
export function buildMarkLineNodes(opts: {
  /** 各系列的标线与颜色（顺序即系列顺序，供 key 稳定） */
  items: Array<{ markLines: ResolvedMarkLine[]; color: string; scaleValue: (v: number) => number }>
  /** 数值轴方向：true 纵向（值 → y 像素），false 横向（值 → x 像素） */
  valueOnY: boolean
  /** 类目下标 → 像素（valueOnY=true 时为 x 坐标，false 时为 y 坐标） */
  catAt: (index: number) => number
  plotX: number
  plotY: number
  plotW: number
  plotH: number
  fontSize: number
  fontFamily: string
  /** 当前是否暗色主题（决定默认标线色：亮 #333 / 暗 #A9AEB8） */
  dark?: boolean
}): GroupNode | null {
  const { items, valueOnY, catAt, plotX, plotY, plotW, plotH, fontSize, fontFamily } = opts
  const defaultColor = opts.dark ? MARK_LINE_DARK : MARK_LINE_LIGHT
  const plotR = plotX + plotW
  const plotB = plotY + plotH
  const nodes: GroupNode['children'] = []
  items.forEach((item, si) => {
    item.markLines.forEach((ml, mi) => {
      const mc = ml.color ?? defaultColor
      if (ml.kind === 'y') {
        const vp = Math.round(item.scaleValue(ml.v) * 100) / 100
        if (valueOnY) {
          // 水平阈值线 + 右端箭头（ECharts markLine symbol 同款）+ 右上文案
          const y = Math.min(Math.max(vp, plotY), plotB)
          nodes.push(
            path(`M${plotX},${y}L${plotR - 8},${y}`, {
              key: `markline/${si}/${mi}`,
              stroke: mc,
              strokeWidth: 1.5,
              dash: [6, 4],
            })
          )
          nodes.push(
            path(arrowRight(plotR, y), {
              key: `marklinearrow/${si}/${mi}`,
              fill: mc,
            })
          )
          nodes.push(
            text(plotR - 12, y - 6, ml.label, {
              key: `marklinelabel/${si}/${mi}`,
              anchor: 'end',
              fontSize,
              fill: mc,
              fontFamily,
            })
          )
        } else {
          // 垂直阈值线 + 底端箭头 + 顶端左侧文案
          const x = Math.min(Math.max(vp, plotX), plotR)
          nodes.push(
            path(`M${x},${plotY}L${x},${plotB - 8}`, {
              key: `markline/${si}/${mi}`,
              stroke: mc,
              strokeWidth: 1.5,
              dash: [6, 4],
            })
          )
          nodes.push(
            path(arrowDown(x, plotB), {
              key: `marklinearrow/${si}/${mi}`,
              fill: mc,
            })
          )
          nodes.push(
            text(x - 5, plotY + 14, ml.label, {
              key: `marklinelabel/${si}/${mi}`,
              anchor: 'end',
              fontSize,
              fill: mc,
              fontFamily,
            })
          )
        }
      } else {
        const cp = Math.round(catAt(ml.v) * 100) / 100
        if (valueOnY) {
          // 垂直类目标线 + 底端箭头 + 顶端右侧文案
          nodes.push(
            path(`M${cp},${plotY}L${cp},${plotB - 8}`, {
              key: `markline/${si}/${mi}`,
              stroke: mc,
              strokeWidth: 1.5,
              dash: [6, 4],
            })
          )
          nodes.push(
            path(arrowDown(cp, plotB), {
              key: `marklinearrow/${si}/${mi}`,
              fill: mc,
            })
          )
          nodes.push(
            text(cp + 5, plotY + 14, ml.label, {
              key: `marklinelabel/${si}/${mi}`,
              anchor: 'start',
              fontSize,
              fill: mc,
              fontFamily,
            })
          )
        } else {
          // 水平类目标线 + 右端箭头 + 左端上方文案
          nodes.push(
            path(`M${plotX},${cp}L${plotR - 8},${cp}`, {
              key: `markline/${si}/${mi}`,
              stroke: mc,
              strokeWidth: 1.5,
              dash: [6, 4],
            })
          )
          nodes.push(
            path(arrowRight(plotR, cp), {
              key: `marklinearrow/${si}/${mi}`,
              fill: mc,
            })
          )
          nodes.push(
            text(plotX + 6, cp - 6, ml.label, {
              key: `marklinelabel/${si}/${mi}`,
              anchor: 'start',
              fontSize,
              fill: mc,
              fontFamily,
            })
          )
        }
      }
    })
  })
  if (nodes.length === 0) return null
  return group({ key: 'marklines', children: nodes })
}

/** 端部箭头（向右，尖端位于 x,y）— ECharts markLine symbol 同款三角 */
function arrowRight(x: number, y: number): string {
  return `M${r2(x)},${r2(y)}L${r2(x - 8)},${r2(y - 4)}L${r2(x - 8)},${r2(y + 4)}Z`
}

/** 端部箭头（向下，尖端位于 x,y） */
function arrowDown(x: number, y: number): string {
  return `M${r2(x)},${r2(y)}L${r2(x - 4)},${r2(y - 8)}L${r2(x + 4)},${r2(y - 8)}Z`
}

/** 保留两位小数 */
function r2(v: number): number {
  return Math.round(v * 100) / 100
}

function round2(v: number): string {
  if (Number.isInteger(v)) return String(v)
  return String(Number(v.toFixed(2)))
}
