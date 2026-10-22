import { computed, ref, watch } from 'vue'
import { darkTheme, defaultTheme } from '@/core/theme'
import type { KChartTheme } from '@/core/theme'

const THEME_KEY = 'kcharts-theme'

/** 全局亮暗状态（模块级单例，所有调用方共享同一份） */
const isDark = ref<boolean>(localStorage.getItem(THEME_KEY) === 'dark')

// 状态 → DOM / 持久化：切换 <html class="dark"> 驱动壳层暗色样式（模块加载时立即同步一次）
watch(
  isDark,
  (dark) => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light')
  },
  { immediate: true }
)

/**
 * 图表主题：亮 / 暗两套完整主题，组件 buildOption 透传给核心层。
 * 注意必须全量返回（而非亮色给 undefined）：核心层 setOption 的
 * deepMerge 会跳过 undefined 字段，undefined 无法清掉已合并的暗色值。
 */
const chartTheme = computed<Partial<KChartTheme>>(() => (isDark.value ? darkTheme : defaultTheme))

/** 亮暗主题切换：应用壳层与全部图表实例共用 */
export function useTheme() {
  const toggleTheme = (): void => {
    isDark.value = !isDark.value
  }
  return { isDark, chartTheme, toggleTheme }
}
