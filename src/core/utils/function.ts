/**
 * 函数绘图采样：把 (x) => y 函数在 [x0, x1] 上均匀采样成折线图数据。
 * 返回的 labels 为数值字符串（配合 numericX 数值 x 轴使用），非有限值记为 null 断点。
 */
export interface FunctionSample {
  labels: string[]
  data: (number | null)[]
}

export function sampleFunction(
  fn: (x: number) => number,
  x0: number,
  x1: number,
  count = 60
): FunctionSample {
  const labels: string[] = []
  const data: (number | null)[] = []
  for (let i = 0; i < count; i++) {
    const x = x0 + ((x1 - x0) * i) / Math.max(1, count - 1)
    labels.push(String(Number(x.toFixed(2))))
    const y = fn(x)
    data.push(Number.isFinite(y) ? Number(y.toFixed(4)) : null)
  }
  return { labels, data }
}
