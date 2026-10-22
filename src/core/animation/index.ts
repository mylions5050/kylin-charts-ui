import { clamp } from '../utils/math'

/**
 * 动画引擎
 *
 * 统一 rAF 数值驱动（0 → 1 进度），两个渲染后端通用。
 * 图表层禁止使用 CSS 动画，入场/更新动画全部走这里。
 */

export type EasingFn = (t: number) => number

export const linear: EasingFn = (t) => t

export const easeOutCubic: EasingFn = (t) => 1 - Math.pow(1 - t, 3)

export const easeOutQuart: EasingFn = (t) => 1 - Math.pow(1 - t, 4)

export interface AnimateOptions {
  /** 动画时长 ms，默认 600 */
  duration?: number
  easing?: EasingFn
  onUpdate: (progress: number) => void
  onComplete?: () => void
}

/** 启动动画，返回取消函数 */
export function animate(options: AnimateOptions): () => void {
  const { duration = 600, easing = easeOutCubic, onUpdate, onComplete } = options
  let raf = 0
  let cancelled = false
  const start = performance.now()

  const tick = (now: number): void => {
    if (cancelled) return
    const p = duration <= 0 ? 1 : clamp((now - start) / duration, 0, 1)
    onUpdate(easing(p))
    if (p < 1) {
      raf = requestAnimationFrame(tick)
    } else {
      onComplete?.()
    }
  }
  raf = requestAnimationFrame(tick)

  return () => {
    cancelled = true
    cancelAnimationFrame(raf)
  }
}
