import type { App } from 'vue'

/**
 * 组件安装器工厂：为每个图表组件挂上 app.use 所需的 install 方法。
 *
 * - 按需引入：`import { KLineChart } from 'kcharts'` 直接用，无需 install
 * - 全量引入：`app.use(KCharts)` 一次性注册全部图表组件
 */
export type WithInstall<T> = T & { install: (app: App) => void }

export function withInstall<T extends { name: string }>(comp: T): WithInstall<T> {
  const wrapper = comp as WithInstall<T>
  wrapper.install = (app: App): void => {
    app.component(comp.name, comp as unknown as import('vue').Component)
  }
  return wrapper
}
