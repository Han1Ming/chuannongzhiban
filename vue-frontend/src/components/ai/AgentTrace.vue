<template>
  <!--
    多智能体任务链路：默认收起的小胶囊（需求：✨ 图标 + 胶囊或折叠面板，默认收起）。
    胶囊常驻在回答卡片里，展开后才占用版面——链路是解释性信息，不该和答案抢位置。
    trace 为空时整个组件不渲染（由 v-if 保证，模板里再兜一层）。
  -->
  <div v-if="trace" class="agent-trace">
    <button
      class="trace-pill"
      type="button"
      :aria-expanded="open"
      @click="open = !open"
    >
      <span class="trace-spark" aria-hidden="true">✨</span>
      <span class="truncate">智能体链路</span>
      <span v-if="trace.final_agent_label" class="trace-muted truncate">
        · 最终输出：{{ trace.final_agent_label }}
      </span>
      <span v-if="elapsed" class="font-mono trace-muted">{{ elapsed }}</span>
      <el-icon
        :size="12"
        class="shrink-0 transition-transform duration-300"
        :style="{ transform: open ? 'rotate(90deg)' : 'rotate(0deg)', color: 'var(--brown-faint)' }"
      >
        <ArrowRight />
      </el-icon>
    </button>

    <transition name="at">
      <div v-if="open" class="trace-body">
        <!-- 降级说明优先展示：degraded 时推理质量下降，用户需要知道 -->
        <div
          v-if="trace.degraded || trace.error"
          class="text-[11px] leading-relaxed px-2.5 py-2 rounded-lg mb-2.5"
          style="background: #FEF3C7; color: #B45309"
        >
          ⚠️ 链路降级：{{ trace.error || '部分智能体未正常返回，结果基于可用通道生成，请谨慎参考。' }}
        </div>

        <!--
          话术来源：回答到底是模型按 farmer_answer_prompt.txt 生成的，
          还是模型不可用时按同一套规范由模板生成的。
          放在折叠面板里——这是排查信息，不该占农户的版面。
        -->
        <div
          v-if="meta?.answer_mode"
          class="text-[11px] leading-relaxed px-2.5 py-1.5 rounded-lg mb-2.5 flex flex-wrap items-center gap-x-1.5"
          style="background: #faf8f4; color: var(--brown-soft)"
        >
          <span>话术来源</span>
          <span class="font-medium" style="color: var(--brown)">{{ meta.answer_mode_label || meta.answer_mode }}</span>
          <!-- 只显示一句人话，完整原因（含请求 ID / 上游英文原文）挂在 title 上 -->
          <span v-if="meta.answer_error" :title="meta.answer_error" style="color: #B45309">
            · 模型不可用：{{ meta.answer_error_label || meta.answer_error }}
          </span>
        </div>

        <div v-if="trace.route_labels.length" class="flex items-center gap-1.5 flex-wrap mb-2.5">
          <span class="text-[11px]" style="color: var(--brown-faint)">调度链路</span>
          <template v-for="(r, i) in trace.route_labels" :key="r + i">
            <span v-if="i > 0" style="color: var(--earth)">→</span>
            <span
              class="text-[11px] px-2 py-0.5 rounded-full"
              :style="{
                background: r === trace.current_label ? 'var(--green-mist)' : '#F3F4F6',
                color: r === trace.current_label ? 'var(--green-deep)' : 'var(--brown-soft)',
              }"
              >{{ r }}</span
            >
          </template>
        </div>

        <div v-if="trace.steps.length" class="flex flex-col gap-1.5">
          <div
            v-for="(s, i) in trace.steps"
            :key="s.agent + i"
            class="at-step flex items-start gap-2 px-2.5 py-1.5 rounded-lg"
            style="background: #faf8f4"
          >
            <span class="shrink-0 text-[11px] font-mono mt-[1px]" style="color: var(--brown-faint)">
              {{ i + 1 }}
            </span>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="text-xs font-medium" style="color: var(--brown)">{{ s.agent_label }}</span>
                <span
                  class="text-[10px] px-1.5 py-0.5 rounded"
                  :style="statusStyle(s.status)"
                  >{{ s.status_label }}</span
                >
                <span v-if="s.elapsed_ms !== null" class="text-[10px] font-mono" style="color: var(--brown-faint)">
                  {{ formatElapsed(s.elapsed_ms) }}
                </span>
              </div>
              <p v-if="s.summary" class="text-[11px] mt-0.5 leading-relaxed break-words" style="color: var(--brown-faint)">
                {{ s.summary }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { ArrowRight } from '@element-plus/icons-vue'
import { formatElapsed } from '@/utils/aiTypes'

const props = defineProps({
  // 已归一化的 AgentTrace；为 null 时组件不渲染
  trace: { type: Object, default: null },
  // 已归一化的 SourceMeta（可选）：用于展示话术来源与模型失败原因
  meta: { type: Object, default: null },
})

const open = ref(false)
const elapsed = computed(() => formatElapsed(props.trace?.elapsed_ms))

const STATUS_STYLES = {
  done: { background: '#E8F5E9', color: '#0E7A44' },
  running: { background: '#DBEAFE', color: '#1D4ED8' },
  failed: { background: '#FEE2E2', color: '#B91C1C' },
  skipped: { background: '#F3F4F6', color: '#6B7280' },
}
const statusStyle = (s) => STATUS_STYLES[s] || STATUS_STYLES.skipped
</script>

<style scoped>
/* 胶囊：常驻但不抢眼，展开后身体才变成一块卡片 */
.trace-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  max-width: 100%;
  padding: 4px 12px;
  border-radius: 9999px;
  border: 1px solid #ececec;
  background: #fff;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.6;
  color: var(--brown);
  text-align: left;
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    background 0.2s ease,
    box-shadow 0.2s ease;
}
.trace-pill:hover {
  border-color: rgba(14, 122, 68, 0.3);
  background: var(--brand-mist);
  box-shadow: 0 2px 8px rgba(14, 122, 68, 0.08);
}
.trace-spark {
  font-size: 12px;
  line-height: 1;
}
.trace-muted {
  font-weight: 400;
  color: var(--brown-faint);
}
.trace-body {
  margin-top: 6px;
  padding: 12px;
  border-radius: 12px;
  background: #fff;
  border: 1px solid #f0ece4;
}

.at-enter-active,
.at-leave-active {
  transition: all 0.25s ease;
}
.at-enter-from,
.at-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
