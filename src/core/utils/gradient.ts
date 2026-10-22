/**
 * 渐变色工具
 *
 * 职责：把 KGradient 配置转换为可复用的 SVG defs id，以及为需要纯色的
 * 场景（tooltip 色点、图例、hover 强调）从渐变中提取兜底纯色。
 */

import type { KColor, KGradient, KGradientStop } from '../types'

/** 轻量字符串 hash（djb2 变体），用于生成稳定且较短的渐变 id */
function hashString(input: string): string {
  let h = 5381
  for (let i = 0; i < input.length; i++) {
    h = ((h << 5) + h + input.charCodeAt(i)) | 0
  }
  return (h >>> 0).toString(36)
}

/** 渐变配置 → 稳定 id（相同配置在任意图表中产出同一个 id，跨实例可复用） */
export function gradientId(gradient: KGradient): string {
  return `kg-${hashString(JSON.stringify(gradient))}`
}

/**
 * 提取渐变的兜底纯色：取中间色标（视觉重心），单色标取首色。
 * 用于不支持渐变的场景：图例色点、tooltip 色点、hover 提亮等。
 */
export function solidifyColor(color: KColor | undefined, fallback = 'none'): string {
  if (color === undefined) return fallback
  if (typeof color === 'string') return color
  const stops = color.colorStops
  if (!stops || stops.length === 0) return fallback
  return stops[Math.floor((stops.length - 1) / 2)].color
}

/** 色标按 offset 升序整理（用户乱序传入也能正确渲染） */
export function sortedStops(stops: KGradientStop[]): KGradientStop[] {
  return [...stops].sort((a, b) => a.offset - b.offset)
}

/**
 * KColor → CSS background 值：纯色原样；渐变转 CSS 渐变。
 * 用于 DOM 层展示（图例色点 / tooltip 色点），与 SVG 渐变视觉一致。
 */
export function colorToCss(color: KColor | undefined, fallback = 'transparent'): string {
  if (color === undefined) return fallback
  if (typeof color === 'string') return color
  const stops = sortedStops(color.colorStops)
    .map((s) => `${s.color} ${Math.round(s.offset * 100)}%`)
    .join(', ')
  if (!stops) return fallback
  if (color.type === 'linear') {
    const dx = (color.x2 ?? 0) - (color.x ?? 0)
    const dy = (color.y2 ?? 1) - (color.y ?? 0)
    // CSS 角度以 0deg 指向上、顺时针为正；SVG y 轴向下需取负
    const deg = Math.round((Math.atan2(dx, -dy) * 180) / Math.PI)
    return `linear-gradient(${deg}deg, ${stops})`
  }
  const cx = Math.round((color.x ?? 0.5) * 100)
  const cy = Math.round((color.y ?? 0.5) * 100)
  return `radial-gradient(circle at ${cx}% ${cy}%, ${stops})`
}
