<template>
  <view class="rx-card">
    <view class="rx-head">
      <text class="rx-icon">📋</text>
      <text class="rx-title">防治处方</text>
      <ConfidenceTag :level="rx.confidence_level" :confidence="rx.confidence" size="small" />
    </view>

    <!-- ① 诊断 -->
    <view class="section">
      <text class="section-title">① 诊断</text>
      <view class="dx-line">
        <text class="dx-name">{{ rx.diagnosis || '未明确诊断' }}</text>
        <SeverityTag v-if="rx.severity" :level="severityLevel" />
      </view>
      <view class="dx-meta" v-if="metaLine">
        <text class="meta-text">{{ metaLine }}</text>
      </view>
      <view class="fitness" v-if="rx.fitness_check.length">
        <view class="fitness-item" v-for="(f, i) in rx.fitness_check" :key="i">
          <text class="fitness-icon">{{ f.passed ? '✅' : '⚠️' }}</text>
          <text class="fitness-text">{{ f.item }}{{ f.detail ? '：' + f.detail : '' }}</text>
        </view>
      </view>
    </view>

    <!-- ② 措施：移动端用有序列表，不用表格 -->
    <view class="section" v-if="rx.immediate_actions.length">
      <text class="section-title">② 立即措施</text>
      <view class="action-item" v-for="(a, i) in rx.immediate_actions" :key="'a' + i">
        <view class="step-badge">
          <text class="step-num">{{ a.step || i + 1 }}</text>
        </view>
        <view class="action-body">
          <view class="action-head">
            <text class="action-name">{{ a.action }}</text>
            <text class="action-timing" v-if="a.timing">{{ a.timing }}</text>
          </view>
          <text class="action-detail" v-if="a.detail">{{ a.detail }}</text>
          <text class="action-method" v-if="a.method">方式：{{ a.method }}</text>
          <view class="chem-box" v-if="a.chemicals.length">
            <view class="chem-item" v-for="(c, j) in a.chemicals" :key="'c' + j">
              <text class="chem-name">{{ c.name }}</text>
              <text class="chem-spec" v-if="c.spec">{{ c.spec }}</text>
              <text class="chem-dosage" v-if="c.dosage">用量：{{ c.dosage }}</text>
              <text class="chem-method" v-if="c.method">用法：{{ c.method }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <view class="section" v-if="rx.follow_up.length">
      <text class="section-title">后续管理</text>
      <view class="action-item" v-for="(a, i) in rx.follow_up" :key="'f' + i">
        <view class="step-badge follow">
          <text class="step-num">{{ a.step || i + 1 }}</text>
        </view>
        <view class="action-body">
          <view class="action-head">
            <text class="action-name">{{ a.action }}</text>
            <text class="action-timing" v-if="a.timing">{{ a.timing }}</text>
          </view>
          <text class="action-detail" v-if="a.detail">{{ a.detail }}</text>
        </view>
      </view>
    </view>

    <!-- ③ 成本：纵向卡片，窄屏不溢出 -->
    <view class="section" v-if="cost">
      <text class="section-title">③ 成本预估</text>
      <view class="cost-card" v-for="(it, i) in cost.items" :key="'ci' + i">
        <view class="cost-line">
          <text class="cost-name">{{ it.name }}</text>
          <text class="cost-sub" v-if="it.subtotal !== null">{{ it.subtotal }} 元</text>
        </view>
        <text class="cost-spec" v-if="it.spec">{{ it.spec }}</text>
        <view class="cost-detail">
          <text class="cost-kv" v-if="it.unit_price !== null">单价 {{ it.unit_price }}{{ it.unit ? ' ' + it.unit : '' }}</text>
          <text class="cost-kv" v-if="it.quantity !== null">数量 {{ it.quantity }}</text>
        </view>
        <text class="cost-source" v-if="it.pricing_source">定价来源：{{ it.pricing_source }}</text>
      </view>

      <view class="cost-card" v-if="cost.labor">
        <view class="cost-line">
          <text class="cost-name">人工</text>
          <text class="cost-sub" v-if="cost.labor.subtotal !== null">{{ cost.labor.subtotal }} 元</text>
        </view>
        <view class="cost-detail">
          <text class="cost-kv" v-if="cost.labor.hours !== null">工时 {{ cost.labor.hours }} 小时</text>
          <text class="cost-kv" v-if="cost.labor.rate !== null">工价 {{ cost.labor.rate }} 元/小时</text>
        </view>
        <text class="cost-source" v-if="cost.labor.operations.length">作业：{{ cost.labor.operations.join('、') }}</text>
      </view>

      <view class="cost-total" v-if="cost.total !== null">
        <text class="total-label">合计</text>
        <text class="total-value">{{ cost.total }} {{ currencyText }}</text>
        <text class="total-unit" v-if="cost.area_mu">/ {{ cost.area_mu }} 亩</text>
      </view>

      <text class="cost-note" v-if="cost.note">{{ cost.note }}</text>

      <!-- 成本口径必须显式展示，否则会被当成真实报价 -->
      <view class="cost-disclaimer">
        <text class="disclaimer-text">数据来源：{{ cost.data_source || '未标注' }}</text>
        <text class="disclaimer-warn">{{ COST_PRICE_NOTE }}</text>
      </view>
    </view>

    <!-- ④ 风险 -->
    <view class="section" v-if="mergedWarnings.length">
      <text class="section-title">④ 风险提示</text>
      <view
        class="risk-item"
        v-for="(w, i) in mergedWarnings"
        :key="'r' + i"
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

    <!-- ⑤ 依据 -->
    <view class="section" v-if="hasAnySource">
      <text class="section-title">⑤ 依据</text>
      <!-- 有三路通道时按「本地知识库/知识图谱/联网搜索」分节展示源文字 -->
      <SourceList :sources="mergedSources" :channels="channels" />
    </view>

    <!-- 校验状态：validation_errors 非空说明结构化校验发现问题，必须暴露给用户 -->
    <view class="validate-box" v-if="rx.validation_errors.length">
      <text class="validate-text" v-for="(e, i) in rx.validation_errors" :key="i">⚠️ {{ e }}</text>
    </view>
    <text class="generated-by" v-if="rx.generated_by">处方生成方式：{{ generatedByText }}</text>
  </view>
</template>

<script setup>
import { computed } from 'vue'
import ConfidenceTag from './ConfidenceTag.vue'
import SourceList from './SourceList.vue'
import SeverityTag from '@/components/SeverityTag.vue'
import { RISK_LEVELS, GENERATED_BY_LABELS, COST_PRICE_NOTE } from '@/utils/aiTypes'

const props = defineProps({
  // normalizePrescription 结果
  prescription: { type: Object, required: true },
  // 顶层风险提示，处方内没有时作为兜底
  riskWarnings: { type: Array, default: () => [] },
  // 顶层来源，处方内没有时作为兜底
  sources: { type: Array, default: () => [] },
  // 三路检索分组结果（本地知识库/知识图谱/联网搜索），有值时依据区按通道分节
  channels: { type: Array, default: () => [] }
})

const rx = computed(() => {
  const p = props.prescription || {}
  return {
    diagnosis: p.diagnosis || '',
    severity: p.severity || '',
    confidence: p.confidence,
    confidence_level: p.confidence_level || 'unknown',
    crop: p.crop || '',
    region: p.region || '',
    season: p.season || '',
    immediate_actions: Array.isArray(p.immediate_actions) ? p.immediate_actions : [],
    follow_up: Array.isArray(p.follow_up) ? p.follow_up : [],
    cost_estimate: p.cost_estimate || null,
    risk_warnings: Array.isArray(p.risk_warnings) ? p.risk_warnings : [],
    fitness_check: Array.isArray(p.fitness_check) ? p.fitness_check : [],
    validated: p.validated === true,
    validation_errors: Array.isArray(p.validation_errors) ? p.validation_errors : [],
    generated_by: p.generated_by || ''
  }
})

// 后端 severity 用「轻度/中度/重度」，SeverityTag 用 mild/medium/severe，这里做映射
const severityLevel = computed(() => {
  const s = rx.value.severity
  if (!s) return 'mild'
  if (s.includes('轻') || s === 'mild') return 'mild'
  if (s.includes('重') || s === 'severe') return 'severe'
  if (s.includes('健康') || s === 'healthy') return 'healthy'
  return 'medium'
})

const metaLine = computed(() => {
  const parts = []
  if (rx.value.crop) parts.push(`作物：${rx.value.crop}`)
  if (rx.value.region) parts.push(`地区：${rx.value.region}`)
  if (rx.value.season) parts.push(`季节：${rx.value.season}`)
  return parts.join(' · ')
})

const cost = computed(() => rx.value.cost_estimate)

const currencyText = computed(() => (cost.value?.currency === 'USD' ? 'USD' : '元'))

// 处方内风险为空时用顶层风险，避免同一份数据两处都不显示
const mergedWarnings = computed(() =>
  rx.value.risk_warnings.length ? rx.value.risk_warnings : (props.riskWarnings || [])
)

const mergedSources = computed(() => {
  const own = props.prescription?.sources
  if (Array.isArray(own) && own.length) return own
  return props.sources || []
})

/**
 * 依据区是否有内容可展示。
 * 有三路通道时以通道为准：通道为空但带状态说明（"无结果/未启用/调用失败"）也算有内容，
 * 否则农户看不到"这一路查了但没有结果"这条信息。
 */
const hasAnySource = computed(() => {
  if (props.channels?.length) return props.channels.some((c) => c.has_content)
  return mergedSources.value.length > 0
})

const generatedByText = computed(() =>
  GENERATED_BY_LABELS[rx.value.generated_by] || rx.value.generated_by
)

function riskMeta(level) {
  return RISK_LEVELS[level] || RISK_LEVELS.medium
}
</script>

<style scoped>
.rx-card {
  background: #fff;
  border: 1rpx solid #E8E0D4;
  border-left: 6rpx solid #2D7A4A;
  border-radius: 12rpx;
  padding: 16rpx;
  margin-top: 12rpx;
}
.rx-head {
  display: flex;
  align-items: center;
  gap: 8rpx;
  margin-bottom: 12rpx;
}
.rx-icon { font-size: 26rpx; }
.rx-title {
  font-size: 26rpx;
  font-weight: 700;
  color: #1A4A2E;
  flex: 1;
}
.section {
  margin-bottom: 16rpx;
}
.section-title {
  font-size: 23rpx;
  font-weight: 700;
  color: #2D7A4A;
  display: block;
  margin-bottom: 8rpx;
}
.dx-line {
  display: flex;
  align-items: center;
  gap: 10rpx;
}
.dx-name {
  font-size: 26rpx;
  font-weight: 600;
  color: #2C1810;
}
.dx-meta {
  margin-top: 4rpx;
}
.meta-text {
  font-size: 20rpx;
  color: #8B7355;
}
.fitness {
  margin-top: 8rpx;
}
.fitness-item {
  display: flex;
  gap: 6rpx;
  margin-bottom: 4rpx;
}
.fitness-icon { font-size: 20rpx; }
.fitness-text {
  flex: 1;
  font-size: 21rpx;
  color: #5C4033;
  line-height: 1.5;
}

/* 措施：有序列表 + 步骤徽标 */
.action-item {
  display: flex;
  gap: 10rpx;
  margin-bottom: 12rpx;
}
.step-badge {
  width: 36rpx;
  height: 36rpx;
  border-radius: 50%;
  background: #2D7A4A;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.step-badge.follow {
  background: #C4A882;
}
.step-num {
  font-size: 20rpx;
  color: #fff;
  font-weight: 700;
}
.action-body {
  flex: 1;
}
.action-head {
  display: flex;
  align-items: baseline;
  gap: 8rpx;
  flex-wrap: wrap;
}
.action-name {
  font-size: 24rpx;
  font-weight: 600;
  color: #2C1810;
}
.action-timing {
  font-size: 19rpx;
  color: #E6A23C;
  background: #FDF3E3;
  border-radius: 6rpx;
  padding: 0 8rpx;
}
.action-detail {
  display: block;
  font-size: 22rpx;
  color: #5C4033;
  line-height: 1.6;
  margin-top: 4rpx;
}
.action-method {
  display: block;
  font-size: 20rpx;
  color: #8B7355;
  margin-top: 2rpx;
}
.chem-box {
  background: #F0F9F1;
  border-radius: 8rpx;
  padding: 10rpx;
  margin-top: 8rpx;
}
.chem-item {
  margin-bottom: 6rpx;
}
.chem-item:last-child {
  margin-bottom: 0;
}
.chem-name {
  font-size: 22rpx;
  font-weight: 600;
  color: #1A4A2E;
  margin-right: 8rpx;
}
.chem-spec {
  font-size: 19rpx;
  color: #8B7355;
}
.chem-dosage,
.chem-method {
  display: block;
  font-size: 20rpx;
  color: #5C4033;
  margin-top: 2rpx;
}

/* 成本：纵向卡片 */
.cost-card {
  background: #FDF8F3;
  border: 1rpx solid #E8E0D4;
  border-radius: 10rpx;
  padding: 12rpx;
  margin-bottom: 8rpx;
}
.cost-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.cost-name {
  font-size: 23rpx;
  font-weight: 600;
  color: #2C1810;
  flex: 1;
}
.cost-sub {
  font-size: 23rpx;
  font-weight: 700;
  color: #2D7A4A;
}
.cost-spec {
  display: block;
  font-size: 19rpx;
  color: #8B7355;
  margin-top: 2rpx;
}
.cost-detail {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-top: 4rpx;
}
.cost-kv {
  font-size: 19rpx;
  color: #8B7355;
}
.cost-source {
  display: block;
  font-size: 18rpx;
  color: #C4A882;
  margin-top: 4rpx;
}
.cost-total {
  display: flex;
  align-items: baseline;
  gap: 6rpx;
  background: #E8F5E9;
  border-radius: 10rpx;
  padding: 12rpx;
  margin-top: 8rpx;
}
.total-label {
  font-size: 22rpx;
  color: #5C4033;
}
.total-value {
  font-size: 30rpx;
  font-weight: 700;
  color: #1A4A2E;
}
.total-unit {
  font-size: 20rpx;
  color: #8B7355;
}
.cost-note {
  display: block;
  font-size: 20rpx;
  color: #8B7355;
  line-height: 1.5;
  margin-top: 6rpx;
}
.cost-disclaimer {
  border-top: 1rpx dashed #E8E0D4;
  margin-top: 8rpx;
  padding-top: 8rpx;
}
.disclaimer-text {
  display: block;
  font-size: 19rpx;
  color: #8B7355;
}
.disclaimer-warn {
  display: block;
  font-size: 19rpx;
  color: #E6A23C;
  margin-top: 2rpx;
}

/* 风险 */
.risk-item {
  display: flex;
  gap: 8rpx;
  border-radius: 10rpx;
  padding: 10rpx 12rpx;
  margin-bottom: 8rpx;
}
.risk-icon {
  font-size: 22rpx;
  flex-shrink: 0;
}
.risk-body {
  flex: 1;
}
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

.validate-box {
  background: #FDECEC;
  border-radius: 8rpx;
  padding: 10rpx;
  margin-top: 8rpx;
}
.validate-text {
  display: block;
  font-size: 20rpx;
  color: #DC2626;
  line-height: 1.5;
}
.generated-by {
  display: block;
  font-size: 18rpx;
  color: #C4A882;
  margin-top: 8rpx;
}
</style>
