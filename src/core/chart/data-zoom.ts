import { clamp } from '../utils/math'
import { withAlpha } from '../utils/color'
import { group, path, rect } from '../scene/nodes'
import type { GroupNode } from '../scene/nodes'
import type { KChartTheme } from '../theme'
import type { KDataZoomOption } from '../types'
import type { SVGRenderer } from '../renderer/svg-renderer'

/** dataZoom 滑条几何（渲染与拖拽命中共用） */
export interface ZoomGeom {
  trackX: number
  trackY: number
  trackW: number
  trackH: number
  handleW: number
  /** 全量数据点数 */
  total: number
}

interface ZoomState {
  /** 窗口起止百分比 0~100 */
  start: number
  end: number
  /** 配置指纹（配置不变则拖拽后的窗口状态不被重置） */
  key: string
  /** 全量数据点数 */
  total: number
  /** 当前窗口起始数据下标 */
  visibleStart: number
  dragMode: 'win' | 'start' | 'end' | 'plot-pan' | null
  /** 拖拽时抓取偏移：滑条窗口为百分比，plot-pan 为指针处数据百分比 */
  grabPct: number
  /** inside 模式（滚轮缩放 / 绘图区拖拽平移）是否启用 */
  inside: boolean
}

/**
 * dataZoom 滑条控制器（直角坐标系图表共用：折线 / 柱形等）。
 * 图表实例持有一个控制器，build 阶段调用 resolve / applyWindow / buildGeom，
 * 交互（拖拽平移、手柄缩放、点击轨道定位）由控制器自行监听渲染器的指针事件。
 */
export class DataZoomController {
  private st: ZoomState = {
    start: 0,
    end: 100,
    key: '',
    total: 0,
    visibleStart: 0,
    dragMode: null,
    grabPct: 0,
    inside: false,
  }
  /** 当前滑条几何（build 阶段写入，交互命中读取） */
  geom: ZoomGeom | null = null
  /** 绘图区矩形（build 阶段写入，inside 滚轮缩放 / 拖拽平移命中用；未启用为 null） */
  private plotRect: { x: number; y: number; w: number; h: number } | null = null

  constructor(
    private renderer: SVGRenderer,
    /** 重绘回调（拖拽中每帧调用，不重播入场动画） */
    private rerender: () => void
  ) {
    renderer.on('pointerdown', this.onDown)
    renderer.on('pointermove', this.onMove)
    renderer.on('pointerup', this.onUp)
    renderer.on('wheel', this.onWheel)
  }

  get visibleStart(): number {
    return this.st.visibleStart
  }

  get start(): number {
    return this.st.start
  }

  get end(): number {
    return this.st.end
  }

  /** 关闭滑条时重置窗口偏移，避免 tooltip 映射残留上一次的窗口起始下标 */
  resetWindow(): void {
    this.st.visibleStart = 0
  }

  /** 解析配置：返回滑条 / inside 启用状态，整体未启用返回 null。disabled 传入图表自身不支持滑条的条件（如垂直折线），insideDisabled 单独禁用滚轮缩放（如横向柱图） */
  resolve(
    dz: boolean | KDataZoomOption | undefined,
    disabled: boolean,
    labelCount: number,
    insideDisabled = false
  ): { slider: boolean; inside: boolean } | null {
    if (!dz || labelCount <= 2) return null
    const key = JSON.stringify(dz)
    if (key !== this.st.key) {
      this.st.key = key
      const conf = typeof dz === 'object' ? dz : {}
      this.st.start = clamp(conf.start ?? 0, 0, 100)
      this.st.end = clamp(conf.end ?? 100, 0, 100)
      if (this.st.start > this.st.end) {
        ;[this.st.start, this.st.end] = [this.st.end, this.st.start]
      }
      this.st.inside = (conf.inside ?? true) && !disabled && !insideDisabled
    }
    this.st.total = labelCount
    return {
      slider: !disabled && (typeof dz === 'object' ? (dz.slider ?? true) : true),
      inside: this.st.inside,
    }
  }

  /** 记录绘图区矩形（inside 滚轮缩放 / 拖拽平移命中用），未启用时传 null 清空 */
  setPlotRect(rect: { x: number; y: number; w: number; h: number } | null): void {
    this.plotRect = rect
  }

  /** 计算窗口对应的数据下标闭区间 [from, to]，并记录起始下标供 tooltip 换算 */
  applyWindow(labelCount: number): [number, number] {
    const from = Math.round((this.st.start / 100) * (labelCount - 1))
    const to = Math.round((this.st.end / 100) * (labelCount - 1))
    this.st.visibleStart = from
    return [from, to]
  }

  /** 依据布局计算滑条几何（轨道过窄则不启用） */
  buildGeom(trackX: number, trackY: number, trackW: number): ZoomGeom | null {
    if (trackW <= 40) {
      this.geom = null
      return null
    }
    this.geom = { trackX, trackY, trackW, trackH: 16, handleW: 9, total: this.st.total }
    return this.geom
  }

  // ============ 交互（对齐 ECharts：滑条拖拽平移 / 手柄缩放 / 点击定位 + inside 滚轮缩放 / 拖拽平移） ============

