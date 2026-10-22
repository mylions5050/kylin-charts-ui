/** 将数值限制在 [min, max] 区间内 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

/** 将数值限制在 [0, 1] 区间内（入场进度常用） */
export function clamp01(value: number): number {
  return clamp(value, 0, 1)
}

export interface TickResult {
  min: number
  max: number
  ticks: number[]
}

/**
 * 计算友好的线性刻度（经典 nice numbers 算法）
 * 保证 min <= 数据最小值、max >= 数据最大值，刻度步长为 1/2/5 × 10^n
 */
export function niceTicks(rawMin: number, rawMax: number, tickCount = 5): TickResult {
  if (!Number.isFinite(rawMin) || !Number.isFinite(rawMax)) {
    return { min: 0, max: 1, ticks: [0, 1] }
  }
  if (rawMin === rawMax) {
    rawMin -= 1
    rawMax += 1
  }

  const range = niceNum(rawMax - rawMin, false)
  const step = niceNum(range / Math.max(1, tickCount - 1), true)
  const min = Math.floor(rawMin / step) * step
  const max = Math.ceil(rawMax / step) * step

  const ticks: number[] = []
  // 步进循环存在浮点误差，用整数计数规避
  const count = Math.round((max - min) / step)
  for (let i = 0; i <= count; i++) {
    ticks.push(Number((min + step * i).toPrecision(12)))
  }
  return { min, max, ticks }
}

function niceNum(range: number, round: boolean): number {
  const exp = Math.floor(Math.log10(range))
  const frac = range / 10 ** exp
  let nice: number
  if (round) {
    nice = frac < 1.5 ? 1 : frac < 3 ? 2 : frac < 7 ? 5 : 10
  } else {
    nice = frac <= 1 ? 1 : frac <= 2 ? 2 : frac <= 5 ? 5 : 10
  }
  return nice * 10 ** exp
}
