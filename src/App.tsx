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

    // 手机端抽屉侧栏开关（≤768px 生效，桌面端由 CSS 隐藏入口）
    const menuOpen = ref(false)

    // 主页是沉浸式落地页：不带后台 header/侧栏，由 HomeView 自行全屏渲染
    const isHome = computed(() => route.path === '/')

    // 路由切换时把主内容区滚回顶部（SPA 不会自动重置），并收起手机抽屉菜单
    watch(
      () => route.path,
      () => {
        menuOpen.value = false
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
      <div class={['app-layout', { 'app-layout--menu-open': menuOpen.value }]}>
        <header class="app-layout__header">
          <div class="app-layout__header-left">
            <button
              class="app-layout__menu-btn"
              type="button"
              aria-label="切换导航菜单"
              onClick={() => (menuOpen.value = !menuOpen.value)}
            >
              <span class="app-layout__menu-line" />
              <span class="app-layout__menu-line" />
              <span class="app-layout__menu-line" />
            </button>
            <router-link to="/" class="app-layout__logo-link">
              <h1 class="app-layout__logo">KCharts</h1>
            </router-link>
          </div>
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
        {menuOpen.value && (
          <div class="app-layout__overlay" onClick={() => (menuOpen.value = false)} />
        )}
        <main class="app-layout__main" ref={mainWrap}>
          <KScroll class="app-layout__main-scroll">
            <router-view />
          </KScroll>
        </main>
        </div>
      )
  },
})
