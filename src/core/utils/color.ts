/**
 * 颜色工具
 * 当前仅处理 hex 颜色的透明度转换，其他格式（rgb()/命名色）原样返回。
 * 后续 Canvas 引擎可直接复用。
 */

function clamp01(v: number): number {
  return Math.min(1, Math.max(0, v))
}

/** 将 #RGB / #RRGGBB 颜色转为带透明度的 rgba 字符串 */
export function withAlpha(color: string, alpha: number): string {
  const a = clamp01(alpha)
  let hex = color.trim().replace('#', '')
  if (hex.length === 3) {
    hex = hex
      .split('')
      .map((c) => c + c)
      .join('')
  }
  if (!/^[0-9a-fA-F]{6}$/.test(hex)) {
    // 非六位 hex，无法安全处理，原样返回
    return color
  }
  const r = parseInt(hex.slice(0, 2), 16)
  const g = parseInt(hex.slice(2, 4), 16)
  const b = parseInt(hex.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${a})`
}

/** 判断颜色明暗（亮度 < 0.55 视为深色，用于深浅主题下挑选可读的默认色） */
export function isDarkColor(color: string): boolean {
  let hex = color.trim().replace('#', '')
  if (hex.length === 3) {
    hex = hex
      .split('')
      .map((c) => c + c)
      .join('')
  }
  if (!/^[0-9a-fA-F]{6}$/.test(hex)) return false
  const r = parseInt(hex.slice(0, 2), 16)
  const g = parseInt(hex.slice(2, 4), 16)
  const b = parseInt(hex.slice(4, 6), 16)
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.55
}

/** 将颜色向白色混合 amount（0~1）实现提亮，用于悬停强调；非六位 hex 原样返回 */
export function lighten(color: string, amount: number): string {
  const t = clamp01(amount)
  if (t <= 0) return color
  let hex = color.trim().replace('#', '')
  if (hex.length === 3) {
    hex = hex
      .split('')
      .map((c) => c + c)
      .join('')
  }
  if (!/^[0-9a-fA-F]{6}$/.test(hex)) return color
  const r = parseInt(hex.slice(0, 2), 16)
  const g = parseInt(hex.slice(2, 4), 16)
  const b = parseInt(hex.slice(4, 6), 16)
  const mix = (c: number): number => Math.round(c + (255 - c) * t)
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`
}
