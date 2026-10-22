import { group, path, text } from '../scene/nodes'
import type { GroupNode } from '../scene/nodes'

/** 解析后的标域（像素空间矩形，由各图表负责解析与钳制） */
export interface ResolvedMarkArea {
  x1: number
  x2: number
  y1: number
  y2: number
  color?: string
  label?: string
}

/** markArea 默认色：半透明主题蓝（亮色）/ 半透明灰蓝（暗色由调用方覆盖） */
const MARK_AREA_LIGHT = 'rgba(84,112,198,0.14)'
const MARK_AREA_DARK = 'rgba(120,140,200,0.18)'

/**
 * markArea 标域场景图（直角坐标系图表共用：折线 / 柱形）。
 * 半透明矩形画在系列之下（调用方决定层级），文案置于区域左上角内侧。
 * 传入前请将矩形钳制在绘图区内（x1<=x2, y1<=y2）。
 */
export function buildMarkAreaNodes(opts: {
  areas: ResolvedMarkArea[]
  fontSize: number
  fontFamily: string
  dark?: boolean
}): GroupNode | null {
  const { areas, fontSize, fontFamily } = opts
  const defaultColor = opts.dark ? MARK_AREA_DARK : MARK_AREA_LIGHT
  const labelColor = opts.dark ? '#D8DCE6' : '#333'
  const nodes: GroupNode['children'] = []
  areas.forEach((a, i) => {
    const x = Math.round(Math.min(a.x1, a.x2) * 100) / 100
    const y = Math.round(Math.min(a.y1, a.y2) * 100) / 100
    const w = Math.round(Math.abs(a.x2 - a.x1) * 100) / 100
    const h = Math.round(Math.abs(a.y2 - a.y1) * 100) / 100
    if (w <= 0 || h <= 0) return
    nodes.push(
      path(`M${x},${y}h${w}v${h}h${-w}Z`, {
        key: `markarea/${i}`,
        fill: a.color ?? defaultColor,
      })
    )
    if (a.label) {
      nodes.push(
        text(x + 6, y + fontSize + 4, a.label, {
          key: `markarealabel/${i}`,
          anchor: 'start',
          fontSize,
          fill: labelColor,
          fontFamily,
        })
      )
    }
  })
  if (nodes.length === 0) return null
  return group({ key: 'markareas', children: nodes })
}
