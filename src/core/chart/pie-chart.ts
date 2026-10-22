import { BaseChart } from './base-chart'
import { defaultTheme, getSeriesColor } from '../theme'
import type { KChartTheme } from '../theme'
import { group, path, text } from '../scene/nodes'
import type { GroupNode } from '../scene/nodes'
import { lighten } from '../utils/color'
import type { HoverInfo, KColor, KPieDatum, Padding, Point, RenderContext } from '../types'

/** 饼图配置（注册于 OptionMap['pie']，环形 / 玫瑰均为其形态变体） */
export interface PieChartOption {
  /** 数据项列表（占比按可见数据合计计算） */
  data: KPieDatum[]
  /** 内半径比例（相对外半径 0~0.85），> 0 即环形图；默认 0（实心） */
  innerRadius?: number
  /** 玫瑰模式：radius=半径线性映射数值 / area=面积映射数值；缺省为普通饼图（等角） */
  roseType?: 'radius' | 'area'
  /** 起始角度（度，0 = 12 点方向，顺时针增加）；默认 0 */
  startAngle?: number
  /** 总扫描角（度，0 < x ≤ 360）：360 为完整圆，180 为半环（如 startAngle 270 + sweepAngle 180 = 平底半拱） */
  sweepAngle?: number
  /** 是否显示外部标签与引导线；默认 true */
  label?: { show?: boolean }
  /** 标签布局：default 跟随扇区角度（默认）/ aligned 左右分侧定 x 对齐 + 同侧纵向分布防重叠 */
  labelLayout?: 'default' | 'aligned'
  /** 环形中心主标题（innerRadius > 0 时渲染） */
  centerTitle?: string
  /** 环形中心副标题 */
  centerSubtitle?: string
  /** 主题覆盖 */
  theme?: Partial<KChartTheme>
  /** 选中模式（仅实心饼图支持拆开；环形图与玫瑰图忽略）：single 点击仅保留一个选中扇区 / multiple 逐个切换 */
  selectedMode?: 'single' | 'multiple'
  /** 选中扇区沿中角外移距离（px），默认 10 */
  selectedOffset?: number
  /** 是否显示扇区白色描边；默认 true，传 false 即无边框渲染 */
  itemBorder?: boolean
  /** 扇区圆角半径（px，默认 0 不倒角）；自动约束在径向厚度与角跨度内 */
  itemRadius?: number
  /** 相邻扇区间距（度，默认 0）：每个扇区起止两端各收起一半角度 */
  itemGap?: number
  /** 画布内边距覆盖 */
  padding?: Partial<Padding>
  /** 空数据提示文案 */
  emptyText?: string
}

/** 扇区内部模型（绘制与命中检测共用） */
interface PieSlice {
  name: string
  value: number
  percent: number
  /** 扇区色：纯色或渐变配置（渐变扇区 hover 不做提亮，保持渐变） */
  color: KColor
  /** 起止角（弧度，自 12 点方向顺时针） */
  startT: number
  endT: number
  midT: number
  outerR: number
}

interface Layout {
  cx: number
  cy: number
  innerR: number
  slices: PieSlice[]
  theme: KChartTheme
}

const DEFAULT_PADDING: Padding = { top: 24, right: 24, bottom: 24, left: 24 }

/** 悬停强调：扇区自饼心原位放大的比例（对齐 ECharts emphasis.scale 1.1，仅放大外圈半径） */
const HOVER_SCALE = 0.08
/** 悬停强调：扇区颜色向白色混合的提亮幅度 */
const HOVER_BRIGHTEN = 0.12
/** 悬停时其他扇区的半透明化强度（opacity 降至 0.4） */
const HOVER_DIM = 0.6

/**
 * 饼图（含环形 / 玫瑰形态）
 * 支持：外部标签 + 引导线、环形中心文本、radius/area 玫瑰、
 * 顺时针扫描入场动画、悬停扇区外圈放大提亮 + 其他扇区半透明（逐扇区动画过渡、切换平滑）、
 * 实心饼图点击选中拆开（single/multiple，selectedOffset 持久外移）、点级颜色。
 */
