import type { CircleNode, GroupNode, PathNode, RectNode, SceneNode, TextNode } from '../scene/nodes'
import type { KGradient } from '../types'
import { gradientId, sortedStops } from '../utils/gradient'

/**
 * SVG 渲染引擎
 *
 * 职责：把场景图翻译为 SVG DOM。
 * - 按 key 做 diff 复用元素，动画帧（rAF 高频 render）不会重复创建 DOM
 * - 只挂最外层容器事件，命中检测交给图表层几何计算（为 Canvas 引擎共用）
 */

type PointerHandler = (e: PointerEvent) => void
type ChartHandler = (e: Event) => void

const SVG_NS = 'http://www.w3.org/2000/svg'

export class SVGRenderer {
  /** 根 <svg> 元素 */
  readonly svg: SVGSVGElement

  /** key → 已创建元素，用于跨帧 diff 复用 */
  private keyMap = new Map<string, SVGElement>()
  private pointerHandlers = new Map<string, Set<ChartHandler>>()
  /** 渐变 defs 容器（首帧懒创建，避免无渐变图表多出空节点） */
  private defsEl: SVGDefsElement | null = null

  constructor(private container: HTMLElement) {
    this.svg = document.createElementNS(SVG_NS, 'svg')
    this.svg.style.display = 'block'
    this.svg.style.width = '100%'
    this.svg.style.height = '100%'
    container.appendChild(this.svg)

    this.svg.addEventListener('pointermove', this.dispatchEvent)
    this.svg.addEventListener('pointerleave', this.dispatchEvent)
    this.svg.addEventListener('pointerdown', this.dispatchEvent)
    this.svg.addEventListener('pointerup', this.dispatchEvent)
    // 滚轮缩放（dataZoom inside）：passive false 才能在图表区阻止页面滚动
    this.svg.addEventListener('wheel', this.dispatchEvent, { passive: false })
    // 滑条拖拽需要阻止默认选中行为
    this.svg.style.touchAction = 'none'
  }

  setSize(width: number, height: number): void {
    this.svg.setAttribute('viewBox', `0 0 ${width} ${height}`)
  }

  /**
   * 同步渐变 defs：按 id diff 渐变元素，内容不变时零 DOM 操作。
   * 渐变坐标为 objectBoundingBox 相对值（与 ECharts 0~1 配置一致），随元素包围盒自适应。
   */
  setDefs(gradientList: KGradient[]): void {
    if (gradientList.length === 0) {
      if (this.defsEl) {
        this.defsEl.remove()
        this.defsEl = null
      }
      return
    }
    if (!this.defsEl) {
      this.defsEl = document.createElementNS(SVG_NS, 'defs') as SVGDefsElement
      this.svg.insertBefore(this.defsEl, this.svg.firstChild)
    }
    const usedIds = new Set<string>()
    for (const grad of gradientList) {
      const id = gradientId(grad)
      usedIds.add(id)
      const existing = this.defsEl.querySelector(`#${id}`)
      // 内容签名比对：相同配置跳过重建（render 高频调用，保持无 DOM churn）
      const sig = JSON.stringify(grad)
      if (existing) {
        if (existing.getAttribute('data-sig') === sig) continue
        existing.remove()
      }
      const el =
        grad.type === 'linear'
          ? document.createElementNS(SVG_NS, 'linearGradient')
          : document.createElementNS(SVG_NS, 'radialGradient')
      el.setAttribute('id', id)
      el.setAttribute('data-sig', sig)
      if (grad.type === 'linear') {
        el.setAttribute('x1', String(grad.x ?? 0))
        el.setAttribute('y1', String(grad.y ?? 0))
        el.setAttribute('x2', String(grad.x2 ?? 0))
        el.setAttribute('y2', String(grad.y2 ?? 1))
      } else {
        // user 模式：x/y/r 为画布绝对像素坐标（进度环沿半径方向渐变等场景）
        if (grad.units === 'user') el.setAttribute('gradientUnits', 'userSpaceOnUse')
        el.setAttribute('cx', String(grad.x ?? (grad.units === 'user' ? 0 : 0.5)))
        el.setAttribute('cy', String(grad.y ?? (grad.units === 'user' ? 0 : 0.5)))
        el.setAttribute('r', String(grad.r ?? (grad.units === 'user' ? 0 : 0.5)))
      }
      for (const stop of sortedStops(grad.colorStops)) {
        const stopEl = document.createElementNS(SVG_NS, 'stop')
        stopEl.setAttribute('offset', String(stop.offset))
        stopEl.setAttribute('stop-color', stop.color)
        el.appendChild(stopEl)
      }
      this.defsEl.appendChild(el)
    }
    // 清理不再使用的渐变
    for (const el of Array.from(this.defsEl.children)) {
      if (!usedIds.has(el.id)) el.remove()
    }
  }

  /** 渲染一帧场景图（高频调用安全，内部按 key diff） */
  render(root: GroupNode): void {
    const usedKeys = new Set<string>()
    this.renderGroup(root, this.svg, 'root', usedKeys)
    // 清理本帧不再存在的元素
    for (const [key, el] of this.keyMap) {
      if (!usedKeys.has(key)) {
        el.remove()
        this.keyMap.delete(key)
      }
    }
  }

