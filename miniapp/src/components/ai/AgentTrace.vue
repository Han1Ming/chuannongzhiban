<template>
  <!-- agent_trace 缺失时整体不渲染（小程序端链路展示是辅助信息，不占位） -->
  <view class="agent-trace" v-if="trace && (trace.steps.length || trace.final_agent)">
    <view class="trace-header" @tap="expanded = !expanded">
      <text class="trace-title">🧭 任务链路</text>
      <text class="trace-elapsed" v-if="trace.elapsed_ms">{{ (trace.elapsed_ms / 1000).toFixed(1) }}s</text>
      <text class="trace-arrow" :class="{ open: expanded }">▾</text>
    </view>

    <view class="trace-body" v-if="expanded">
      <!-- 降级提示：多智能体不可用时说明原因，避免用户以为结果不完整 -->
      <view class="trace-degraded" v-if="trace.degraded">
        <text class="degraded-text">⚠️ 本次已降级处理{{ trace.error ? '：' + trace.error : '' }}</text>
      </view>

      <!-- 圆点时间轴 -->
      <view class="trace-steps">
        <view class="step-row" v-for="(s, i) in trace.steps" :key="i">
          <view class="step-rail">
            <view class="step-dot" :class="'dot-' + s.status" />
            <view class="step-line" v-if="i < trace.steps.length - 1" />
          </view>
          <view class="step-body">
            <view class="step-head">
              <text class="step-name">{{ agentLabel(s.agent) }}</text>
              <text class="step-time" v-if="s.elapsed_ms">{{ s.elapsed_ms }}ms</text>
            </view>
            <text class="step-summary" v-if="s.summary">{{ s.summary }}</text>
          </view>
        </view>
      </view>

      <view class="trace-final" v-if="trace.final_agent">
        <text class="final-label">最终输出</text>
        <text class="final-value">{{ agentLabel(trace.final_agent) }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { agentLabel } from '@/utils/aiTypes'

const props = defineProps({
  // normalizePayload 后的 agent_trace，可能为 null
  trace: { type: Object, default: null },
  defaultExpanded: { type: Boolean, default: false }
})

// 链路属辅助信息，默认收起，避免占用气泡空间
const expanded = ref(props.defaultExpanded)

const trace = computed(() => {
  const t = props.trace
  if (!t || typeof t !== 'object') return null
  return {
    ...t,
    steps: Array.isArray(t.steps) ? t.steps : []
  }
})
</script>

<style scoped>
.agent-trace {
  background: #FDF8F3;
  border: 1rpx solid #E8E0D4;
  border-radius: 12rpx;
  padding: 16rpx;
  margin-top: 12rpx;
}
.trace-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10rpx;
}
.trace-header:active {
  opacity: 0.7;
}
.trace-title {
  font-size: 24rpx;
  font-weight: 600;
  color: #5C4033;
  flex: 1;
}
.trace-elapsed {
  font-size: 20rpx;
  color: #8B7355;
}
.trace-arrow {
  font-size: 22rpx;
  color: #8B7355;
  transition: transform 0.2s;
}
.trace-arrow.open {
  transform: rotate(180deg);
}
.trace-degraded {
  background: #FDF3E3;
  border-radius: 8rpx;
  padding: 8rpx 12rpx;
  margin-top: 12rpx;
}
.degraded-text {
  font-size: 20rpx;
  color: #E6A23C;
  line-height: 1.5;
}
.trace-steps {
  display: flex;
  flex-direction: column;
  margin-top: 12rpx;
}
.step-row {
  display: flex;
  gap: 12rpx;
}
.step-rail {
  width: 16rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 8rpx;
}
.step-dot {
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
  background: #2D7A4A;
  flex-shrink: 0;
}
.dot-running {
  background: #E6A23C;
}
.dot-error,
.dot-failed {
  background: #DC2626;
}
.dot-skipped {
  background: #C4A882;
}
.step-line {
  flex: 1;
  width: 2rpx;
  background: #E8E0D4;
  margin: 4rpx 0;
  min-height: 24rpx;
}
.step-body {
  flex: 1;
  padding-bottom: 16rpx;
}
.step-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.step-name {
  font-size: 24rpx;
  color: #2C1810;
  font-weight: 500;
}
.step-time {
  font-size: 20rpx;
  color: #C4A882;
}
.step-summary {
  font-size: 22rpx;
  color: #8B7355;
  line-height: 1.5;
  margin-top: 4rpx;
}
.trace-final {
  display: flex;
  align-items: center;
  gap: 10rpx;
  padding-top: 12rpx;
  border-top: 1rpx solid #E8E0D4;
}
.final-label {
  font-size: 22rpx;
  color: #8B7355;
}
.final-value {
  font-size: 22rpx;
  font-weight: 600;
  color: #2D7A4A;
}
</style>
