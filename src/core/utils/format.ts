/**
 * 数值文案格式化工具
 *
 * 场景：坐标轴刻度 / 数据标签的自定义文案。
 * 典型用法（大数据量 y 轴中文数量级）：
 *   <KLineChart :y-axis="{ labelFormatter: (v) => formatCnNumber(v) }" ... />
 *   // 10000 -> 1万    150000 -> 15万    1234567 -> 123.46万    2.5亿 -> 2.5亿
 */

/** 千分位整数（小数按原样保留最多 2 位） */
export function formatThousand(v: number): string {
  if (!Number.isFinite(v)) return String(v)
  const [int, dec] = String(v).split('.')
  const withSep = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return dec ? `${withSep}.${dec}` : withSep
}

/** 去尾零的小数（最多 digits 位） */
function trimNum(v: number, digits: number): string {
  return String(Number(v.toFixed(digits)))
}

/**
 * 中文数量级格式化：>=1e8 用「亿」，>=1e4 用「万」，其余千分位。
 * @param v 数值
 * @param digits 数量级部分保留的小数位（默认 2，自动去尾零）
 */
export function formatCnNumber(v: number, digits = 2): string {
  if (!Number.isFinite(v)) return String(v)
  const abs = Math.abs(v)
  if (abs >= 1e8) return `${trimNum(v / 1e8, digits)}亿`
  if (abs >= 1e4) return `${trimNum(v / 1e4, digits)}万`
  return formatThousand(v)
}