  private renderGroup(node: GroupNode, parentEl: Element, key: string, used: Set<string>): SVGElement {
    const el = this.ensureElement(key, 'g', parentEl, used)
    el.setAttribute('transform', node.x || node.y ? `translate(${node.x}, ${node.y})` : '')
    this.applyStyle(el, node, true)
    let index = 0
    let domPos = 0
    for (const child of node.children) {
      // 优先用节点语义 key 复用：位置下标 key 在前序节点增减时会整体错位，
      // 导致类型不匹配重建后 appendChild 到末尾、层叠顺序永久错乱（如点被后画的线盖住）
      const childKey = `${key}/${child.key ?? `${child.type}/${index++}`}`
      const childEl = this.renderNode(child, el, childKey, used)
      // 层叠校正：DOM 顺序必须与场景图 spec 顺序一致（appendChild 会移动已有节点）
      if (childEl && el.children[domPos] !== childEl) {
        el.insertBefore(childEl, el.children[domPos] ?? null)
      }
      domPos++
    }
    return el
  }

  private renderNode(node: SceneNode, parentEl: Element, key: string, used: Set<string>): SVGElement {
    switch (node.type) {
      case 'group':
        return this.renderGroup(node, parentEl, key, used)
      case 'path': {
        const el = this.ensureElement(key, 'path', parentEl, used) as SVGPathElement
        el.setAttribute('d', node.d)
        this.applyStyle(el, node, true)
        return el
      }
      case 'rect': {
        const el = this.ensureElement(key, 'rect', parentEl, used) as SVGRectElement
        const r = node as RectNode
        el.setAttribute('x', String(r.x))
        el.setAttribute('y', String(r.y))
        el.setAttribute('width', String(r.width))
        el.setAttribute('height', String(r.height))
        if (r.radius) el.setAttribute('rx', String(r.radius))
        this.applyStyle(el, node, true)
        return el
      }
      case 'circle': {
        const el = this.ensureElement(key, 'circle', parentEl, used) as SVGCircleElement
        const c = node as CircleNode
        el.setAttribute('cx', String(c.cx))
        el.setAttribute('cy', String(c.cy))
        el.setAttribute('r', String(c.r))
        this.applyStyle(el, node, true)
        return el
      }
      case 'text': {
        const el = this.ensureElement(key, 'text', parentEl, used) as SVGTextElement
        const t = node as TextNode
        el.setAttribute('x', String(t.x))
        el.setAttribute('y', String(t.y))
        el.setAttribute('font-size', String(t.fontSize))
        if (t.fontWeight) el.setAttribute('font-weight', String(t.fontWeight))
        el.setAttribute('text-anchor', t.anchor ?? 'start')
        el.setAttribute('font-family', t.fontFamily ?? '')
        if (t.rotate != null) {
          el.setAttribute('transform', `rotate(${t.rotate} ${t.x} ${t.y})`)
        } else {
          el.removeAttribute('transform')
        }
        el.textContent = t.text
        this.applyStyle(el, node, false)
        return el
      }
    }
  }

  /** 取同 key 元素复用；类型不匹配或不存在时重建 */
  private ensureElement(key: string, tag: string, parentEl: Element, used: Set<string>): SVGElement {
    const existing = this.keyMap.get(key)
    if (existing && existing.tagName.toLowerCase() === tag) {
      used.add(key)
      return existing
    }
    if (existing) {
      existing.remove()
      this.keyMap.delete(key)
    }
    const el = document.createElementNS(SVG_NS, tag)
    parentEl.appendChild(el)
    this.keyMap.set(key, el)
    used.add(key)
    return el
  }

  private applyStyle(el: SVGElement, node: SceneNode, isShape: boolean): void {
    // 形状节点默认无填充；文本默认当前色
    el.setAttribute('fill', node.fill ?? (isShape ? 'none' : 'currentColor'))
    el.setAttribute('stroke', node.stroke ?? 'none')
    el.setAttribute('stroke-width', String(node.strokeWidth ?? 0))
    el.setAttribute('opacity', String(node.opacity ?? 1))
    if (node.dash?.length) {
      el.setAttribute('stroke-dasharray', node.dash.join(' '))
    } else {
      el.removeAttribute('stroke-dasharray')
    }
    if (node.lineCap) {
      el.setAttribute('stroke-linecap', node.lineCap)
      el.setAttribute('stroke-linejoin', node.lineCap)
    } else {
      el.removeAttribute('stroke-linecap')
      el.removeAttribute('stroke-linejoin')
    }
    if (node.cursor) el.style.cursor = node.cursor
  }

  // ============ 事件（仅容器级，命中由图表层几何计算） ============

  on(
    type: 'pointermove' | 'pointerleave' | 'pointerdown' | 'pointerup',
    handler: PointerHandler
  ): void
  on(type: 'wheel', handler: (e: WheelEvent) => void): void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- 实现签名需同时兼容 PointerEvent / WheelEvent 两类 handler
  on(type: string, handler: (e: any) => void): void {
    let set = this.pointerHandlers.get(type)
    if (!set) {
      set = new Set()
      this.pointerHandlers.set(type, set)
    }
    set.add(handler)
  }

  private dispatchEvent = (e: Event): void => {
    const set = this.pointerHandlers.get(e.type)
    if (!set) return
    for (const handler of set) {
      handler(e)
    }
  }

  destroy(): void {
    this.svg.removeEventListener('pointermove', this.dispatchEvent)
    this.svg.removeEventListener('pointerleave', this.dispatchEvent)
    this.svg.removeEventListener('pointerdown', this.dispatchEvent)
    this.svg.removeEventListener('pointerup', this.dispatchEvent)
    this.svg.removeEventListener('wheel', this.dispatchEvent)
    this.svg.remove()
    this.keyMap.clear()
    this.pointerHandlers.clear()
    this.defsEl = null
  }
}
