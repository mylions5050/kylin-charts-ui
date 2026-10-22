/**
 * API 文档元数据类型
 *
 * 设计：文档数据与渲染分离。每个图表一份 ChartApiDoc，
 * ApiDocsBlock 按 slug 渲染成「说明 + 分组表格」。
 * 以后新增 / 修改 props，只需同步改这里一处。
 */

/** 一行文档字段 */
export interface ApiField {
  /** 属性 / 字段名 */
  name: string
  /** TS 类型（简化书写，保证可读） */
  type: string
  /** 默认值（必填写 '必填'，无写 '—'） */
  def?: string
  /** 说明：详细、通俗易懂 */
  desc: string
}

/** 一组文档（渲染为小标题 + 表格） */
export interface ApiSection {
  /** 分组标题，如「组件 Props」「轴配置 KAxisOption」 */
  title: string
  /** 分组补充说明（渲染在标题下的小字） */
  note?: string
  fields: ApiField[]
}

/** 单个图表的 API 文档 */
export interface ChartApiDoc {
  /** 与路由 slug 一致，如 'line-chart' */
  slug: string
  /** 一句话定位说明（渲染在文档最上方） */
  intro: string
  sections: ApiSection[]
}
