import { BaseChart } from './base-chart'
import { clamp } from '../utils/math'
import { defaultTheme } from '../theme'
import type { KChartTheme } from '../theme'
import { group, text } from '../scene/nodes'
import type { GroupNode } from '../scene/nodes'
import type { HoverInfo, KWordcloudDatum, Padding, RenderContext } from '../types'

/** 词云配置 */
export interface WordcloudChartOption {
  /** 词频数据 */
  data: KWordcloudDatum[]
  /** 最小字号 px，缺省 14 */
  minFont?: number
  /** 最大字号 px，缺省 52 */
  maxFont?: number
  /** 旋转比例（0~1，命中词旋转 90°；确定性交替），缺省 0.35 */
  rotateRatio?: number
  /** 放不下时整体缩放字号的尝试次数，缺省 6 */
  shrinkTries?: number
  theme?: Partial<KChartTheme>
  padding?: Partial<Padding>
  emptyText?: string
}

const DEFAULT_PADDING: Padding = { top: 24, right: 24, bottom: 24, left: 24 }
const GOLDEN_STEP = 0.35 // 阿基米德螺线角步长（弧度）

/** 布局后的词（绘制与命中检测共用） */
interface PlacedWord {
  index: number
  name: string
  value: number
  color: string
  x: number
  y: number
  font: number
  rotate: number
  /** 碰撞矩形（旋转后已换算） */
  w: number
  h: number
}

/**
 * 词云（Word Cloud）
 * 字号 ∝ √value，阿基米德螺线 + 矩形碰撞检测排布（确定性：按词频降序、旋转按序号取模），
 * 放不下时按 shrinkTries 整体缩字号重排。悬停索引 = 原始数据下标。
 */
export class WordcloudChart extends BaseChart<WordcloudChartOption> {
  private model: PlacedWord[] | null = null
  private cacheSig = ''

  protected build(option: WordcloudChartOption, ctx: RenderContext): GroupNode {
    const theme: KChartTheme = { ...defaultTheme, ...option.theme }
    const pad: Padding = { ...DEFAULT_PADDING, ...option.padding }
    const plotW = Math.max(0, ctx.width - pad.left - pad.right)
    const plotH = Math.max(0, ctx.height - pad.top - pad.bottom)
    const model = this.getModel(option, plotW, plotH, pad)
    if (model.length === 0) {
      return group({
        key: 'empty',
        children: [
          text(ctx.width / 2, ctx.height / 2, option.emptyText ?? '暂无数据', {
            anchor: 'middle',
            fontSize: 14,
            fill: theme.emptyColor,
            fontFamily: theme.fontFamily,
          }),
        ],
      })
    }

    const hover = ctx.hoverIndex
    const children: GroupNode['children'] = []
    const count = Math.max(1, model.length)

    model.forEach((wd, gi) => {
      const local = clamp01(ctx.progress * count - gi)
      if (local <= 0) return
      const dimmed = hover !== null && hover !== wd.index
      children.push(
        text(wd.x, wd.y, wd.name, {
          key: `word/${wd.index}`,
          anchor: 'middle',
          fontSize: wd.font,
          fontWeight: hover === wd.index ? 700 : 500,
          fill: wd.color,
          fontFamily: theme.fontFamily,
          rotate: wd.rotate > 0 ? 90 : undefined,
          opacity: (dimmed ? 0.25 : 1) * local,
          cursor: 'pointer',
        })
      )
    })

    return group({ key: 'plot', children: [group({ key: 'cloud', children })] })
  }

  /** 命中检测：词矩形（旋转词已换算为竖矩形） */
  protected hitTest(x: number, y: number): number | null {
    const model = this.model
    if (!model) return null
    // 优先小词（大词矩形包含小词时命中更精确的）
    let best: number | null = null
    let bestArea = Infinity
    for (const wd of model) {
      if (x >= wd.x - wd.w / 2 && x <= wd.x + wd.w / 2 && y >= wd.y - wd.h / 2 && y <= wd.y + wd.h / 2) {
        const area = wd.w * wd.h
        if (area < bestArea) {
          bestArea = area
          best = wd.index
        }
      }
    }
    return best
  }

  protected getHoverInfo(index: number): HoverInfo {
    const wd = this.model?.find((p) => p.index === index)
    if (!wd) return { index, x: 0, y: 0 }
    return { index, x: r2(wd.x), y: r2(wd.y - wd.font / 2) }
  }

  // ============ 布局（签名缓存） ============