export class PieChart extends BaseChart<PieChartOption> {
  private layout: Layout | null = null
  /** 悬停强调动画值（按下标）：0（无强调）~ 1（完全强调），逐扇区独立缓动 */
  private hoverEases = new Map<number, number>()
  private hoverRaf: number | null = null
  /** 选中（拆开）扇区名集合；下标会随图例显隐漂移，按名记录更稳健 */
  private selectedNames = new Set<string>()
  /** 各扇区拆开动画值 0~1（按名） */
  private selEase = new Map<string, number>()
  private selAnimRaf: number | null = null
  /** 最近一次 build 解析出的选中模式（点击处理用） */
  private resolvedSelectedMode: 'single' | 'multiple' | null = null

  constructor(container: HTMLElement, option: PieChartOption) {
    super(container, option)
    this.renderer.on('pointerdown', this.handleSelectPointerDown)
  }

  override destroy(): void {
    if (this.hoverRaf !== null) cancelAnimationFrame(this.hoverRaf)
    if (this.selAnimRaf !== null) cancelAnimationFrame(this.selAnimRaf)
    super.destroy()
  }

  /** 点击扇区切换选中态：single 点击其他扇区自动换选，再点已选扇区取消（与基类点击判定独立） */
  private handleSelectPointerDown = (e: PointerEvent): void => {
    const mode = this.resolvedSelectedMode
    if (!mode) return
    const rect = this.renderer.svg.getBoundingClientRect()
    const idx = this.hitTest(e.clientX - rect.left, e.clientY - rect.top)
    if (idx === null) return
    const name = this.layout?.slices[idx]?.name
    if (name === undefined) return
    if (mode === 'single') {
      const wasSolo = this.selectedNames.size === 1 && this.selectedNames.has(name)
      this.selectedNames.clear()
      if (!wasSolo) this.selectedNames.add(name)
    } else if (this.selectedNames.has(name)) {
      this.selectedNames.delete(name)
    } else {
      this.selectedNames.add(name)
    }
    this.startSelAnim()
    this.render()
  }

  /** 悬停强调缓动：各扇区动画值逐帧向目标（悬停 1 / 非悬停 0）逼近，切换扇区时旧扇区平滑退出 */
  private tickHoverAnim = (): void => {
    let active = false
    this.hoverEases.forEach((v, k) => {
      const target = k === this.hoverIndex ? 1 : 0
      if (Math.abs(target - v) > 0.005) {
        const nv = v + (target - v) * 0.22
        this.hoverEases.set(k, Math.abs(target - nv) < 0.005 ? target : nv)
        active = true
      } else if (v !== target) {
        this.hoverEases.set(k, target)
      }
    })
    if (active) {
      this.hoverRaf = requestAnimationFrame(this.tickHoverAnim)
    } else {
      this.hoverRaf = null
    }
    this.render()
  }

  /** 在 build 内调用：为新悬停扇区补动画值、清理已收敛项，并按需启动缓动 */
  private updateHoverAnim(hoverIndex: number | null): Map<number, number> {
    if (hoverIndex !== null && !this.hoverEases.has(hoverIndex)) this.hoverEases.set(hoverIndex, 0)
    this.hoverEases.forEach((v, k) => {
      if (k !== hoverIndex && v <= 0.005) this.hoverEases.delete(k)
    })
    let need = false
    this.hoverEases.forEach((v, k) => {
      if (Math.abs((k === hoverIndex ? 1 : 0) - v) > 0.005) need = true
    })
    if (need && this.hoverRaf === null) {
      this.hoverRaf = requestAnimationFrame(this.tickHoverAnim)
    }
    return this.hoverEases
  }

  /** 选中拆开动画：所有扇区动画值逐帧向目标（选中 1 / 未选 0）逼近 */
  private tickSelAnim = (): void => {
    let active = false
    this.selEase.forEach((v, k) => {
      const target = this.selectedNames.has(k) ? 1 : 0
      if (Math.abs(target - v) > 0.005) {
        const nv = v + (target - v) * 0.22
        this.selEase.set(k, Math.abs(target - nv) < 0.005 ? target : nv)
        active = true
      } else if (v !== target) {
        this.selEase.set(k, target)
      }
    })
    if (active) {
      this.selAnimRaf = requestAnimationFrame(this.tickSelAnim)
    } else {
      this.selAnimRaf = null
    }
    this.render()
  }

