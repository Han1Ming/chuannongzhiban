<template>
  <view class="confidence-tag" :class="'size-' + size" :style="{ background: meta.bg, borderColor: meta.border }">
    <text class="dot" :style="{ background: meta.color }" />
    <text class="tag-text" :style="{ color: meta.color }">{{ text }}</text>
  </view>
</template>

<script setup>
import { computed } from 'vue'
import { confidenceLevelOf, confidenceMeta } from '@/utils/aiTypes'

const props = defineProps({
  // 后端分级，缺失时由 confidence 数值推导
  level: { type: String, default: '' },
  // 置信度数值 0~1（或 0~100 / "87%"）
  confidence: { type: [Number, String], default: null },
  // 覆盖显示文案，如诊断接口给的 confidence_label
  label: { type: String, default: '' },
  size: { type: String, default: 'normal' },   // small | normal
  showPercent: { type: Boolean, default: true }
})

// 优先信任后端 level，其次按与后端一致的阈值推导，避免两端判定不一致
const resolvedLevel = computed(() => confidenceLevelOf(props.confidence, props.level))
const meta = computed(() => confidenceMeta(resolvedLevel.value))

const percentText = computed(() => {
  if (!props.showPercent) return ''
  const v = props.confidence
  if (v === null || v === undefined || v === '') return ''
  const num = Number(String(v).replace('%', ''))
  if (!isFinite(num)) return ''
  const normalized = num > 1 ? num : num * 100
  if (normalized > 100) return ''
  return `${normalized.toFixed(0)}%`
})

const text = computed(() => {
  const levelText = `置信度${props.label || meta.value.label}`
  return percentText.value ? `${levelText} ${percentText.value}` : levelText
})
</script>

<style scoped>
.confidence-tag {
  display: inline-flex;
  align-items: center;
  gap: 6rpx;
  border-radius: 22rpx;
  border: 1rpx solid #E8E0D4;
  align-self: flex-start;
}
.size-normal {
  padding: 6rpx 16rpx;
}
.size-small {
  padding: 2rpx 12rpx;
}
.dot {
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
  flex-shrink: 0;
}
.size-normal .tag-text {
  font-size: 22rpx;
  font-weight: 600;
}
.size-small .tag-text {
  font-size: 20rpx;
  font-weight: 500;
}
</style>
