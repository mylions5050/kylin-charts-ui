import { SVGRenderer } from '../renderer/svg-renderer'
import { animate } from '../animation'
import { deepMerge } from '../utils/merge'
import { gradientId, solidifyColor } from '../utils/gradient'
import type { GroupNode } from '../scene/nodes'
import type { ChartEvents, HoverInfo, KColor, RenderContext } from '../types'

/**
 * 图表基类：编排「选项 → 场景图 → 渲染器 → 交互」的标准流水线
 *
 * 子类只需实现三个纯逻辑方法：
 * - build：选项 + 渲染上下文 → 场景图
 * - hitTest：像素坐标 → 数据索引（几何计算，两个渲染后端共用）
 * - getHoverInfo：数据索引 → 悬停引导点信息
 *
 * 未来接入 Canvas 引擎时，仅需把 SVGRenderer 换成 CanvasRenderer，
 * 子类图表代码零改动。
 */

export abstract class BaseChart<O extends object> {
  protected renderer: SVGRenderer
  protected width = 0
  protected height = 0
  protected hoverIndex: number | null = null
  /** 入场动画进度（动画结束后恒为 1） */
  protected progress = 1
  protected events: ChartEvents = {}

  protected option: O
  private cancelAnim: (() => void) | null = null
  /** pointerdown 落点（点击判定用：抬起时位移小于阈值才算点击） */
  private downPoint: { x: number; y: number } | null = null

  constructor(container: HTMLElement, option: O) {
    this.renderer = new SVGRenderer(container)
    this.option = option

    this.renderer.on('pointermove', this.handlePointerMove)
    this.renderer.on('pointerleave', this.handlePointerLeave)
    this.renderer.on('pointerdown', this.handlePointerDown)
    this.renderer.on('pointerup', this.handlePointerUp)
  }

  /** 注册事件（在 constructor 之后、组件挂载阶段调用） */
  setEvents(events: ChartEvents): void {
    this.events = events
  }

  /** 更新图表配置（默认与当前配置深度合并，notMerge 为 true 时整体替换；触发入场动画） */
  setOption(option: Partial<O>, notMerge = false): void {
    this.option = notMerge ? (option as O) : deepMerge(this.option, option)
    this.playEntrance()
  }

  /** 读回当前完整配置（只读视角） */
  getOption(): Readonly<O> {
    return this.option
  }

  /** 容器尺寸变化时调用（不重播入场动画） */
  resize(width: number, height: number): void {
    this.width = width
    this.height = height
    this.renderer.setSize(width, height)
    this.render()
  }

  destroy(): void {
    this.cancelAnim?.()
    this.renderer.destroy()
  }

  // ============ 内部流水线 ============

  private playEntrance(): void {
    this.cancelAnim?.()
    this.progress = 0
    this.cancelAnim = animate({
      duration: 700,
      onUpdate: (p) => {
        this.progress = p
        this.render()
      },
      onComplete: () => {
        this.progress = 1
        this.render()
      },
    })
  }

  protected render(): void {
    if (this.width <= 0 || this.height <= 0) return
    // 每帧重新收集：build 过程中 resolvePaint 注册本帧实际用到的渐变
    this.frameGradients.clear()
    const ctx: RenderContext = {
      width: this.width,
      height: this.height,
      hoverIndex: this.hoverIndex,
      progress: this.progress,
    }
    const root = this.build(this.option, ctx)
    if (this.frameGradients.size > 0) {
      this.renderer.setDefs(Array.from(this.frameGradients.values()))
    } else {
      this.renderer.setDefs([])
    }
    this.renderer.render(root)
  }

  /** 本帧实际用到的渐变（id → 配置），由 resolvePaint 填充 */
  private frameGradients = new Map<string, import('../types').KGradient>()

  /**
   * 着色解析：纯色原样返回；渐变配置注册进 defs 并返回 url(#id) 引用。
   * 所有需要支持渐变的着色字段统一走本方法。
   */
  protected resolvePaint(color: KColor | undefined, fallback?: string): string {
    if (color === undefined) return fallback ?? 'none'
    if (typeof color === 'string') return color
    const id = gradientId(color)
    this.frameGradients.set(id, color)
    return `url(#${id})`
  }

  /** 提取系列颜色的纯色形态（渐变取中间色标），供图例 / tooltip / hover 提亮等场景 */
  protected solidColor(color: KColor | undefined, fallback?: string): string {
    return solidifyColor(color, fallback)
  }

  private handlePointerMove = (e: PointerEvent): void => {
    const rect = this.renderer.svg.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const index = this.hitTest(x, y)
    if (index !== this.hoverIndex) {
      this.hoverIndex = index
      this.render()
    }
    this.events.onHover?.(index === null ? null : this.getHoverInfo(index))
  }

  private handlePointerLeave = (): void => {
    if (this.hoverIndex !== null) {
      this.hoverIndex = null
      this.render()
    }
    this.events.onHover?.(null)
  }

  private handlePointerDown = (e: PointerEvent): void => {
    const rect = this.renderer.svg.getBoundingClientRect()
    this.downPoint = { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  private handlePointerUp = (e: PointerEvent): void => {
    if (!this.downPoint) return
    const rect = this.renderer.svg.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    // 按下/抬起位移超过阈值视为拖拽或滑动，不触发点击
    const moved = Math.abs(x - this.downPoint.x) + Math.abs(y - this.downPoint.y)
    this.downPoint = null
    if (moved > 6) return
    const index = this.hitTest(x, y)
    if (index !== null) this.events.onClick?.(index, this.getHoverInfo(index))
  }

  // ============ 子类必须实现 ============

  protected abstract build(option: O, ctx: RenderContext): GroupNode

  /** 命中检测：像素坐标 → 数据索引，未命中返回 null（纯几何计算） */
  protected abstract hitTest(x: number, y: number): number | null

  /** 数据索引 → 悬停引导点（tooltip 定位用） */
  protected abstract getHoverInfo(index: number): HoverInfo
}
