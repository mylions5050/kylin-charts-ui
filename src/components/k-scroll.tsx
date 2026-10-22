import { defineComponent } from 'vue'

/**
 * KScroll 滚动容器：原生滚动 + ::-webkit-scrollbar 纯 CSS 定制。
 *
 * 拇指由浏览器合成器直接绘制、与主线程无关，滚动表现与原生完全一致
 * （无 scroll 监听 / rAF / 响应式重渲染开销）；Firefox 走
 * scrollbar-width + scrollbar-color 降级（无圆角与 hover 变深）。
 * 组件填满父容器（父容器需有确定高度），内容放入默认插槽。
 */
export default defineComponent({
  name: 'KScroll',
  setup(_, { slots }) {
    return () => (
      <div class="k-scroll">
        <div class="k-scroll__view">{slots.default?.()}</div>
      </div>
    )
  },
})
