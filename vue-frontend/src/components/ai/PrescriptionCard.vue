<template>
  <!--
    处方卡片：按「诊断 — 措施 — 成本 — 风险 — 依据」五段式组织。
    任何一段无数据就整段隐藏，避免出现空标题让用户以为内容丢失。
  -->
  <div
    v-if="px"
    class="prescription-card rounded-2xl overflow-hidden"
    style="background: #fff; border: 1px solid #e8e0d4; box-shadow: 0 4px 24px rgba(10, 92, 51, 0.06)"
  >
    <!-- 头部：诊断名称 + 严重程度 + 置信度 -->
    <div class="px-4 py-3" style="background: linear-gradient(135deg, #F1F8F2, #fff); border-bottom: 1px solid #f0ece4">
      <div class="flex items-center gap-2 flex-wrap">
        <span class="text-lg">📋</span>
        <span class="text-sm font-bold break-words" style="color: var(--green-deep)">
          {{ titleText }}
        </span>
        <span
          v-if="severity"
          class="text-[11px] px-2 py-0.5 rounded-full font-medium"
          :style="{ background: severity.bg, color: severity.color }"
          >{{ severity.label }}</span
        >
        <ConfidenceTag :level="level" :confidence="px.confidence ?? confidence" size="small" />
      </div>
      <div v-if="metaLine" class="flex items-center gap-3 flex-wrap mt-1.5">
        <span v-for="m in metaLine" :key="m.k" class="text-[11px]" style="color: var(--brown-faint)">
          {{ m.k }}：{{ m.v }}
        </span>
      </div>
    </div>

    <div class="px-4 py-3 flex flex-col gap-3.5">
      <!-- 中置信度提示：硬要求，放在最显眼的位置 -->
      <div
        v-if="level === 'medium'"
        class="text-[11px] leading-relaxed px-3 py-2 rounded-lg"
        style="background: #FEF3C7; color: #B45309; border: 1px solid #FCD34D"
      >
        ⚠️ 本处方为<strong>中等置信度</strong>（{{ formatConfidence(px.confidence ?? confidence) || '—' }}），
        依据存在不确定性，请结合作物实际长势与当地农技员意见后再{{ isOperation ? '动手' : '施药' }}。
      </div>

      <!-- ===== 1. 措施 ===== -->
      <section v-if="px.immediate_actions.length">
        <p class="pc-title">① {{ isOperation ? '怎么做' : '立即措施' }}</p>
        <ol class="flex flex-col gap-2">
          <li
            v-for="a in px.immediate_actions"
            :key="a.step"
            class="pc-step rounded-xl px-3 py-2.5"
            style="background: #faf8f4; border: 1px solid #f0ece4"
          >
            <div class="flex items-start gap-2">
              <span
                class="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-mono mt-[1px]"
                style="background: var(--green-mist); color: var(--green-deep)"
                >{{ a.step }}</span
              >
              <div class="flex-1 min-w-0">
                <p class="text-xs font-semibold break-words" style="color: var(--brown)">{{ a.action }}</p>
                <p v-if="a.detail" class="text-[11px] leading-relaxed mt-1 break-words" style="color: var(--brown-soft)">
                  {{ a.detail }}
                </p>
                <div class="flex items-center gap-2 flex-wrap mt-1.5">
                  <span v-if="a.timing" class="pc-chip" style="background: #FEF3C7; color: #B45309">⏱ {{ a.timing }}</span>
                  <span v-if="a.method" class="pc-chip" style="background: #EDE9FE; color: #6D28D9">🔧 {{ a.method }}</span>
                </div>
                <div v-if="a.chemicals.length" class="flex flex-col gap-1 mt-2">
                  <span
                    v-for="c in a.chemicals"
                    :key="c.name"
                    class="pc-chemical text-[11px] px-2 py-1 rounded-lg inline-flex items-center gap-1.5 flex-wrap"
                    style="background: #DBEAFE; color: #1D4ED8"
                  >
                    <span class="font-medium">🧪 {{ c.name }}</span>
                    <span v-if="c.spec" class="opacity-80">{{ c.spec }}</span>
                    <span v-if="c.dosage" class="opacity-80">用量：{{ c.dosage }}</span>
                    <span v-if="c.method" class="opacity-80">用法：{{ c.method }}</span>
                  </span>
                </div>
              </div>
            </div>
          </li>
        </ol>
      </section>

      <!-- ===== 后续管理（措施子块） ===== -->
      <section v-if="px.follow_up.length">
        <p class="pc-title pc-title-sub">↳ 后续管理</p>
        <ol class="flex flex-col gap-1.5">
          <li
            v-for="a in px.follow_up"
            :key="a.step"
            class="flex items-start gap-2 text-[11px] leading-relaxed"
            style="color: var(--brown-soft)"
          >
            <span class="shrink-0 font-mono" style="color: var(--brown-faint)">{{ a.step }}.</span>
            <span class="min-w-0 break-words">
              <strong style="color: var(--brown)">{{ a.action }}</strong>
              <span v-if="a.timing" class="ml-1" style="color: var(--brown-faint)">（{{ a.timing }}）</span>
              <template v-if="a.detail"><br />{{ a.detail }}</template>
            </span>
          </li>
        </ol>
      </section>

      <!-- ===== 2. 成本 ===== -->
      <section v-if="px.cost_estimate">
        <p class="pc-title">② 成本估算</p>
        <div class="rounded-xl overflow-hidden" style="border: 1px solid #f0ece4">
          <table class="cost-table w-full text-[11px]" style="border-collapse: collapse">
            <thead>
              <tr style="background: #faf8f4">
                <th class="pc-th text-left">名称</th>
                <th class="pc-th text-left">规格</th>
                <th class="pc-th text-right">单价</th>
                <th class="pc-th text-right">数量</th>
                <th class="pc-th text-right">小计</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(it, i) in px.cost_estimate.items" :key="it.name + i" style="border-top: 1px solid #f5f1ea">
                <td class="pc-td" data-label="名称">
                  <span style="color: var(--brown)">{{ it.name }}</span>
                  <span v-if="it.pricing_source" class="block text-[10px]" style="color: var(--brown-faint)">
                    来源：{{ it.pricing_source }}
                  </span>
                </td>
                <td class="pc-td" data-label="规格" style="color: var(--brown-soft)">{{ it.spec || '—' }}</td>
                <td class="pc-td text-right font-mono" data-label="单价" style="color: var(--brown-soft)">
                  {{ money(it.unit_price) || '—' }}<span v-if="it.unit" class="text-[10px]">/{{ it.unit }}</span>
                </td>
                <td class="pc-td text-right font-mono" data-label="数量" style="color: var(--brown-soft)">
                  {{ it.quantity ?? '—' }}
                </td>
                <td class="pc-td text-right font-mono font-medium" data-label="小计" style="color: var(--brown)">
                  {{ money(it.subtotal) || '—' }}
                </td>
              </tr>
              <tr v-if="px.cost_estimate.labor" style="border-top: 1px solid #f5f1ea">
                <td class="pc-td" data-label="名称">
                  <span style="color: var(--brown)">人工</span>
                  <span v-if="px.cost_estimate.labor.operations?.length" class="block text-[10px]" style="color: var(--brown-faint)">
                    {{ px.cost_estimate.labor.operations.join('、') }}
                  </span>
                </td>
                <td class="pc-td" data-label="规格" style="color: var(--brown-soft)">
                  {{ px.cost_estimate.labor.hours ?? '—' }} 小时 × {{ money(px.cost_estimate.labor.rate) || '—' }}
                </td>
                <td class="pc-td text-right" data-label="单价" style="color: var(--brown-soft)">—</td>
                <td class="pc-td text-right font-mono" data-label="数量" style="color: var(--brown-soft)">
                  {{ px.cost_estimate.labor.hours ?? '—' }}
                </td>
                <td class="pc-td text-right font-mono font-medium" data-label="小计" style="color: var(--brown)">
                  {{ money(px.cost_estimate.labor.subtotal) || '—' }}
                </td>
              </tr>
            </tbody>
            <tfoot v-if="px.cost_estimate.total !== null">
              <tr style="background: #F1F8F2">
                <td class="pc-td font-semibold" colspan="4" data-label="合计" style="color: var(--green-deep)">
                  合计{{ areaText }}
                </td>
                <td class="pc-td text-right font-mono font-bold" data-label="合计金额" style="color: var(--green-deep)">
                  {{ money(px.cost_estimate.total) }}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <!-- 价格口径必须显式标注：示例价被当成真实报价会造成决策误导 -->
        <p class="text-[10px] leading-relaxed mt-1.5" style="color: var(--brown-faint)">
          📌 {{ COST_PRICE_NOTE }}
          <template v-if="px.cost_estimate.data_source">；数据来源：{{ px.cost_estimate.data_source }}</template>
          <template v-if="px.cost_estimate.note"><br />备注：{{ px.cost_estimate.note }}</template>
        </p>
      </section>

      <!-- ===== 3. 风险 ===== -->
      <section v-if="riskList.length || failedFitness.length">
        <p class="pc-title">③ 风险与适配</p>
        <div class="flex flex-col gap-1.5">
          <div
            v-for="(w, i) in riskList"
            :key="w.code + i"
            class="text-[11px] leading-relaxed px-2.5 py-2 rounded-lg"
            :style="riskStyle(w.level)"
          >
            <span class="font-semibold mr-1">[{{ riskLabel(w.level) }}]</span>{{ w.message }}
            <span v-if="w.basis" class="opacity-70">（依据：{{ basisLabel(w.basis) }}）</span>
          </div>
          <div
            v-for="f in failedFitness"
            :key="f.item"
            class="text-[11px] leading-relaxed px-2.5 py-2 rounded-lg"
            style="background: #FEF3C7; color: #B45309; border: 1px solid #FCD34D"
          >
            ⚠️ 适配提示 · {{ f.item }}：{{ f.detail || '未通过条件校验' }}
          </div>
        </div>
      </section>

      <!-- ===== 4. 依据 ===== -->
      <section>
        <p class="pc-title">④ 依据与可信度</p>
        <div class="flex items-center gap-2 flex-wrap mb-2">
          <span class="pc-chip" :style="validatedStyle">
            {{ px.validated ? '✓ 已通过规则校验' : '⚠ 未通过规则校验' }}
          </span>
          <span class="pc-chip" style="background: #F3F4F6; color: #4B5563">
            生成方式：{{ generatedByLabel }}
          </span>
          <span class="pc-chip" :style="confidenceStyle">
            置信度：{{ formatConfidence(px.confidence ?? confidence) || px.confidence_level }}
          </span>
        </div>
        <p v-if="px.validation_errors.length" class="text-[10px] leading-relaxed mb-2" style="color: #B91C1C">
          校验提示：{{ px.validation_errors.join('；') }}
        </p>

        <div class="flex flex-col gap-2">
          <GraphPathView v-if="graphPaths.length" :paths="graphPaths" @node-click="$emit('node-click', $event)" />
          <!-- 检索来源：有三路分组时按「本地知识库/知识图谱/联网搜索」分节展示；
               v-if 用 hasAnySource 而不是 sourceList.length —— 分组通道为空时
               sourceList 也是空的，但**空通道的说明本身要显示**（"这一路没查到"是信息） -->
          <SourceList
            v-if="hasAnySource"
            :sources="sourceList"
            :channels="channels"
            title="处方依据"
            @node-click="$emit('node-click', $event)"
          />
          <p v-if="!graphPaths.length && !hasAnySource" class="text-[11px]" style="color: var(--brown-faint)">
            本次未命中知识图谱路径，以下为向量检索依据：暂无明确来源
          </p>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import ConfidenceTag from './ConfidenceTag.vue'
