import { defineComponent, onBeforeUnmount, onMounted, ref } from 'vue'

/** 进入视口后才渲染默认插槽内容（一次性），用于首页卡片与详情页预览的懒挂载 */
export default defineComponent({
  name: 'LazyMount',
  props: {
    minHeight: { type: Number, default: 220 },
  },
  setup(props, { slots }) {
    const holder = ref<HTMLElement | null>(null)
    const visible = ref(false)
    let observer: IntersectionObserver | null = null

    onMounted(() => {
      if (typeof IntersectionObserver === 'undefined') {
        visible.value = true
        return
      }
      observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) {
            visible.value = true
            observer?.disconnect()
            observer = null
          }
        },
        { rootMargin: '240px 0px' },
      )
      if (holder.value) observer.observe(holder.value)
    })

    onBeforeUnmount(() => observer?.disconnect())

    return () => (
      <div ref={holder} class="lazy-mount" style={{ minHeight: `${props.minHeight}px` }}>
        {visible.value ? slots.default?.() : null}
      </div>
    )
  },
})