  /** 最小窗口宽度（百分比）：至少露出两个类目 */
  private minSpan(): number {
    return this.st.total > 1 ? 100 / (this.st.total - 1) : 100
  }

  private onDown = (e: PointerEvent): void => {
    if (this.st.dragMode) return
    const geom = this.geom
    const rectSvg = this.renderer.svg.getBoundingClientRect()
    const x = e.clientX - rectSvg.left
    const y = e.clientY - rectSvg.top
    // 滑条优先：指针落在滑条附近走滑条交互（slider 关闭时 geom 为 null，直接走 inside 平移）
    if (geom && y >= geom.trackY - 6 && y <= geom.trackY + geom.trackH + 6) {
      const wx0 = geom.trackX + (geom.trackW * this.st.start) / 100
      const wx1 = geom.trackX + (geom.trackW * this.st.end) / 100
      e.preventDefault()
      try {
        this.renderer.svg.setPointerCapture(e.pointerId)
      } catch {
        /* 部分环境不支持指针捕获，忽略 */
      }
      if (Math.abs(x - wx0) <= geom.handleW + 2) {
        this.st.dragMode = 'start'
      } else if (Math.abs(x - wx1) <= geom.handleW + 2) {
        this.st.dragMode = 'end'
      } else if (x > wx0 && x < wx1) {
        this.st.dragMode = 'win'
        this.st.grabPct = ((x - wx0) / geom.trackW) * 100
      } else {
        // 点击空白轨道：窗口中心定位到点击处，随后可继续拖拽
        const winW = this.st.end - this.st.start
        const center = clamp(((x - geom.trackX) / geom.trackW) * 100, 0, 100)
        this.st.start = clamp(center - winW / 2, 0, 100 - winW)
        this.st.end = this.st.start + winW
        this.st.dragMode = 'win'
        this.st.grabPct = winW / 2
        this.rerender()
      }
      return
    }
    // inside 拖拽平移：窗口非全域时在绘图区内按住左右拖动
    const pr = this.plotRect
    if (
      this.st.inside &&
      pr &&
      (this.st.start > 0 || this.st.end < 100) &&
      x >= pr.x &&
      x <= pr.x + pr.w &&
      y >= pr.y &&
      y <= pr.y + pr.h
    ) {
      e.preventDefault()
      try {
        this.renderer.svg.setPointerCapture(e.pointerId)
      } catch {
        /* 忽略 */
      }
      this.st.dragMode = 'plot-pan'
      // 记录指针处的数据百分比，拖动时保持该点跟随指针（平移不跳变）
      this.st.grabPct = this.st.start + ((x - pr.x) / pr.w) * (this.st.end - this.st.start)
    }
  }

  private onMove = (e: PointerEvent): void => {
    if (!this.st.dragMode) return
    const rectSvg = this.renderer.svg.getBoundingClientRect()
    const px = e.clientX - rectSvg.left
    if (this.st.dragMode === 'plot-pan') {
      const pr = this.plotRect
      if (!pr) return
      const p = clamp((px - pr.x) / pr.w, 0, 1)
      const span = this.st.end - this.st.start
      this.st.start = clamp(this.st.grabPct - span * p, 0, 100 - span)
      this.st.end = this.st.start + span
      this.rerender()
      return
    }
    const geom = this.geom
    if (!geom) return
    const pct = clamp(((px - geom.trackX) / geom.trackW) * 100, 0, 100)
    const minSpan = this.minSpan()
    if (this.st.dragMode === 'start') {
      this.st.start = clamp(Math.min(pct, this.st.end - minSpan), 0, 100)
    } else if (this.st.dragMode === 'end') {
      this.st.end = clamp(Math.max(pct, this.st.start + minSpan), 0, 100)
    } else {
      const winW = this.st.end - this.st.start
      this.st.start = clamp(pct - this.st.grabPct, 0, 100 - winW)
      this.st.end = this.st.start + winW
    }
    this.rerender()
  }

  private onUp = (e: PointerEvent): void => {
    if (!this.st.dragMode) return
    this.st.dragMode = null
    try {
      this.renderer.svg.releasePointerCapture(e.pointerId)
    } catch {
      /* 忽略 */
    }
  }

  /**
   * inside 滚轮缩放：指针落在绘图区内时以指针位置为锚点缩放窗口，
   * 上滚放大、下滚缩小（对齐 ECharts dataZoom-inside）；非全域窗口外不拦截，页面照常滚动。
   */
  private onWheel = (e: WheelEvent): void => {
    const pr = this.plotRect
    if (!this.st.inside || !pr || this.st.dragMode) return
    const rectSvg = this.renderer.svg.getBoundingClientRect()
    const x = e.clientX - rectSvg.left
    const y = e.clientY - rectSvg.top
    if (x < pr.x || x > pr.x + pr.w || y < pr.y || y > pr.y + pr.h) return
    e.preventDefault()
    // 缩放锚点：指针处的数据百分比保持不动
    const anchor = clamp((x - pr.x) / pr.w, 0, 1)
    const oldSpan = this.st.end - this.st.start
    const factor = e.deltaY < 0 ? 1 / 1.18 : 1.18
    const newSpan = clamp(oldSpan * factor, this.minSpan(), 100)
    const fixed = this.st.start + oldSpan * anchor
    const start = clamp(fixed - newSpan * anchor, 0, 100 - newSpan)
    if (Math.abs(newSpan - oldSpan) < 0.001 && Math.abs(start - this.st.start) < 0.001) return
    this.st.start = start
    this.st.end = start + newSpan
    this.rerender()
  }
}

