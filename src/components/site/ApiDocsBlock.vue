<template>
  <section class="api-docs">
    <header class="api-docs__header">
      <span class="api-docs__title">API 使用说明</span>
      <span class="api-docs__sub">{{ doc.intro }}</span>
    </header>

    <section v-for="sec in doc.sections" :key="sec.title" class="api-docs__section">
      <h4 class="api-docs__sec-title">{{ sec.title }}</h4>
      <p v-if="sec.note" class="api-docs__sec-note">{{ sec.note }}</p>
      <div class="api-docs__table-wrap">
        <table class="api-docs__table">
          <thead>
            <tr>
              <th style="width: 200px">属性</th>
              <th style="width: 300px">类型</th>
              <th style="width: 130px">默认值</th>
              <th>说明</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="f in sec.fields" :key="sec.title + f.name">
              <td class="api-docs__name">{{ f.name }}</td>
              <td class="api-docs__type">{{ f.type }}</td>
              <td class="api-docs__def">{{ f.def ?? '—' }}</td>
              <td class="api-docs__desc">{{ f.desc }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { CHART_API_DOCS } from '@/site/api'

const props = defineProps<{ slug: string }>()

const doc = computed(() => {
  const d = CHART_API_DOCS[props.slug]
  if (!d) {
    return { intro: '暂无 API 说明', sections: [] as { title: string; note?: string; fields: never[] }[] }
  }
  return d
})
</script>

<style scoped lang="scss">
.api-docs {
  margin-top: 32px;
  padding: 24px;
  border-radius: 12px;
  background: #fff;
  border: 1px solid rgba(31, 35, 41, 0.08);

  &__header {
    display: flex;
    align-items: baseline;
    gap: 12px;
    margin-bottom: 20px;
    flex-wrap: wrap;
  }

  &__title {
    font-size: 17px;
    font-weight: 600;
    color: #1f2329;
  }

  &__sub {
    font-size: 13px;
    color: #646a73;
    line-height: 1.6;
  }

  &__section + &__section {
    margin-top: 28px;
  }

  &__sec-title {
    font-size: 15px;
    font-weight: 600;
    color: #1f2329;
    margin: 0 0 6px;
  }

  &__sec-note {
    font-size: 12.5px;
    color: #646a73;
    margin: 0 0 10px;
    line-height: 1.7;
  }

  &__table-wrap {
    overflow-x: auto;
    border-radius: 8px;
    border: 1px solid rgba(31, 35, 41, 0.08);
  }

  &__table {
    min-width: 720px;
    width: 100%;
    border-collapse: collapse;
    font-size: 12.5px;

    th {
      text-align: left;
      padding: 10px 14px;
      background: #f5f6f7;
      color: #1f2329;
      font-weight: 600;
      white-space: nowrap;
    }

    td {
      padding: 10px 14px;
      border-top: 1px solid rgba(31, 35, 41, 0.06);
      vertical-align: top;
      color: #383e47;
      line-height: 1.65;
    }
  }

  &__name {
    font-family: 'SFMono-Regular', Consolas, monospace;
    color: #3370ff;
    white-space: nowrap;
  }

  &__type {
    font-family: 'SFMono-Regular', Consolas, monospace;
    color: #d46b08;
    word-break: break-all;
  }

  &__def {
    font-family: 'SFMono-Regular', Consolas, monospace;
    color: #646a73;
    white-space: nowrap;
  }
}

html.dark .api-docs {
  background: #1d2126;
  border-color: rgba(255, 255, 255, 0.1);

  .api-docs__title,
  .api-docs__sec-title {
    color: #e8eaed;
  }

  .api-docs__sub,
  .api-docs__sec-note {
    color: #9aa0a8;
  }

  .api-docs__table-wrap {
    border-color: rgba(255, 255, 255, 0.1);
  }

  .api-docs__table th {
    background: #26292e;
    color: #e8eaed;
  }

  .api-docs__table td {
    border-top-color: rgba(255, 255, 255, 0.06);
    color: #c9cdd4;
  }

  .api-docs__name {
    color: #6b9bff;
  }

  .api-docs__type {
    color: #f0a060;
  }

  .api-docs__def {
    color: #9aa0a8;
  }
}
</style>