  private getModel(option: WordcloudChartOption, plotW: number, plotH: number, pad: Padding): PlacedWord[] {
    const sig = JSON.stringify([option.data, option.minFont, option.maxFont, option.rotateRatio, plotW, plotH])
    if (this.model && sig === this.cacheSig) return this.model
    this.cacheSig = sig

    if (option.data.length === 0 || plotW <= 40 || plotH <= 40) {
      this.model = []
      return this.model
    }

    const theme: KChartTheme = { ...defaultTheme, ...option.theme }
    const rotateRatio = clamp(option.rotateRatio ?? 0.35, 0, 1)
    const shrinkTries = Math.max(1, option.shrinkTries ?? 6)

    // 布局尝试：整体字号从 1 开始按 0.9 递缩减放，直到全部放得下
    let placed: PlacedWord[] = []
    for (let attempt = 0; attempt < shrinkTries; attempt++) {
      const shrink = Math.pow(0.9, attempt)
      placed = layoutOnce(option, theme, plotW, plotH, pad, rotateRatio, shrink)
      if (placed.length === option.data.length) break
    }
    this.model = placed
    return this.model
  }
}

// ============ 布局（纯函数） ============

let measureCtx: CanvasRenderingContext2D | null = null

function measureText(text: string, fontPx: number, fontFamily: string): number {
  if (!measureCtx) {
    measureCtx = document.createElement('canvas').getContext('2d')
  }
  if (!measureCtx) return text.length * fontPx * 0.6
  measureCtx.font = `${fontPx}px ${fontFamily}`
  return measureCtx.measureText(text).width
}

function layoutOnce(
  option: WordcloudChartOption,
  theme: KChartTheme,
  plotW: number,
  plotH: number,
  pad: Padding,
  rotateRatio: number,
  shrink: number
): PlacedWord[] {
  const minFont = (option.minFont ?? 14) * shrink
  const maxFont = (option.maxFont ?? 52) * shrink
  const values = option.data.map((d) => d.value)
  let vmin = Math.min(...values)
  let vmax = Math.max(...values)
  if (vmax === vmin) {
    vmax += 1
    vmin -= 1
  }
  const smin = Math.sqrt(vmin)
  const smax = Math.sqrt(vmax)

  // 按词频降序排布（大词先放占中心），记录原始下标
  const order = option.data
    .map((d, index) => ({ d, index }))
    .sort((a, b) => b.d.value - a.d.value)

  const placed: PlacedWord[] = []
  const rects: PlacedWord[] = []
  const cx = pad.left + plotW / 2
  const cy = pad.top + plotH / 2
  // 椭圆螺线：横向步幅 1，纵向按高宽比压缩，保证椭圆贴合画布
  const sy = plotH / plotW

  for (const { d, index } of order) {
    const t = (Math.sqrt(d.value) - smin) / (smax - smin)
    const font = minFont + clamp(t, 0, 1) * (maxFont - minFont)
    const textW = measureText(d.name, font, theme.fontFamily)
    const textH = font * 1.12
    // 旋转判定：确定性交替（序号取模映射到 rotateRatio 概率）
    const rotate = ((index * 7) % 100) / 100 < rotateRatio ? 90 : 0
    const w = rotate > 0 ? textH : textW
    const h = rotate > 0 ? textW : textH

    let ok = false
    let px = cx
    let py = cy
    // 阿基米德螺线找位：从中心向外，直到矩形不与已放词相交且不出界
    for (let theta = 0; theta <= plotW; theta += GOLDEN_STEP) {
      px = cx + theta * Math.cos(theta)
      py = cy + theta * Math.sin(theta) * sy
      if (
        px - w / 2 < pad.left || px + w / 2 > pad.left + plotW ||
        py - h / 2 < pad.top || py + h / 2 > pad.top + plotH
      ) {
        continue
      }
      let hit = false
      for (const rc of rects) {
        if (px - w / 2 < rc.x + rc.w / 2 && px + w / 2 > rc.x - rc.w / 2 && py - h / 2 < rc.y + rc.h / 2 && py + h / 2 > rc.y - rc.h / 2) {
          hit = true
          break
        }
      }
      if (!hit) {
        ok = true
        break
      }
    }
    if (!ok) return placed // 本次尝试失败（交给外层缩字号重排）

    const word: PlacedWord = {
      index,
      name: d.name,
      value: d.value,
      color: d.color ?? theme.colors[index % theme.colors.length],
      x: px,
      y: py + font * 0.35, // 文本视觉居中补偿（SVG 无 baseline 设置）
      font,
      rotate,
      w,
      h,
    }
    placed.push(word)
    rects.push(word)
  }
  return placed
}

// ============ 纯函数工具 ============

function r2(v: number): number {
  return Math.round(v * 100) / 100
}

function clamp01(v: number): number {
  return clamp(v, 0, 1)
}
