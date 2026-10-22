import type { SeriesDatum } from '../types'

/**
 * 系列数据归一化
 *
 * series.data 支持双形态（对齐 ECharts 心智）：
 * - 裸值：      120 / null
 * - 携带配置：  { value: 120, color: '#F5455C', label: { show: true }, meta: {...} }
 *
 * 图表绘制逻辑只面对 NormalizedDatum 统一模型，两种形态在此收口。
 */

export interface NormalizedDatum {
  /** 数据值（null 表示断点 / 无效值） */
  value: number | null
  /** 点级颜色（覆盖系列色，作用于高亮点 / 标签） */
  color?: string
  /** 是否显示点级文本标签 */
  labelShow?: boolean
  /** 业务数据透传（点击 / 悬停事件回调原样带回） */
  meta?: Record<string, unknown>
}

const NULL_DATUM: NormalizedDatum = { value: null }

export function normalizeDatum(datum: SeriesDatum | undefined): NormalizedDatum {
  if (datum === null || datum === undefined) return NULL_DATUM
  if (typeof datum === 'number') {
    return Number.isFinite(datum) ? { value: datum } : NULL_DATUM
  }
  if (typeof datum === 'object') {
    const { value } = datum
    const valid = value !== null && value !== undefined && Number.isFinite(value)
    return {
      value: valid ? value : null,
      color: datum.color,
      labelShow: datum.label?.show,
      meta: datum.meta,
    }
  }
  return NULL_DATUM
}

export function normalizeData(data: readonly SeriesDatum[]): NormalizedDatum[] {
  return data.map(normalizeDatum)
}
