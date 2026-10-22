/**
 * 场景图（Scene Graph）节点定义
 *
 * 图表逻辑只产出场景图，不直接操作 DOM。
 * SVGRenderer / 未来的 CanvasRenderer 都只是场景图的"翻译器"。
 *
 * 后续扩展 Canvas 时的三条纪律（在架构期就固化）：
 * 1. 动画走 rAF 数值驱动，禁止 CSS 动画
 * 2. 命中检测自己做几何计算，不依赖 DOM 事件
 * 3. 视觉表达全部走场景节点，图表代码禁止出现 document.createElement
 */

export type Paint = string

export interface NodeStyle {
  fill?: Paint
  stroke?: string
  strokeWidth?: number
  /** 整体不透明度 0 ~ 1 */
  opacity?: number
  /** 虚线间隔（画布单位） */
  dash?: number[]
  /** 线段端点样式（round 圆头常用于凹凸图粗线） */
  lineCap?: 'butt' | 'round' | 'square'
  /** 鼠标指针 */
  cursor?: string
}

export interface BaseNode extends NodeStyle {
  /** 同帧 diff 复用键（不传则按树路径自动生成） */
  key?: string
  /** 附带数据（如命中元信息），渲染器不消费 */
  meta?: Record<string, unknown>
}

export interface GroupNode extends BaseNode {
  type: 'group'
  x: number
  y: number
  children: SceneNode[]
}

export interface PathNode extends BaseNode {
  type: 'path'
  /** SVG path d 指令串（Canvas 后端负责解析执行） */
  d: string
}

export interface RectNode extends BaseNode {
  type: 'rect'
  x: number
  y: number
  width: number
  height: number
  /** 圆角半径 */
  radius?: number
}

export interface CircleNode extends BaseNode {
  type: 'circle'
  cx: number
  cy: number
  r: number
}

export interface TextNode extends BaseNode {
  type: 'text'
  x: number
  y: number
  text: string
  fontSize: number
  fontWeight?: number
  anchor?: 'start' | 'middle' | 'end'
  fontFamily?: string
  /** 旋转角度（度，顺时针，绕文本锚点自身旋转）；不传不旋转 */
  rotate?: number
}

export type SceneNode = GroupNode | PathNode | RectNode | CircleNode | TextNode

// ============ 工厂函数（简化图表代码书写） ============

export function group(props: Partial<Omit<GroupNode, 'type'>> & { children: SceneNode[] }): GroupNode {
  return { type: 'group', x: 0, y: 0, ...props }
}

export function path(d: string, props: Partial<Omit<PathNode, 'type' | 'd'>> = {}): PathNode {
  return { type: 'path', d, ...props }
}

export function rect(x: number, y: number, width: number, height: number, props: Partial<Omit<RectNode, 'type' | 'x' | 'y' | 'width' | 'height'>> = {}): RectNode {
  return { type: 'rect', x, y, width, height, ...props }
}

export function circle(cx: number, cy: number, r: number, props: Partial<Omit<CircleNode, 'type' | 'cx' | 'cy' | 'r'>> = {}): CircleNode {
  return { type: 'circle', cx, cy, r, ...props }
}

export function text(x: number, y: number, content: string, props: Partial<Omit<TextNode, 'type' | 'x' | 'y' | 'text'>> = {}): TextNode {
  return { type: 'text', x, y, text: content, fontSize: 12, anchor: 'start', ...props }
}
