import { onBeforeUnmount, watch } from 'vue'
import type { Ref } from 'vue'

/**
 * 监听元素尺寸变化（图表自适应的基础设施）
 * 挂载 / 卸载 / 目标切换自动管理 ResizeObserver 生命周期
 */
export function useResizeObserver(
  target: Ref<HTMLElement | null>,
  callback: (width: number, height: number) => void
): void {
  let observer: ResizeObserver | null = null

  watch(
    target,
    (el) => {
      observer?.disconnect()
      observer = null
      if (el) {
        observer = new ResizeObserver((entries) => {
          const entry = entries[0]
          if (!entry) return
          const box = entry.contentRect
          callback(box.width, box.height)
        })
        observer.observe(el)
      }
    },
    { immediate: true, flush: 'post' }
  )

  onBeforeUnmount(() => {
    observer?.disconnect()
    observer = null
  })
}
