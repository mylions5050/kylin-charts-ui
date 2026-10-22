<script setup lang="ts">
import KBulletChart from '@/components/k-bullet-chart'
import type { KBulletDatum } from '@/core/types'

/** 演示数据：实际值 + 目标值 + 缺省单段量程 */
const DATA: KBulletDatum[] = [
  { name: '营收达成', value: 82, target: 90, unit: '%' },
  { name: '利润达成', value: 64, target: 70, unit: '%' },
]
</script>

<template>
  <section class="demo-page__block">
    <div class="demo-page__block-header">
      <span>基础子弹图</span>
      <span>灰阶分段底带 + 彩色实际值条 + 目标值竖线，一行看全「实际/目标/量程」</span>
    </div>
    <div class="demo-page__block-body" style="height: 170px">
      <KBulletChart :data="DATA" />
    </div>
  </section>
</template>
