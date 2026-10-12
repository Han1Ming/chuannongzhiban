<template>
  <!--
    置信度徽章：全站唯一口径，渲染成「置信度 75.6% · 中」这样一行紧凑胶囊。
    需求已废弃黄绿粗进度条，因此任何位置都不再画条形图。
    缺数值时退化为「置信度 · 中」，缺等级时兜底 unknown（灰），组件本身不会空转。
  -->
  <span
    class="confidence-tag inline-flex items-center gap-1 rounded-full font-medium whitespace-nowrap"
    :style="{
      background: style.bg,
      color: style.color,
      border: `1px solid ${style.color}22`,
      fontSize: size === 'small' ? '11px' : '12px',
      padding: size === 'small' ? '1px 8px' : '2px 10px',
    }"
    :title="title"
  >
    <span class="dot" :style="{ background: style.color }"></span>
    <span v-if="percent">置信度 <span class="font-mono">{{ percent }}</span> · {{ style.label }}</span>
    <span v-else>置信度 · {{ style.label }}</span>
  </span>
</template>

<script setup>
import { computed } from 'vue'
import { confidenceLabelOf, confidenceStyleOf, formatConfidence } from '@/utils/aiTypes'

// 纯展示组件：只按 level/confidence 出样式，不做任何降级请求
const props = defineProps({
  level: { type: String, default: 'unknown' },
  confidence: { type: [Number, String], default: null },
  size: { type: String, default: 'default' },
})

const style = computed(() => confidenceStyleOf(props.level))
const percent = computed(() => formatConfidence(props.confidence))
// tooltip 用长标签（「中置信度」），与胶囊上的短标签（「中」）互补，避免鼠标悬停只看到重复信息
const title = computed(() =>
  percent.value
    ? `置信度 ${percent.value}（${confidenceLabelOf(props.level)}）`
    : confidenceLabelOf(props.level),
)
</script>

<style scoped>
.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}
</style>
