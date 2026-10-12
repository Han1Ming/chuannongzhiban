<template>
  <view class="diagnose-card">
    <view class="card-header">
      <view class="header-left">
        <text class="file-icon">📷</text>
        <text class="file-name">{{ result.filename || '图片' }}</text>
      </view>
      <SeverityTag :level="result.severity || 'mild'" />
    </view>

    <!-- 置信度：保留原有进度条，并补充分级标签（后端 confidence_level 为准） -->
    <view class="confidence-row" v-if="hasConfidence">
      <text class="confidence-label">置信度</text>
      <view class="confidence-bar">
        <view
          class="confidence-fill"
          :style="{ width: confidencePercent + '%', background: levelMeta.color }"
        />
      </view>
      <text class="confidence-value" :style="{ color: levelMeta.color }">{{ confidencePercent }}%</text>
    </view>
    <ConfidenceTag
      class="confidence-tag-line"
      :level="payload.confidence_level"
      :confidence="payload.confidence"
      :label="result.confidence_label || ''"
    />

    <!-- 诊断 -->
    <view class="diagnosis-text" v-if="result.diagnosis">
      <text class="section-label">📋 诊断说明</text>
      <text class="section-content">{{ result.diagnosis }}</text>
    </view>
    <view class="diagnosis-text" v-else-if="result.error">
      <text class="section-content error-text">{{ result.error }}</text>
    </view>

    <!-- 症状 / 病因：后端原有的补充字段，原来漏渲染，这里补上 -->
    <view class="diagnosis-text" v-if="result.symptoms">
      <text class="section-label">🔍 识别症状</text>
      <text class="section-content">{{ result.symptoms }}</text>
    </view>
    <view class="diagnosis-text" v-if="result.cause">
      <text class="section-label">🧪 可能病因</text>
      <text class="section-content">{{ result.cause }}</text>
    </view>

    <!-- 建议 -->
    <view class="advice-box" v-if="result.advice">
      <text class="advice-icon">💡</text>
      <text class="advice-text">{{ result.advice }}</text>
    </view>

    <!-- 风险提示：顶层与处方内都有，处方卡片会自行去重，这里只在无处方时单独展示 -->
    <view class="risk-box" v-if="showStandaloneWarnings">
      <text class="section-label">⚠️ 风险提示</text>
      <view
        class="risk-item"
        v-for="(w, i) in payload.risk_warnings"
        :key="i"
        :style="{ background: riskMeta(w.level).bg }"
      >
        <text class="risk-icon">{{ riskMeta(w.level).icon }}</text>
        <view class="risk-body">
          <text class="risk-level" :style="{ color: riskMeta(w.level).color }">{{ riskMeta(w.level).label }}</text>
          <text class="risk-msg">{{ w.message }}</text>
          <text class="risk-basis" v-if="w.basis">依据：{{ w.basis }}</text>
        </view>
      </view>
    </view>

    <!-- 低置信度：展示引导且不展示处方（后端已把 prescription 置空，这里再兜一层守卫） -->
    <LowConfidenceGuide
      v-if="isLowConfidence"
      :guide="payload.need_more_info"
      @retake="onRetake"
    />

    <!-- 处方：低置信度时不渲染 -->
    <PrescriptionCard
      v-if="!isLowConfidence && payload.prescription"
      :prescription="payload.prescription"
      :risk-warnings="payload.risk_warnings"
      :sources="payload.sources"
    />

    <!-- 推理链 -->
    <ReasoningPanel v-if="payload.reasoning_chain" :chain="payload.reasoning_chain" />

    <!-- 来源：无处方时单独展示；有处方时由处方卡片的「⑤ 依据」统一承载，避免重复 -->
    <SourceList
      v-if="payload.sources.length && !payload.prescription"
      :sources="payload.sources"
    />

    <!-- 图谱路径 -->
    <GraphPathTree v-if="payload.graph_paths.length" :paths="payload.graph_paths" />
  </view>
</template>

<script setup>
import { computed } from 'vue'
import SeverityTag from '@/components/SeverityTag.vue'
import ConfidenceTag from '@/components/ai/ConfidenceTag.vue'
import LowConfidenceGuide from '@/components/ai/LowConfidenceGuide.vue'
import PrescriptionCard from '@/components/ai/PrescriptionCard.vue'
import ReasoningPanel from '@/components/ai/ReasoningPanel.vue'
import SourceList from '@/components/ai/SourceList.vue'
import GraphPathTree from '@/components/ai/GraphPathTree.vue'
import { normalizeDiagnoseResultItem, confidenceMeta, RISK_LEVELS } from '@/utils/aiTypes'

const props = defineProps({
  result: { type: Object, required: true }
})

const emit = defineEmits(['retake'])

// 页面可能直接传原始 results[i]，这里再归一化一次保证形状稳定（幂等）
const payload = computed(() => normalizeDiagnoseResultItem(props.result))

const hasConfidence = computed(() => typeof payload.value.confidence === 'number')

const confidencePercent = computed(() => {
  const c = payload.value.confidence
  if (typeof c !== 'number') return 0
  return Math.round(c * 1000) / 10
})

const levelMeta = computed(() => confidenceMeta(payload.value.confidence_level))

const isLowConfidence = computed(() => payload.value.confidence_level === 'low')

// 有处方时风险提示已由 PrescriptionCard 展示；无处方且有风险时本卡片兜底展示
const showStandaloneWarnings = computed(() =>
  payload.value.risk_warnings.length > 0 && !payload.value.prescription && !isLowConfidence.value
)

function riskMeta(level) {
  return RISK_LEVELS[level] || RISK_LEVELS.medium
}

// 把「补充照片」事件透传给页面，由页面复用现有上传/诊断流程
function onRetake(path) {
  emit('retake', path)
}
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
  margin-bottom: 6px;
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
  font-weight: 600;
  white-space: nowrap;
}
.confidence-tag-line {
  margin-bottom: 10px;
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
/* 风险提示 */
.risk-box {
  margin-top: 10rpx;
}
.risk-item {
  display: flex;
  gap: 8rpx;
  border-radius: 10rpx;
  padding: 10rpx 12rpx;
  margin-bottom: 8rpx;
}
.risk-icon { font-size: 22rpx; flex-shrink: 0; }
.risk-body { flex: 1; }
.risk-level {
  font-size: 19rpx;
  font-weight: 700;
  display: block;
}
.risk-msg {
  display: block;
  font-size: 22rpx;
  color: #2C1810;
  line-height: 1.6;
  margin-top: 2rpx;
}
.risk-basis {
  display: block;
  font-size: 18rpx;
  color: #8B7355;
  margin-top: 2rpx;
}
</style>