/**
 * 滑条场景图：轨道 + 全量剪影 + 窗口内高亮剪影 + 窗口外压暗 + 双手柄。
 * 剪影数据不足 2 个有效值时只画轨道 / 窗口 / 手柄。
 */
export function buildDataZoomSlider(opts: {
  geom: ZoomGeom
  theme: KChartTheme
  /** 全量首系列归一化值 */
  silValues: Array<number | null>
  /** 当前窗口数据下标区间 [from, to]（闭区间） */
  visibleRange: [number, number]
  /** 窗口内剪影 / 手柄强调色 */
  seriesColor: string
  zoomStart: number
  zoomEnd: number
}): GroupNode {
  const { geom, theme, silValues, visibleRange, seriesColor } = opts
  const pctX = (pct: number): number => geom.trackX + (geom.trackW * pct) / 100
  const nodes: GroupNode['children'] = []
  nodes.push(
    rect(geom.trackX, geom.trackY, geom.trackW, geom.trackH, {
      key: 'dz/track',
      radius: 3,
      fill: withAlpha(theme.gridColor, 0.9),
    })
  )
  const finite = silValues.filter((v): v is number => v !== null && v !== undefined)
  if (finite.length >= 2) {
    const vMin = Math.min(...finite)
    const vMax = Math.max(...finite)
    const fullN = geom.total
    const yOf = (v: number): number =>
      geom.trackY + geom.trackH - 1 - ((v - vMin) / Math.max(1e-9, vMax - vMin)) * (geom.trackH - 2)
    const xOfIdx = (i: number): number => pctX((i / Math.max(1, fullN - 1)) * 100)
    const silPathOf = (from: number, to: number): string => {
      let d = ''
      let started = false
      for (let i = Math.max(0, from); i <= Math.min(fullN - 1, to); i++) {
        const v = silValues[i]
        if (v === null || v === undefined) continue
        d += `${started ? 'L' : 'M'}${xOfIdx(i)},${yOf(v)}`
        started = true
      }
      if (!started) return ''
      return (
        d +
        `L${xOfIdx(to)},${geom.trackY + geom.trackH}` +
        `L${xOfIdx(from)},${geom.trackY + geom.trackH}Z`
      )
    }
    const baseSil = silPathOf(0, fullN - 1)
    if (baseSil) {
      nodes.push(path(baseSil, { key: 'dz/sil', fill: withAlpha(theme.textColor, 0.18) }))
    }
    const wx0 = pctX(opts.zoomStart)
    const wx1 = pctX(opts.zoomEnd)
    // 窗口外压暗（对齐 ECharts selected 区域外的视觉对比）
    if (wx0 > geom.trackX) {
      nodes.push(
        rect(geom.trackX, geom.trackY, wx0 - geom.trackX, geom.trackH, {
          key: 'dz/dimL',
          fill: '#FFFFFF',
          opacity: 0.55,
        })
      )
    }
    if (wx1 < geom.trackX + geom.trackW) {
      nodes.push(
        rect(wx1, geom.trackY, geom.trackX + geom.trackW - wx1, geom.trackH, {
          key: 'dz/dimR',
          fill: '#FFFFFF',
          opacity: 0.55,
        })
      )
    }
    const winSil = silPathOf(visibleRange[0], visibleRange[1])
    if (winSil) {
      nodes.push(path(winSil, { key: 'dz/winsil', fill: withAlpha(seriesColor, 0.35) }))
    }
  }
  const wx0 = pctX(opts.zoomStart)
  const wx1 = pctX(opts.zoomEnd)
  nodes.push(
    rect(wx0, geom.trackY, Math.max(2, wx1 - wx0), geom.trackH, {
      key: 'dz/window',
      radius: 3,
      stroke: withAlpha(seriesColor, 0.8),
      strokeWidth: 1,
      cursor: 'grab',
    })
  )
  nodes.push(
    rect(wx0 - geom.handleW / 2, geom.trackY - 3, geom.handleW, geom.trackH + 6, {
      key: 'dz/handleL',
      radius: 2.5,
      fill: '#FFFFFF',
      stroke: seriesColor,
      strokeWidth: 1.5,
      cursor: 'ew-resize',
    })
  )
  nodes.push(
    rect(wx1 - geom.handleW / 2, geom.trackY - 3, geom.handleW, geom.trackH + 6, {
      key: 'dz/handleR',
      radius: 2.5,
      fill: '#FFFFFF',
      stroke: seriesColor,
      strokeWidth: 1.5,
      cursor: 'ew-resize',
    })
  )
  return group({ key: 'datazoom', children: nodes })
}