  private startSelAnim(): void {
    this.selectedNames.forEach((name) => {
      if (!this.selEase.has(name)) this.selEase.set(name, 0)
    })
    if (this.selAnimRaf === null) {
      this.selAnimRaf = requestAnimationFrame(this.tickSelAnim)
    }
  }

  protected build(option: PieChartOption, ctx: RenderContext): GroupNode {
    const theme: KChartTheme = { ...defaultTheme, ...option.theme }
    const pad: Padding = { ...DEFAULT_PADDING, ...option.padding }
    const plotW = Math.max(0, ctx.width - pad.left - pad.right)
    const plotH = Math.max(0, ctx.height - pad.top - pad.bottom)
    const cx = pad.left + plotW / 2
    const cy = pad.top + plotH / 2

    // ============ 空数据兜底（合计为 0 同样视为空） ============
    const total = option.data.reduce((sum, d) => sum + d.value, 0)
    if (option.data.length === 0 || total <= 0) {
      this.layout = null
      return group({
        key: 'empty',
        children: [
          text(cx, cy, option.emptyText ?? '暂无数据', {
            key: 'empty-text',
            anchor: 'middle',
            fontSize: 14,
            fill: theme.emptyColor,
            fontFamily: theme.fontFamily,
          }),
        ],
      })
    }

    // ============ 几何布局 ============
    const showLabel = option.label?.show ?? true
    const labelSpace = showLabel ? 96 : 20
    const outerR = Math.max(24, Math.min(plotW / 2 - labelSpace, plotH / 2 - 28))
    const innerR = clampPx((option.innerRadius ?? 0) * outerR, 0, outerR * 0.85)
    const startT0 = deg2rad(option.startAngle ?? 0)
    // 总扫描角：默认整圆 360°，传入 180 等值即半环形图（扇区占比在扫描角内等比分配）
    const sweepRad = clampPx(deg2rad(option.sweepAngle ?? 360), deg2rad(1), Math.PI * 2)
    const roseType = option.roseType
    const maxV = Math.max(...option.data.map((d) => d.value))

    // 玫瑰模式等角均分，普通饼图按数值占比分角；
    // itemGap：每个扇区起止两端各收起一半间距角（视觉中心 midT 不变，命中检测同步生效）
    const gapHalf = Math.max(0, deg2rad(option.itemGap ?? 0) / 2)
    const slices: PieSlice[] = []
    let cursorT = startT0
    option.data.forEach((d, i) => {
      const span = roseType ? sweepRad / option.data.length : (d.value / total) * sweepRad
      const ratio = roseType ? (roseType === 'area' ? Math.sqrt(d.value / maxV) : d.value / maxV) : 1
      const sliceOuterR = roseType ? innerR + (outerR - innerR) * ratio : outerR
      const shrink = Math.max(0, Math.min(gapHalf, span / 2 - 0.0025))
      slices.push({
        name: d.name,
        value: d.value,
        percent: (d.value / total) * 100,
        color: d.color ?? getSeriesColor(theme.colors, i),
        startT: cursorT + shrink,
        endT: cursorT + span - shrink,
        midT: cursorT + span / 2,
        outerR: sliceOuterR,
      })
      cursorT += span
    })

    this.layout = { cx, cy, innerR, slices, theme }

    // 选中模式仅实心饼图生效（环形 / 玫瑰不拆开）；按名记录，图例显隐导致下标漂移也不乱
    this.resolvedSelectedMode = !option.roseType && innerR <= 0.5 ? (option.selectedMode ?? null) : null
    Array.from(this.selEase.keys()).forEach((name) => {
      if (!slices.some((s) => s.name === name)) this.selEase.delete(name)
    })

    const children: GroupNode['children'] = []

    // ============ 扇区（自 startAngle 顺时针扫描入场；悬停原位放大 + 其余半透明；选中拆开外移） ============
    const sweepLimit = startT0 + sweepRad * ctx.progress
    const sliceNodes: GroupNode['children'] = []
    const selOffset = option.selectedOffset ?? 10
    const hoverEases = this.updateHoverAnim(ctx.hoverIndex)
    const showBorder = option.itemBorder ?? true
    const cornerR = Math.max(0, option.itemRadius ?? 0)

    slices.forEach((s, i) => {
      if (s.startT >= sweepLimit) return
      const drawEnd = Math.min(s.endT, sweepLimit)
      // 悬停强调：仅外圈半径放大（内圈不动，环形图孔径保持稳定），颜色随缓动提亮
      const ease = hoverEases.get(i) ?? 0
      const scale = 1 + HOVER_SCALE * ease
      // 选中拆开：沿中角平移（动画值驱动，与悬停强调可叠加）
      const off = selOffset * (this.selEase.get(s.name) ?? 0)
      const ocx = cx + off * Math.sin(s.midT)
      const ocy = cy - off * Math.cos(s.midT)
      // 其他扇区随悬停交叉淡化：取除自身外最大缓动值，扇区间切换时平滑过渡
      let dim = 0
      hoverEases.forEach((v, k) => {
        if (k !== i && v > dim) dim = v
      })
      const opacity = 1 - HOVER_DIM * dim

      sliceNodes.push(
        path(slicePath(ocx, ocy, innerR, s.outerR * scale, s.startT, drawEnd, cornerR), {
          key: `slice/${i}`,
          fill:
            ease > 0.01 && typeof s.color === 'string'
              ? lighten(s.color, HOVER_BRIGHTEN * ease)
              : this.resolvePaint(s.color),
          stroke: showBorder ? '#FFFFFF' : undefined,
          strokeWidth: showBorder ? 1 : undefined,
          opacity,
          cursor: this.resolvedSelectedMode ? 'pointer' : undefined,
        })
      )
    })
    children.push(group({ key: 'slices', children: sliceNodes }))

    // ============ 外部标签 + 引导线（入场扫描完成后出现） ============
    const labelNodes: GroupNode['children'] = []
    if (showLabel && ctx.progress >= 1) {
      const aligned = option.labelLayout === 'aligned'
      const step = theme.fontSize + 6
      interface LabelItem {
        i: number
        s: PieSlice
        ocx: number
        ocy: number
        naturalY: number
        labelY: number
        /** 环形布局时的环绕角（null = 未启用环形布局） */
        theta: number | null
        /** 环形布局 2D 退让后的最终 y（null = 未退让） */
        pushY: number | null
        /** 环形布局下仍与他标签冲突、自动隐藏 */
        hide: boolean
      }
      const right: LabelItem[] = []
      const left: LabelItem[] = []
      slices.forEach((s, i) => {
        // 标签与引导线跟随选中拆开位移（悬停原位放大不移动标签）
        const off = selOffset * (this.selEase.get(s.name) ?? 0)
        const ocx = cx + off * Math.sin(s.midT)
        const ocy = cy - off * Math.cos(s.midT)
        const pB = polar(ocx, ocy, s.outerR + 14, s.midT)
        const item: LabelItem = { i, s: s, ocx: ocx, ocy: ocy, naturalY: pB.y, labelY: pB.y, theta: null, pushY: null, hide: false }
        ;(Math.sin(s.midT) >= 0 ? right : left).push(item)
      })
      if (aligned || slices.length >= 12) {
        // aligned：同侧文本 x 固定（两侧分别左/右对齐），同侧按 y 纵向分布防重叠；
        // 数据量大到同侧纵向放不下时，该侧自动退化为环形布局（标签围绕饼环扇形展开，引导线放射直达）
        const distribute = (items: LabelItem[]): boolean => {
          if (items.length === 0) return false
          items.sort((a, b) => a.naturalY - b.naturalY)
          const maxY = cy + plotH / 2 + 8
          const minY = cy - plotH / 2 - 8
          // 行距：最小 step；纵向有富余时适度拉开（最多 1.6 倍），让标签均分不拥挤
          const avail = maxY - Math.max(minY, items[0].naturalY)
          const s = Math.max(
            step,
            Math.min(step * 1.6, items.length > 1 ? avail / (items.length - 1) : step)
          )
          // 均分后达不到舒适行距（1.3 倍）→ 纵向太挤，交给环形布局围绕展开
          if (items.length > 1 && avail / (items.length - 1) < step * 1.3) return true
          // 向下顺推保证最小行距
          let prev = -Infinity
          items.forEach((it) => {
            it.labelY = Math.max(it.naturalY, prev + s)
            prev = it.labelY
          })
          // 底部越界则先封住底边，再自底向上回收，并夹住上边界
          if (items[items.length - 1].labelY > maxY) {
            items[items.length - 1].labelY = maxY
            for (let k = items.length - 2; k >= 0; k--) {
              items[k].labelY = Math.min(items[k].labelY, items[k + 1].labelY - s)
            }
            items.forEach((it) => {
              it.labelY = Math.max(it.labelY, minY)
            })
          }
          // 夹边后行距仍不足 → 纵向容量不够，需要环形布局接管
          for (let k = 1; k < items.length; k++) {
            if (items[k].labelY - items[k - 1].labelY < step - 0.5) return true
          }
          return false
        }
        // 环形布局：同侧标签按角度排序后在本侧开区间内围绕饼环均匀展开（最小角间隔
        // 由行距与环绕半径反推，放不下则均分压缩），引导线呈放射状，标签互不重叠
        const layoutCircular = (items: LabelItem[]): void => {
          const R = outerR + 30
          const margin = 0.08
          const norm = (t: number): number => {
            let a = t % (Math.PI * 2)
            if (a > Math.PI) a -= Math.PI * 2
            if (a < -Math.PI) a += Math.PI * 2
            return a
          }
          items.sort((a, b) => norm(a.s.midT) - norm(b.s.midT))
          const thetas = items.map((it) => norm(it.s.midT))
          // 环绕角限制在本侧开区间内（不跨 0/±π 边界，跨过会导致锚点翻转、
          // 与另一侧标签相撞）；放不下理想角间隔时在可用区间内均分压缩
          const side = thetas[0] + thetas[thetas.length - 1] >= 0 ? 1 : -1
          const lo = side === 1 ? margin : -Math.PI + margin
          const hi = side === 1 ? Math.PI - margin : -margin
          const stepA = Math.min((step + 2) / R, (hi - lo) / Math.max(1, thetas.length - 1))
          const start0 = Math.max(lo, Math.min(thetas[0], hi - stepA * (thetas.length - 1)))
          for (let k = 1; k < thetas.length; k++) {
            thetas[k] = start0 + k * stepA
          }
          // 环绕点自上而下扫描：同一水平带内文本包围盒相交时向下顺延避让，
          // 放不下（超出下边界）则自动隐藏（同 ECharts hideOverlap），悬停与图例仍可获取该顶数据
          const maxYc = cy + plotH / 2 + 8
          const textW = (s: string): number =>
            s.replace(/[^\x00-\xff]/g, 'xx').length * theme.fontSize * 0.62
          const pts = items
            .map((it, k) => {
              const theta = thetas[k]
              const p = polar(it.ocx, it.ocy, R, theta)
              const w = textW(`${it.s.name} ${formatPercent(it.s.percent)}`)
              // 先向下顺延避让已放置的标签，放不下（超出下边界）再标记隐藏
              const tx = p.x + (Math.sin(theta) >= 0 ? 4 : -4)
              return {
                it,
                theta,
                y: p.y,
                x0: Math.sin(theta) >= 0 ? tx : tx - w,
                x1: Math.sin(theta) >= 0 ? tx + w : tx,
                hidden: false,
              }
            })
            .sort((a, b) => a.y - b.y)
          const placed: { y: number; x0: number; x1: number }[] = []
          // 按占比从大到小依次放置：大扇区优先占据自然环绕位置，
          // 小扇区向下顺延避让，放不下（超出下边界）才隐藏
          ;[...pts]
            .sort((a, b) => b.it.s.value - a.it.s.value)
            .forEach((o) => {
              for (let guard = 0; guard < 200; guard++) {
                const hit = placed.find(
                  (q) => Math.abs(q.y - o.y) < step - 2 && o.x0 < q.x1 && q.x0 < o.x1
                )
                if (hit === undefined) break
                o.y = hit.y + step
              }
              if (o.y > maxYc) {
                o.hidden = true
                return
              }
              placed.push({ y: o.y, x0: o.x0, x1: o.x1 })
            })
          pts.forEach((o) => {
            o.it.theta = o.theta
            o.it.pushY = o.y
            o.it.hide = o.it.hide || o.hidden
          })
        }
        if (aligned) {
          // aligned：纵向容量不足时该侧退化为环形布局
          if (distribute(right)) layoutCircular(right)
          if (distribute(left)) layoutCircular(left)
        } else {
          // 默认布局：数据量较大且小扇区扎堆（相邻扇区放不下一个行高）时，
          // 同样退化为环形布局，避免标签在起始角附近严重重叠
          const twoPi = Math.PI * 2
          let minGap = Infinity
          for (let k = 0; k < slices.length; k++) {
            let g = Math.abs(slices[(k + 1) % slices.length].midT - slices[k].midT) % twoPi
            if (g > Math.PI) g = twoPi - g
            minGap = Math.min(minGap, g)
          }
          if (minGap * (outerR + 14) < step + 2) {
            layoutCircular(right)
            layoutCircular(left)
          }
        }
      }
      const labelX = outerR + 30
      ;[...right, ...left].forEach((it) => {
        if (it.hide) return
        let dim = 0
        hoverEases.forEach((v, k) => {
          if (k !== it.i && v > dim) dim = v
        })
        const opacity = 1 - HOVER_DIM * dim
        const pA = polar(it.ocx, it.ocy, it.s.outerR + 2, it.s.midT)
        // 环形布局的文本方向取环绕角，其余取扇区角（被推挤跨越 0/π 角时锚点自动翻转）
        const dir = Math.sin(it.theta ?? it.s.midT) >= 0 ? 1 : -1
        let d: string
        let textX: number
        let textY: number
        if (it.theta !== null) {
          // 环形布局：引导线从扇区边缘直达环绕位置的斜向放射线，文本在环绕点外侧
          const p = polar(it.ocx, it.ocy, outerR + 30, it.theta)
          const y = it.pushY ?? p.y
          d = `M${r2(pA.x)},${r2(pA.y)}L${r2(p.x)},${r2(y)}`
          textX = p.x + dir * 4
          textY = y + theme.fontSize / 2 - 1
        } else {
          const pB = polar(it.ocx, it.ocy, it.s.outerR + 14, it.s.midT)
          // default：径向段 + 水平段，文本跟随扇区角度；aligned：斜段 + 短水平段接入分布后的标签位置
          let pC: Point
          let pD: Point | null
          if (aligned) {
            pC = { x: cx + dir * (labelX - 16), y: it.labelY }
            pD = { x: cx + dir * (labelX - 6), y: it.labelY }
            textX = cx + dir * labelX
          } else {
            pC = { x: pB.x + dir * 10, y: pB.y }
            pD = null
            textX = pC.x + dir * 4
          }
          const dSeg = pD === null ? '' : `L${r2(pD.x)},${r2(pD.y)}`
          d = `M${r2(pA.x)},${r2(pA.y)}L${r2(pB.x)},${r2(pB.y)}L${r2(pC.x)},${r2(pC.y)}${dSeg}`
          textY = (pD ?? pC).y + theme.fontSize / 2 - 1
        }
        labelNodes.push(
          path(d, {
            key: `guideline/${it.i}`,
            stroke: this.solidColor(it.s.color),
            strokeWidth: 1,
            opacity,
          })
        )
        labelNodes.push(
          text(r2(textX), r2(textY), `${it.s.name} ${formatPercent(it.s.percent)}`, {
            key: `label/${it.i}`,
            anchor: dir === 1 ? 'start' : 'end',
            fontSize: theme.fontSize,
            fill: theme.textColor,
            fontFamily: theme.fontFamily,
            opacity,
          })
        )
      })
    }
    children.push(group({ key: 'labels', children: labelNodes }))

    // ============ 环形中心文本 ============
    const centerNodes: GroupNode['children'] = []
    if (innerR > 0 && option.centerTitle) {
      centerNodes.push(
        text(cx, cy + (option.centerSubtitle ? -5 : 6), option.centerTitle, {
          key: 'center-title',
          anchor: 'middle',
          fontSize: 16,
          fontWeight: 600,
          fill: theme.textColor,
          fontFamily: theme.fontFamily,
        })
      )
      if (option.centerSubtitle) {
        centerNodes.push(
          text(cx, cy + 16, option.centerSubtitle, {
            key: 'center-subtitle',
            anchor: 'middle',
            fontSize: theme.fontSize,
            fill: theme.textColor,
            fontFamily: theme.fontFamily,
          })
        )
      }
    }
    children.push(group({ key: 'center', children: centerNodes }))

    return group({ key: 'plot', children })
  }

