import { createRouter, createWebHashHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { findChart } from '@/site/registry'
import HomeView from '@/views/HomeView.vue'
import OverviewView from '@/views/OverviewView.vue'
import ChartDetailView from '@/views/ChartDetailView.vue'
import InstallGuideView from '@/views/InstallGuideView.vue'

/** 路由表：落地页主页 + 图表总览 + /chart/:slug 动态详情页，demo 内容由 registry 自动收集 */
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: HomeView,
  },
  {
    path: '/charts',
    name: 'Overview',
    component: OverviewView,
  },
  {
    path: '/guide/install',
    name: 'InstallGuide',
    component: InstallGuideView,
  },
  {
    path: '/chart/:slug',
    name: 'ChartDetail',
    component: ChartDetailView,
    beforeEnter: (to) => {
      // 未知图表 slug 一律回主页
      if (!findChart(String(to.params.slug))) return { path: '/' }
    },
  },
  // 兼容旧扁平地址：/#/line-chart → /#/chart/line-chart
  {
    path: '/:slug',
    redirect: (to) => {
      const slug = String(to.params.slug)
      return findChart(slug) ? `/chart/${slug}` : '/'
    },
  },
]

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
})
