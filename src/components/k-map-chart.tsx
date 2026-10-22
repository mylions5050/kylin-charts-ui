import { defineComponent, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { PropType } from 'vue'
import { MapChart } from '@/core/chart/map-chart'
import type { MapChartOption, KMapDatum } from '@/core/chart/map-chart'
import { createBem } from '@/utils/create-bem'
import { useResizeObserver } from '@/composables/use-resize-observer'
import { useTheme } from '@/composables/use-theme'
import type { HoverInfo, Padding } from '@/core/types'
import type { GeoFeatureCollection, GeoProjectionType } from '@/core/utils/geo'

const bem = createBem('k-chart')

/**
 * KMapChart 地图组件
 *
 * 职责仅三件事：响应式 props 桥接核心图表实例、title DOM 结构、tooltip。
 * 投影、路径生成、choropleth 着色、命中检测等图表逻辑全部在 core 层，组件层保持薄。
 * 悬停索引 = GeoJSON features 下标（核心层保证同源解码）。
 */
export default defineComponent({
  name: 'KMapChart',
  props: {
    /** GeoJSON 数据（FeatureCollection，由使用者提供，本库不内置行政区划数据） */
    geoJson: { type: Object as PropType<GeoFeatureCollection>, required: true },
    /** 区域数值列表（按 name 与 GeoJSON 匹配，无匹配区域用底色） */
    data: { type: Array as PropType<KMapDatum[]>, default: () => [] },
    /** 投影：linear 线性经纬度 / mercator 等角圆柱 */
    projection: { type: String as PropType<GeoProjectionType>, default: 'linear' },
    /** 经度相对纬度缩放系数（仅 linear 生效），缺省 0.75 */
    aspectScale: { type: Number, default: undefined },
    /** choropleth 色标梯度（低 → 高） */
    colorStops: { type: Array as PropType<string[]>, default: undefined },
    /** 无数据区域底色 */
    regionColor: { type: String, default: undefined },
    /** 区域名标签（缺省关闭） */
    label: { type: Boolean, default: false },
    /** 图表高度 px；不传时填满父容器（需父容器有确定高度） */
    height: { type: Number, default: undefined },
    /** 图表标题（图上方左对齐） */
    title: { type: String, default: '' },
    /** 空数据提示文案 */
    emptyText: { type: String, default: '暂无数据' },
    /** 区域点击回调（参数：GeoJSON features 下标，配合下钻等交互） */
    onRegionClick: { type: Function as PropType<(index: number) => void>, default: undefined },
    /** 画布内边距覆盖（对齐 ECharts grid 职责）：对象形态 Partial<Padding>，缺省用图表默认内边距 */
    padding: { type: Object as PropType<Partial<Padding>>, default: undefined },
  },
  setup(props) {
    const wrapRef = ref<HTMLDivElement | null>(null)
    const chartRef = ref<MapChart | null>(null)
    const { chartTheme } = useTheme()

    const buildOption = (): MapChartOption => ({
      geoJson: props.geoJson,
      data: props.data,
      projection: props.projection,
      aspectScale: props.aspectScale,
      colorStops: props.colorStops,
      regionColor: props.regionColor,
      label: { show: props.label },
      emptyText: props.emptyText,
      padding: props.padding,
      theme: chartTheme.value,
    })

    const updateChart = (): void => {
      if (!chartRef.value || !wrapRef.value) return
      chartRef.value.setOption(buildOption())
      chartRef.value.resize(wrapRef.value.clientWidth, wrapRef.value.clientHeight)
    }

    onMounted(() => {
      if (!wrapRef.value) return
      const chart = new MapChart(wrapRef.value, buildOption())
      chart.setEvents({
        onHover: handleHover,
        onClick: (index) => props.onRegionClick?.(index),
      })
      chartRef.value = chart
      updateChart()
    })

    useResizeObserver(wrapRef, (width, height) => {
      chartRef.value?.resize(width, height)
    })

    watch(
      () => [props.geoJson, props.data, props.projection, props.aspectScale, props.colorStops, props.regionColor, props.label, chartTheme],
      () => updateChart(),
      { deep: true }
    )

    onBeforeUnmount(() => {
      chartRef.value?.destroy()
      chartRef.value = null
    })

    // ---- tooltip 状态（定位锚点跟随鼠标，显示在指针左下角，对齐 ECharts 交互风格） ----
    const tipVisible = ref(false)
    const tipLabel = ref('')
    const tipValue = ref('')
    const tipStyle = ref<Record<string, string>>({})
    const mouseX = ref(0)
    const mouseY = ref(0)

    const trackPointer = (e: PointerEvent): void => {
      if (!wrapRef.value) return
      const rect = wrapRef.value.getBoundingClientRect()
      mouseX.value = e.clientX - rect.left
      mouseY.value = e.clientY - rect.top
    }

    const handleHover = (info: HoverInfo | null): void => {
      if (!info) {
        tipVisible.value = false
        return
      }
      // 悬停索引 = features 下标：区域名直接回查 GeoJSON
      const name = props.geoJson?.features?.[info.index]?.properties?.name ?? ''
      if (!name) {
        tipVisible.value = false
        return
      }
      const datum = props.data.find((d) => d.name === name)
      tipLabel.value = name
      tipValue.value = datum ? String(datum.value) : '—'

      // tooltip 定位：指针左下角（先左后下），越界时向右/向上翻转防出界
      const wrapW = wrapRef.value?.clientWidth ?? 0
      const wrapH = wrapRef.value?.clientHeight ?? 0
      const tipW = 150
      const tipH = 58
      let left = mouseX.value - tipW - 12
      if (left < 8) left = mouseX.value + 12
      left = Math.min(left, Math.max(8, wrapW - tipW - 8))
      let top = mouseY.value + 14
      if (top + tipH > wrapH - 4) top = mouseY.value - tipH - 14
      top = Math.max(top, 4)
      tipStyle.value = { left: `${Math.round(left)}px`, top: `${Math.round(top)}px` }
      tipVisible.value = true
    }

    return () => (
      <div class={bem()} style={props.height != null ? { height: `${props.height}px` } : { height: '100%' }}>
        {props.title && (
          <div class={bem.e('header')}>
            <span class={bem.e('title')}>{props.title}</span>
          </div>
        )}
        <div class={bem.e('canvas')} ref={wrapRef} onPointermove={trackPointer}>
          <div class={[bem.e('tooltip'), tipVisible.value ? '' : bem.em('tooltip', 'hidden')]} style={tipStyle.value}>
            <div class={bem.e('tooltip-label')}>{tipLabel.value}</div>
            <div class={bem.e('tooltip-rows')}>
              <div class={bem.e('tooltip-row')}>
                <span class={bem.e('tooltip-name')}>数值</span>
                <span class={bem.e('tooltip-value')}>{tipValue.value}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  },
})
