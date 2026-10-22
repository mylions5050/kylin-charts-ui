/**
 * createBem - BEM 命名工具
 *
 * 生成符合 BEM 规范的类名构造器，统一组件类名风格：
 *   块：        k-chart
 *   元素：      k-chart__tooltip
 *   块修饰符：  k-chart--hidden
 *   元素修饰符：k-chart__tooltip--visible
 *
 * @example
 *   const bem = createBem('k-chart')
 *   bem()                        // 'k-chart'
 *   bem({ hidden: true })        // 'k-chart k-chart--hidden'
 *   bem.e('tooltip')             // 'k-chart__tooltip'
 *   bem.m('hidden')              // 'k-chart--hidden'
 *   bem.em('tooltip', 'light')   // 'k-chart__tooltip--light'
 */

/** 修饰符集合：键为修饰符名，值为是否启用 */
export type Mods = Record<string, boolean | undefined>

export interface Bem {
  /** 块类名，可附带修饰符集合 */
  (mods?: Mods): string
  /** 元素类名：name__el */
  e(el: string): string
  /** 块修饰符：name--mod */
  m(mod: string): string
  /** 元素修饰符：name__el--mod */
  em(el: string, mod: string): string
}

export function createBem(name: string): Bem {
  const join = (...parts: string[]): string => parts.filter(Boolean).join('')

  const resolveMods = (mods?: Mods): string[] =>
    mods
      ? Object.entries(mods)
          .filter(([, enabled]) => enabled)
          .map(([mod]) => join(name, '--', mod))
      : []

  const bem = ((mods?: Mods): string =>
    [name, ...resolveMods(mods)].join(' ')) as Bem

  bem.e = (el: string): string => join(name, '__', el)
  bem.m = (mod: string): string => join(name, '--', mod)
  bem.em = (el: string, mod: string): string => join(name, '__', el, '--', mod)

  return bem
}
