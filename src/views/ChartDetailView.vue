<template>
  <div v-if="chart" class="detail-page">
    <header class="detail-page__header">
      <h1 class="detail-page__title">{{ chart.title }}</h1>
      <span class="detail-page__meta">共 {{ demos.length }} 个测试用例</span>
      <button type="button" class="detail-page__action-btn detail-page__api-btn" @click="apiOpen = true">
        API 使用说明
      </button>
    </header>
    <section v-for="demo in demos" :key="demo.key" class="detail-page__card">
      <div class="detail-page__card-header">
        <div class="detail-page__card-titles">
          <span class="detail-page__card-title">{{ demo.title }}</span>
          <span v-if="demo.desc" class="detail-page__card-desc">{{ demo.desc }}</span>
        </div>
        <div class="detail-page__card-actions">
          <button type="button" class="detail-page__action-btn" @click="toggleCollapse(demo)">
            {{ collapsed.has(demo.key) ? '展开代码' : '收起代码' }}
          </button>
          <button type="button" class="detail-page__action-btn" @click="copySource(demo)">
            {{ copiedKey === demo.key ? '已复制' : '复制代码' }}
          </button>
        </div>
      </div>
      <div
        class="detail-page__card-body"
        :class="{ 'detail-page__card-body--no-code': collapsed.has(demo.key) }"
      >
        <KScroll v-show="!collapsed.has(demo.key)" class="detail-page__code">
          <pre class="detail-page__code-pre"><code class="hljs" v-html="highlightXml(demo.source)"></code></pre>
        </KScroll>
        <div class="detail-page__preview">
          <LazyMount :min-height="280">
            <component :is="demo.component" />
          </LazyMount>
        </div>
      </div>
    </section>

    <Teleport to="body">
      <Transition name="api-drawer">
        <div v-if="apiOpen" class="api-drawer" @click.self="apiOpen = false">
          <aside class="api-drawer__panel" role="dialog" aria-modal="true" aria-label="API 使用说明">
            <div class="api-drawer__bar">
              <span class="api-drawer__title">{{ chart.title }} · API 使用说明</span>
              <button type="button" class="api-drawer__close" aria-label="关闭" @click="apiOpen = false">
                <ChartIcon name="close" />
              </button>
            </div>
            <KScroll class="api-drawer__scroll">
              <div class="api-drawer__body">
                <ApiDocsBlock :slug="chart.slug" />
              </div>
            </KScroll>
          </aside>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import hljs from 'highlight.js/lib/core'
import xml from 'highlight.js/lib/languages/xml'
import { findChart, getDemos } from '@/site/registry'
import type { DemoMeta } from '@/site/registry'
import LazyMount from '@/site/LazyMount'
import KScroll from '@/components/k-scroll'
import { ChartIcon } from '@/site/icons'
import ApiDocsBlock from '@/components/site/ApiDocsBlock.vue'

hljs.registerLanguage('xml', xml)

const route = useRoute()
const chart = computed(() => findChart(String(route.params.slug)))
const demos = computed(() => (chart.value ? getDemos(chart.value.slug) : []))

/** SFC 以模板标签为主，按 xml 语法高亮 */
function highlightXml(source: string): string {
  return hljs.highlight(source, { language: 'xml' }).value
}

const copiedKey = ref('')
let copyTimer: ReturnType<typeof setTimeout> | null = null
async function copySource(demo: DemoMeta) {
  try {
    await navigator.clipboard.writeText(demo.source)
    copiedKey.value = demo.key
    if (copyTimer) clearTimeout(copyTimer)
    copyTimer = setTimeout(() => {
      copiedKey.value = ''
    }, 1600)
  } catch {
    // 剪贴板不可用时静默忽略
  }
}

// 默认收起全部代码（效果优先，代码按需展开）；切图时重置回全收起
const collapsed = ref(new Set<string>(demos.value.map((d) => d.key)))
function toggleCollapse(demo: DemoMeta) {
  const next = new Set(collapsed.value)
  if (next.has(demo.key)) next.delete(demo.key)
  else next.add(demo.key)
  collapsed.value = next
}

// ============ API 文档抽屉 ============
const apiOpen = ref(false)

/** 打开期间锁定背景滚动，切图时自动关闭 */
watch(apiOpen, (open) => {
  document.body.style.overflow = open ? 'hidden' : ''
})
watch(
  () => route.params.slug,
  () => {
    apiOpen.value = false
    collapsed.value = new Set(demos.value.map((d) => d.key))
  }
)
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') apiOpen.value = false
}
onMounted(() => window.addEventListener('keydown', onKeydown))

onBeforeUnmount(() => {
  if (copyTimer) clearTimeout(copyTimer)
  window.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
})
</script>

<style scoped lang="scss">
.detail-page__api-btn {
  // 固定钉在顶部 header（fixed 56px）下方右上角，不随页面滚动
  position: fixed;
  top: 72px;
  right: 24px;
  z-index: 150;
  border-color: transparent;
  background: #7c5cfc;
  color: #fff;
  box-shadow: 0 2px 8px rgba(124, 92, 252, 0.35);

  &:hover {
    border-color: transparent;
    background: #6a4be0;
    color: #fff;
  }
}

// 暗色下全局 action-btn 字色覆盖优先级更高，这里压回白字紫底
html.dark .detail-page__api-btn,
html.dark .detail-page__api-btn:hover {
  border-color: transparent;
  background: #7c5cfc;
  color: #fff;
}

.api-drawer {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(15, 18, 22, 0.45);

  &__panel {
    position: absolute;
    top: 0;
    right: 0;
    height: 100%;
    width: 80vw;
    max-width: 1100px;
    display: flex;
    flex-direction: column;
    background: #fff;
    box-shadow: -8px 0 24px rgba(0, 0, 0, 0.12);
  }

  &__bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 14px 24px;
    border-bottom: 1px solid rgba(31, 35, 41, 0.08);
    flex-shrink: 0;
  }

  &__title {
    font-size: 15px;
    font-weight: 600;
    color: #1f2329;
  }

  &__close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    padding: 0;
    border: none;
    border-radius: 8px;
    background: transparent;
    color: #646a73;
    cursor: pointer;
    transition: background 0.2s, color 0.2s;

    .chart-icon {
      width: 18px;
      height: 18px;
    }

    &:hover {
      background: rgba(29, 33, 41, 0.06);
      color: #1f2329;
    }
  }

  &__scroll {
    flex: 1;
    min-height: 0;
  }

  &__body {
    padding: 0 24px 32px;

    .api-docs {
      margin-top: 0;
      border: none;
      background: transparent;
      padding: 16px 0 0;
    }
  }
}

// 过渡：遮罩淡入 + 面板右滑
.api-drawer-enter-active,
.api-drawer-leave-active {
  transition: opacity 0.25s ease;

  .api-drawer__panel {
    transition: transform 0.25s ease;
  }
}

.api-drawer-enter-from,
.api-drawer-leave-to {
  opacity: 0;

  .api-drawer__panel {
    transform: translateX(100%);
  }
}

html.dark {
  .api-drawer {
    background: rgba(0, 0, 0, 0.55);
  }

  .api-drawer__panel {
    background: #1d2126;
  }

  .api-drawer__bar {
    border-bottom-color: rgba(255, 255, 255, 0.1);
  }

  .api-drawer__title {
    color: #e8eaed;
  }

  .api-drawer__close {
    color: #9aa0a8;

    &:hover {
      background: rgba(255, 255, 255, 0.1);
      color: #fff;
    }
  }
}
</style>
