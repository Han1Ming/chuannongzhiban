<template>
  <view class="diagnose-card">
    <view class="card-header">
      <view class="header-left">
        <text class="file-icon">📷</text>
        <text class="file-name">{{ result.filename || '图片' }}</text>
      </view>
      <SeverityTag :level="result.severity || 'mild'" />
    </view>

    <!-- 置信度 -->
    <view class="confidence-row" v-if="result.confidence">
      <text class="confidence-label">置信度</text>
      <view class="confidence-bar">
        <view class="confidence-fill" :style="{ width: (result.confidence * 100) + '%' }" />
      </view>
      <text class="confidence-value">{{ (result.confidence * 100).toFixed(1) }}%</text>
    </view>

    <!-- 诊断 -->
    <view class="diagnosis-text" v-if="result.diagnosis">
      <text class="section-label">📋 诊断说明</text>
      <text class="section-content">{{ result.diagnosis }}</text>
    </view>
    <view class="diagnosis-text" v-else-if="result.error">
      <text class="section-content error-text">{{ result.error }}</text>
    </view>

    <!-- 建议 -->
    <view class="advice-box" v-if="result.advice">
      <text class="advice-icon">💡</text>
      <text class="advice-text">{{ result.advice }}</text>
    </view>
  </view>
</template>

<script setup>
import SeverityTag from './SeverityTag.vue'

defineProps({
  result: { type: Object, required: true }
})
</script>

<style scoped>
.diagnose-card {
  background: #fff;
  border-radius: 14px;
  padding: 14px;
  margin-bottom: 12px;
  box-shadow: 0 2px 12px rgba(26, 74, 46, 0.06);
  border: 1px solid #f0ece4;
}
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 6px;
}
.file-icon { font-size: 16px; }
.file-name {
  font-size: 13px;
  font-weight: 600;
  color: #2C1810;
}
.confidence-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}
.confidence-label {
  font-size: 11px;
  color: #8B7355;
  white-space: nowrap;
}
.confidence-bar {
  flex: 1;
  height: 6px;
  background: #F0ECE4;
  border-radius: 3px;
  overflow: hidden;
}
.confidence-fill {
  height: 100%;
  background: linear-gradient(90deg, #2D7A4A, #4CAF50);
  border-radius: 3px;
  transition: width 0.6s ease;
}
.confidence-value {
  font-size: 11px;
  color: #2D7A4A;
  font-weight: 600;
  white-space: nowrap;
}
.diagnosis-text {
  margin-bottom: 10px;
}
.section-label {
  font-size: 12px;
  font-weight: 600;
  color: #5C4033;
  display: block;
  margin-bottom: 4px;
}
.section-content {
  font-size: 13px;
  color: #2C1810;
  line-height: 1.6;
}
.error-text {
  color: #DC2626;
}
.advice-box {
  background: #F0F9F1;
  border-radius: 10px;
  padding: 10px 12px;
  display: flex;
  gap: 6px;
}
.advice-icon { font-size: 14px; flex-shrink: 0; }
.advice-text {
  font-size: 13px;
  color: #1A4A2E;
  line-height: 1.5;
}
</style>