import GraphPathView from './GraphPathView.vue'
import SourceList from './SourceList.vue'
import {
  COST_PRICE_NOTE,
  GENERATED_BY_LABELS,
  RISK_LEVELS,
  confidenceStyleOf,
  formatConfidence,
  formatMoney,
  normalizeRiskWarnings,
  severityStyleOf,
  toArray,
  toNumber,
} from '@/utils/aiTypes'

const props = defineProps({
  /** 已归一化的 Prescription（utils/aiTypes.normalizePrescription 产物） */
  prescription: { type: Object, default: null },
  /** 顶层溯源；处方自带 sources 优先，两者都无则显示空态 */
  sources: { type: Array, default: () => [] },
  /** 三路检索分组结果（本地知识库/知识图谱/联网搜索），有值时依据区按通道分节 */
  channels: { type: Array, default: () => [] },
  /** 顶层图谱路径；处方本身不携带 graph_paths */
  graphPaths: { type: Array, default: () => [] },
  /** 顶层置信度等级，处方自带等级缺失时兜底 */
  confidenceLevel: { type: String, default: 'unknown' },
  /** 顶层风险提示（含置信度分级附加的提示），与处方内风险合并去重 */
  riskWarnings: { type: Array, default: () => [] },
})
defineEmits(['node-click'])