  protected hitTest(x: number, y: number): number | null {
    const layout = this.layout
    if (!layout) return null
    const { cx, cy, innerR, slices } = layout
    const dx = x - cx
    const dy = y - cy
    const dist = Math.hypot(dx, dy)
    if (dist < innerR) return null
    // 顺时针角（自 12 点方向）：atan2(x, -y) 归一化到 [0, 2π)
    let t = Math.atan2(dx, -dy)
    if (t < 0) t += Math.PI * 2
    // 起始角偏移：布局角同样自 startAngle 起，直接比对扇区区间
    for (let i = 0; i < slices.length; i++) {
      const s = slices[i]
      let start = s.startT
      let end = s.endT
      // 归一化到与 t 相同的 [0, 2π) 区间
      while (start < 0) {
        start += Math.PI * 2
        end += Math.PI * 2
      }
      while (start > Math.PI * 2) {
        start -= Math.PI * 2
        end -= Math.PI * 2
      }
      const tt = t < start ? t + Math.PI * 2 : t
      if (tt >= start && tt < end && dist <= s.outerR) return i
    }
    return null
  }

  protected getHoverInfo(index: number): HoverInfo {
    const layout = this.layout
    if (!layout) return { index, x: 0, y: 0 }
    const s = layout.slices[index]
    if (!s) return { index, x: 0, y: 0 }
    const anchorR = (layout.innerR + s.outerR) / 2
    const p = polar(layout.cx, layout.cy, anchorR, s.midT)
    return { index, x: r2(p.x), y: r2(p.y) }
  }
}

