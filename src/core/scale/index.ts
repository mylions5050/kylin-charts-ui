import { clamp } from '../utils/math'

/** 线性比例尺：将连续数值域 [d0, d1] 映射到像素域 [r0, r1] */
export class LinearScale {
  constructor(
    private domain: [number, number],
    private range: [number, number]
  ) {}

  scale(value: number): number {
    const [d0, d1] = this.domain
    const [r0, r1] = this.range
    if (d1 === d0) return (r0 + r1) / 2
    return r0 + ((value - d0) / (d1 - d0)) * (r1 - r0)
  }

  /** 反向映射：像素坐标 → 数据值 */
  invert(pixel: number): number {
    const [d0, d1] = this.domain
    const [r0, r1] = this.range
    if (r1 === r0) return (d0 + d1) / 2
    return d0 + ((pixel - r0) / (r1 - r0)) * (d1 - d0)
  }

  /** 当前域截取到 [min, max] 后的副本（用于数据越界裁剪） */
  clampDomain(min: number, max: number): LinearScale {
    return new LinearScale(
      [Math.max(this.domain[0], min), Math.min(this.domain[1], max)],
      this.range
    )
  }

  get domain$(): [number, number] {
    return [this.domain[0], this.domain[1]]
  }

  static of(domain: [number, number], range: [number, number]): LinearScale {
    return new LinearScale(domain, range)
  }
}

/** 对数比例尺：以 10 为底，要求域为正；刻度落在域内 10 的整数次幂上 */
export class LogScale {
  constructor(
    private domain: [number, number],
    private range: [number, number]
  ) {}

  private t(value: number): number {
    const [d0, d1] = this.domain
    if (d1 <= d0 || value <= 0 || d0 <= 0) return 0
    return (Math.log10(value) - Math.log10(d0)) / (Math.log10(d1) - Math.log10(d0))
  }

  scale(value: number): number {
    const [r0, r1] = this.range
    return r0 + clamp(this.t(value), 0, 1) * (r1 - r0)
  }

  /** 域内 10 的整数次幂刻度（如 [1, 1000] → [1, 10, 100, 1000]） */
  ticks(): number[] {
    const [d0, d1] = this.domain
    const out: number[] = []
    for (let e = Math.floor(Math.log10(d0)); e <= Math.ceil(Math.log10(d1)); e++) {
      const v = Math.pow(10, e)
      if (v >= d0 && v <= d1) out.push(v)
    }
    return out
  }

  get domain$(): [number, number] {
    return [this.domain[0], this.domain[1]]
  }
}

/** 分类带宽比例尺：将离散类目映射到像素区间（柱形图 / 折线图 x 轴） */
export class BandScale {
  private step: number
  private bandwidth: number

  constructor(
    private labels: string[],
    private range: [number, number],
    /** 带内边距比例 0 ~ 1，越大每段两侧留白越多 */
    private paddingInner = 0.4
  ) {
    const span = Math.max(0, range[1] - range[0])
    this.step = labels.length > 0 ? span / labels.length : span
    this.bandwidth = this.step * clamp(1 - paddingInner, 0, 1)
  }

  /** 第 i 个类目的中心点像素坐标 */
  center(index: number): number {
    return this.range[0] + this.step * index + this.step / 2
  }

  /** 第 i 个类目条带的起始像素坐标 */
  start(index: number): number {
    return this.range[0] + this.step * index + (this.step - this.bandwidth) / 2
  }

  get bandwidth$(): number {
    return this.bandwidth
  }

  get step$(): number {
    return this.step
  }

  get labels$(): string[] {
    return this.labels
  }
}