const px = computed(() => props.prescription || null)
// 农事操作型（"夏季茶叶如何修剪"）：标题是"要办的事"而非"诊断"，
// 措施叫"怎么做"而不是"立即措施"，置信度提示也不能说"施药"。
const isOperation = computed(() => !!px.value?.is_operation)
const titleText = computed(
  () => px.value?.diagnosis || (isOperation.value ? '农事操作' : '防治处方'),
)
const level = computed(() => px.value?.confidence_level || props.confidenceLevel || 'unknown')
const confidence = computed(() => px.value?.confidence ?? null)
const severity = computed(() => severityStyleOf(px.value?.severity))

const metaLine = computed(() => {
  const p = px.value || {}
  return [
    p.crop && { k: '作物', v: p.crop },
    p.region && { k: '地区', v: p.region },
    p.season && { k: '季节', v: p.season },
  ].filter(Boolean)
})

const areaText = computed(() => {
  const a = toNumber(px.value?.cost_estimate?.area_mu)
  return a ? `（按 ${a} 亩计）` : ''
})

const money = (v) => formatMoney(v, px.value?.cost_estimate?.currency || 'CNY')

/** 处方内风险与顶层风险合并，按 code/文案去重（同一风险会在两处出现） */
const riskList = computed(() => {
  const merged = [...normalizeRiskWarnings(px.value?.risk_warnings), ...normalizeRiskWarnings(props.riskWarnings)]
  const seen = new Set()
  return merged.filter((w) => {
    const key = w.code || w.message
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
})

const failedFitness = computed(() => toArray(px.value?.fitness_check).filter((f) => f && f.passed === false))

const generatedByLabel = computed(() => {
  const g = px.value?.generated_by
  return GENERATED_BY_LABELS[g] || (g ? g : '未标注')
})
const validatedStyle = computed(() =>
  px.value?.validated
    ? { background: '#E8F5E9', color: '#0E7A44' }
    : { background: '#FEF3C7', color: '#B45309' },
)
const confidenceStyle = computed(() => {
  const s = confidenceStyleOf(level.value)
  return { background: s.bg, color: s.color }
})

/** 处方自带的 sources 优先（更贴近该处方），缺失时回退顶层来源 */
const sourceList = computed(() => (px.value?.sources?.length ? px.value.sources : props.sources))

/**
 * 依据区是否有内容可展示。
 * 有三路通道时以通道为准：通道为空但带状态说明（"无结果/未启用/调用失败"）也算有内容，
 * 否则农户看不到"这一路查了但没有结果"这条信息。
 */
const hasAnySource = computed(() => {
  if (props.channels?.length) return props.channels.some((c) => c.has_content)
  return sourceList.value.length > 0
})

const RISK_BASIS_LABELS = { weather: '天气', kb: '知识库', kg: '知识图谱', policy: '政策', rule: '规则校验', model: '模型判断' }
const riskLabel = (l) => (RISK_LEVELS[l] || RISK_LEVELS.medium).label
const basisLabel = (b) => RISK_BASIS_LABELS[b] || b
const riskStyle = (l) => {
  const s = RISK_LEVELS[l] || RISK_LEVELS.medium
  return { background: s.bg, color: s.color, border: `1px solid ${s.border}` }
}
</script>

<style scoped>
.pc-title {
  font-size: 12px;
  font-weight: 700;
  color: var(--brown);
  margin-bottom: 8px;
  padding-left: 8px;
  border-left: 3px solid var(--green);
  line-height: 1.2;
}
.pc-title-sub {
  border-left-color: var(--earth);
  font-weight: 600;
}
.pc-chip {
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 999px;
  white-space: nowrap;
}
.pc-step {
  transition: box-shadow 0.2s ease;
}
.pc-step:hover {
  box-shadow: 0 2px 10px rgba(44, 24, 16, 0.05);
}
.pc-th {
  padding: 6px 8px;
  font-weight: 600;
  color: var(--brown-soft);
  white-space: nowrap;
}
.pc-td {
  padding: 6px 8px;
  vertical-align: top;
}
.pc-chemical {
  width: fit-content;
}

/* 窄屏：成本表改为纵向卡片，避免 5 列在小屏横向溢出 */
@media (max-width: 768px) {
  .cost-table thead {
    display: none;
  }
  .cost-table tbody tr,
  .cost-table tfoot tr {
    display: block;
    padding: 8px 10px;
    border-top: 1px solid #f5f1ea;
  }
  .cost-table td {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    text-align: left !important;
    padding: 2px 0;
  }
  .cost-table td::before {
    content: attr(data-label);
    color: var(--brown-faint);
    flex-shrink: 0;
  }
  .cost-table td[colspan] {
    justify-content: flex-start;
  }
}
</style>