// ============ 纯函数工具 ============

function r2(v: number): number {
  return Math.round(v * 100) / 100
}

function deg2rad(deg: number): number {
  return (deg * Math.PI) / 180
}

function clampPx(v: number, min: number, max: number): number {
  return Math.min(Math.max(v, min), max)
}

/** 极坐标 → 直角坐标（t 自 12 点方向顺时针） */
function polar(cx: number, cy: number, r: number, t: number): Point {
  return { x: cx + r * Math.sin(t), y: cy - r * Math.cos(t) }
}

function formatPercent(p: number): string {
  return `${Number(p.toFixed(1))}%`
}

/**
 * 扇区路径（支持环形：r0 > 0 时走内外双弧；radius > 0 时四角圆角化）
 * 整圆保护：SVG 弧线起止点重合时退化不绘制，留一个不可见的缝隙
 * 圆角实现：四个直角以二次贝塞尔近似圆弧过渡，控制点取原角点，
 * 角收缩量取弧长 ≈ radius 反推的角（外角按外弧、内角按内弧各自计算）
 */
function slicePath(
  cx: number,
  cy: number,
  r0: number,
  r1: number,
  a0: number,
  a1: number,
  radius = 0
): string {
  const span = a1 - a0
  if (span <= 0 || r1 <= 0) return ''
  const end = span >= Math.PI * 2 - 1e-4 ? a0 + Math.PI * 2 - 1e-4 : a1
  const spanE = end - a0
  const ring = r0 > 0.5
  // 圆角半径约束：不超过径向厚度的一半、内侧不超过孔半径的一半、角收缩不超过角跨度的一半
  let rad = Math.min(radius, (r1 - Math.max(r0, 0)) / 2, ring ? r0 / 2 : Infinity)
  rad = Math.min(rad, (spanE / 2) * r1, ring ? (spanE / 2) * r0 : Infinity)
  const largeO = spanE > Math.PI ? 1 : 0
  if (rad <= 0.5) {
    // —— 无圆角：原始直角扇区 ——
    const p1 = polar(cx, cy, r1, a0)
    const p2 = polar(cx, cy, r1, end)
    if (!ring) {
      return `M${r2(cx)},${r2(cy)}L${r2(p1.x)},${r2(p1.y)}A${r2(r1)},${r2(r1)} 0 ${largeO} 1 ${r2(p2.x)},${r2(p2.y)}Z`
    }
    const p3 = polar(cx, cy, r0, end)
    const p4 = polar(cx, cy, r0, a0)
    return `M${r2(p1.x)},${r2(p1.y)}A${r2(r1)},${r2(r1)} 0 ${largeO} 1 ${r2(p2.x)},${r2(p2.y)}L${r2(p3.x)},${r2(p3.y)}A${r2(r0)},${r2(r0)} 0 ${largeO} 0 ${r2(p4.x)},${r2(p4.y)}Z`
  }
  // —— 圆角扇区：外/内四角以二次贝塞尔过渡（控制点 = 原角点） ——
  const cutO = rad / r1
  const cutI = ring ? rad / r0 : 0
  const largeI = ring && spanE - 2 * cutI > Math.PI ? 1 : 0
  if (!ring) {
    const c1 = polar(cx, cy, r1, a0)
    const c2 = polar(cx, cy, r1, end)
    const pA = polar(cx, cy, r1 - rad, a0)
    const pB = polar(cx, cy, r1, a0 + cutO)
    const pC = polar(cx, cy, r1, end - cutO)
    const pD = polar(cx, cy, r1 - rad, end)
    return (
      `M${r2(cx)},${r2(cy)}L${r2(pA.x)},${r2(pA.y)}` +
      `Q${r2(c1.x)},${r2(c1.y)} ${r2(pB.x)},${r2(pB.y)}` +
      `A${r2(r1)},${r2(r1)} 0 ${largeO} 1 ${r2(pC.x)},${r2(pC.y)}` +
      `Q${r2(c2.x)},${r2(c2.y)} ${r2(pD.x)},${r2(pD.y)}Z`
    )
  }
  const c1 = polar(cx, cy, r1, a0)
  const c2 = polar(cx, cy, r1, end)
  const c3 = polar(cx, cy, r0, end)
  const c4 = polar(cx, cy, r0, a0)
  const pA = polar(cx, cy, r0 + rad, a0)
  const pB = polar(cx, cy, r1 - rad, a0)
  const pC = polar(cx, cy, r1, a0 + cutO)
  const pD = polar(cx, cy, r1, end - cutO)
  const pE = polar(cx, cy, r1 - rad, end)
  const pF = polar(cx, cy, r0 + rad, end)
  const pG = polar(cx, cy, r0, end - cutI)
  const pH = polar(cx, cy, r0, a0 + cutI)
  return (
    `M${r2(pA.x)},${r2(pA.y)}` +
    `L${r2(pB.x)},${r2(pB.y)}` +
    `Q${r2(c1.x)},${r2(c1.y)} ${r2(pC.x)},${r2(pC.y)}` +
    `A${r2(r1)},${r2(r1)} 0 ${largeO} 1 ${r2(pD.x)},${r2(pD.y)}` +
    `Q${r2(c2.x)},${r2(c2.y)} ${r2(pE.x)},${r2(pE.y)}` +
    `L${r2(pF.x)},${r2(pF.y)}` +
    `Q${r2(c3.x)},${r2(c3.y)} ${r2(pG.x)},${r2(pG.y)}` +
    `A${r2(r0)},${r2(r0)} 0 ${largeI} 0 ${r2(pH.x)},${r2(pH.y)}` +
    `Q${r2(c4.x)},${r2(c4.y)} ${r2(pA.x)},${r2(pA.y)}Z`
  )
}
