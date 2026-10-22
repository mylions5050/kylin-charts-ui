import type { ChartApiDoc } from './types'
import { DOCS_A } from './docs-a'
import { DOCS_B } from './docs-b'

/** 全部图表的 API 文档（按 slug 索引） */
export const CHART_API_DOCS: Record<string, ChartApiDoc> = Object.fromEntries(
  [...DOCS_A, ...DOCS_B].map((d) => [d.slug, d])
)

export type { ChartApiDoc, ApiSection, ApiField } from './types'
