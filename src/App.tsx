import { computed, defineComponent, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useTheme } from '@/composables/use-theme'
import { CHART_GROUPS } from '@/site/registry'
import { ChartIcon } from '@/site/icons'
import KScroll from '@/components/k-scroll'

export default defineComponent({
  name: 'App',
  setup() {
    const { isDark, toggleTheme } = useTheme()
    const route = useRoute()
    const mainWrap = ref<HTMLElement | null>(null)

    // 主页是沉浸式落地页：不带后台 header/侧栏，由 HomeView 自行全屏渲染
    const isHome = computed(() => route.path === '/')

    // 路由切换时把主内容区滚回顶部（SPA 不会自动重置）
    watch(
      () => route.path,
      () => {
        const view = mainWrap.value?.querySelector('.k-scroll__view')
        if (view) view.scrollTop = 0
      }
    )

    onMounted(() => {
      const view = mainWrap.value?.querySelector('.k-scroll__view')
      if (view) view.scrollTop = 0
    })

    return () =>
      isHome.value ? (
        <router-view />
      ) : (
        <div class="app-layout">
        <header class="app-layout__header">
          <router-link to="/" class="app-layout__logo-link">
            <h1 class="app-layout__logo">KCharts</h1>
          </router-link>
          <button class="app-layout__theme-btn" type="button" onClick={toggleTheme}>
            {isDark.value ? '☀ 亮色' : '☾ 暗色'}
          </button>
        </header>
        <aside class="app-layout__sidebar">
          <KScroll class="app-layout__nav-scroll">
            <nav class="app-layout__nav">
              <router-link class="app-layout__nav-item" active-class="app-layout__nav-item--active" to="/">
                <ChartIcon name="home" />
                <span>主页</span>
              </router-link>
              <router-link class="app-layout__nav-item" active-class="app-layout__nav-item--active" to="/charts">
                <ChartIcon name="overview" />
                <span>图表总览</span>
              </router-link>
              <router-link class="app-layout__nav-item" active-class="app-layout__nav-item--active" to="/guide/install">
                <ChartIcon name="bullet-chart" />
                <span>安装指南</span>
              </router-link>
              {CHART_GROUPS.map((group) => (
                <div class="app-layout__nav-group" key={group.label}>
                  <div class="app-layout__nav-group-label">{group.label}</div>
                  {group.charts.map((chart) => (
                    <router-link
                      class="app-layout__nav-item"
                      active-class="app-layout__nav-item--active"
                      to={`/chart/${chart.slug}`}
                      key={chart.slug}
                    >
                      <ChartIcon name={chart.slug} />
                      <span>{chart.title}</span>
                    </router-link>
                  ))}
                </div>
              ))}
            </nav>
          </KScroll>
        </aside>
        <main class="app-layout__main" ref={mainWrap}>
          <KScroll class="app-layout__main-scroll">
            <router-view />
          </KScroll>
        </main>
        </div>
      )
  },
})
