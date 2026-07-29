<template>
  <view class="severity-tag" :class="'severity-' + level">
    <text>{{ label }}</text>
  </view>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  level: { type: String, default: 'mild' }
})

const levelMap = {
  mild: { label: '🟢 轻微', cls: 'mild' },
  medium: { label: '🟡 中等', cls: 'medium' },
  severe: { label: '🔴 严重', cls: 'severe' },
  healthy: { label: '✅ 健康', cls: 'healthy' }
}

const label = computed(() => levelMap[props.level]?.label || props.level)
</script>

<style scoped>
.severity-tag {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 500;
}
.severity-mild {
  background: #D1FAE5;
  color: #059669;
}
.severity-medium {
  background: #FEF3C7;
  color: #D97706;
}
.severity-severe {
  background: #FEE2E2;
  color: #DC2626;
}
.severity-healthy {
  background: #E0F2FE;
  color: #0284C7;
}
</style>
