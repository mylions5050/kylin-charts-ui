/**
 * 深度合并工具（setOption 增量更新的地基）
 *
 * 合并规则（对齐 ECharts 的心智，但更简单可预测）：
 * - 普通对象：递归合并
 * - 数组：整体替换（不做按索引合并，避免"数组越 merge 越长"的诡异行为）
 * - source 中的 undefined：跳过，保留 target 原值
 * - 非普通对象（数字/字符串/类实例等）：直接替换
 */

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.getPrototypeOf(value) === Object.prototype
  )
}

export function deepMerge<T>(target: T, source: Partial<T> | undefined): T {
  if (source === undefined) return target
  if (!isPlainObject(target) || !isPlainObject(source)) {
    return source as T
  }
  const result: Record<string, unknown> = { ...(target as Record<string, unknown>) }
  for (const key of Object.keys(source as Record<string, unknown>)) {
    const sourceVal = (source as Record<string, unknown>)[key]
    if (sourceVal === undefined) continue
    result[key] =
      isPlainObject(sourceVal) && isPlainObject(result[key])
        ? deepMerge(result[key], sourceVal)
        : sourceVal
  }
  return result as T
}
