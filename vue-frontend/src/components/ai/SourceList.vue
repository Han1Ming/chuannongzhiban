<template>
  <div class="source-list">
    <!--
      检索来源（需求：在最终答案下方以可收缩容器展示**三种检索方式**的源文字）。

      两种数据形态共用这一个组件：
      * channels 有值 → 按「本地知识库 / 知识图谱 / 联网搜索」分 section 展示源文字，
        每路自带状态（有结果 / 无结果 / 本次未启用 / 调用失败），农户能看出系统查了哪几个地方；
      * channels 为空（历史消息、单体 Agent 路径）→ 退回扁平 sources 列表，功能不丢。

      默认收起：依据是解释性信息，先让农户看到结论与措施。
    -->
    <CollapsePill
      v-if="hasAny"
      icon="🔗"
      :label="title"
      :count="totalCount"
      :hint="hint"
    >
      <!-- ============ 有分组通道：三路分 section ============ -->
      <template v-if="channels.length">
        <section
          v-for="c in channels"
          :key="c.key"
          class="channel"
        >
          <div class="channel-head">
            <span class="channel-icon" aria-hidden="true">{{ c.icon }}</span>
            <span class="channel-label">{{ c.label }}</span>
            <span
              class="channel-count"
              :style="{ color: c.style.color, background: c.style.bg }"
              >{{ c.count }} 条</span
            >
            <span v-if="c.count === 0" class="channel-status">{{ c.status_label }}</span>
            <!-- 通道说明：联网走的是哪条通道、检索词是什么；失败时给失败原因 -->
            <span
              v-if="c.error || c.detail"
              class="channel-detail truncate"
              :title="c.error || c.detail"
              >{{ c.error || c.detail }}</span
            >
          </div>

          <!-- 空通道也要给一行说明：不写的话农户会以为这一路被漏掉了 -->
          <p v-if="!c.count" class="channel-empty">
            {{ c.error ? `该通道调用失败：${c.error}` : c.detail || '本次未从该通道取到可用内容。' }}
          </p>

          <div v-else class="grid gap-2.5 grid-cols-1 sm:grid-cols-2">
            <article
              v-for="(s, i) in c.items"
              :key="`${c.key}-${s.doc_id || s.title}-${i}`"
              class="source-card"
            >
              <div class="flex items-start gap-2">
                <span
                  class="source-type shrink-0"
                  :style="{ background: c.style.bg, color: c.style.color }"
                  >{{ s.source_type_label }}</span
                >
                <p class="source-title" :title="s.title">{{ s.title }}</p>
              </div>

              <div class="flex items-center gap-2 flex-wrap mt-1.5">
                <span
                  v-if="s.matchPercent !== null"
                  class="text-[11px] font-mono"
                  style="color: var(--brown-faint)"
                >
                  匹配度 {{ s.matchPercent.toFixed(0) }}%
                  <span v-if="s.similarity === null" title="后端未给 similarity，此处为检索距离口径，仅作相对参考">
                    （距离口径）
                  </span>
                </span>
                <span v-if="s.category" class="text-[11px]" style="color: var(--brown-faint)">{{ s.category }}</span>
                <span v-if="s.provider" class="text-[11px]" style="color: var(--brown-faint)">{{ s.provider }}</span>
              </div>

              <!--
                源文字：需求要展示的「检索到的源文字」，默认直接铺开一行摘录。
                内容长时点「展开原文」看全，避免卡片把面板撑得很长。
              -->
              <p v-if="s.source_text" class="src-text" :class="{ clamped: expanded !== `${c.key}-${i}` }">
                {{ s.source_text }}
              </p>

              <div class="source-actions">
                <a
                  v-if="s.url"
                  class="src-act"
                  :href="s.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  @click.stop
                  >查看原文 ↗</a
                >
                <button
                  v-else-if="s.source_text && s.source_text.length > 60"
                  class="src-act"
                  type="button"
                  @click="toggle(`${c.key}-${i}`)"
                >
                  {{ expanded === `${c.key}-${i}` ? '收起原文' : '展开原文' }}
                </button>

                <button
                  v-if="s.graph_path"
                  class="src-act src-act-graph"
                  type="button"
                  @click="showGraph = showGraph === `${c.key}-${i}` ? '' : `${c.key}-${i}`"
                >
                  {{ showGraph === `${c.key}-${i}` ? '收起图谱路径' : '图谱路径' }}
                </button>
              </div>

              <div v-if="showGraph === `${c.key}-${i}` && s.graph_path" class="mt-2">
                <GraphPathView :paths="[s.graph_path]" @node-click="$emit('node-click', $event)" />
              </div>
            </article>
          </div>
        </section>
      </template>

      <!-- ============ 无分组通道：退回扁平列表（历史消息兼容） ============ -->
      <div v-else class="grid gap-2.5 grid-cols-1 sm:grid-cols-2">
        <article v-for="(s, i) in sources" :key="(s.source_id || s.title) + i" class="source-card">
          <div class="flex items-start gap-2">
            <span
              class="source-type shrink-0"
              :style="{ background: typeStyle(s.source_type).bg, color: typeStyle(s.source_type).color }"
              >{{ s.source_type_label }}</span
            >
            <p class="source-title" :title="s.title">{{ s.title }}</p>
          </div>
          <p v-if="s.excerpt" class="src-text clamped">{{ s.excerpt }}</p>
          <div class="source-actions">
            <a v-if="s.url" class="src-act" :href="s.url" target="_blank" rel="noopener noreferrer" @click.stop>查看原文 ↗</a>
            <button v-else-if="s.excerpt" class="src-act" type="button" @click="toggle(String(i))">
              {{ expanded === String(i) ? '收起原文' : '展开原文' }}
            </button>
            <button
              v-if="s.source_type === 'kg' && s.graph_path"
              class="src-act src-act-graph"
              type="button"
              @click="showGraph = showGraph === String(i) ? '' : String(i)"
            >
              {{ showGraph === String(i) ? '收起图谱路径' : '图谱路径' }}
            </button>
          </div>
          <p v-if="expanded === String(i) && s.excerpt" class="src-excerpt">{{ s.excerpt }}</p>
          <div v-if="showGraph === String(i) && s.graph_path" class="mt-2">
            <GraphPathView :paths="[s.graph_path]" @node-click="$emit('node-click', $event)" />
          </div>
        </article>
      </div>
    </CollapsePill>

    <!-- 空态：不隐藏整块，让用户知道「确实是没来源」而不是组件坏了 -->
    <div v-else class="flex items-center gap-1.5 text-xs py-1" style="color: var(--brown-faint)">
      <span>📚</span><span>暂无明确来源</span>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import GraphPathView from './GraphPathView.vue'
import CollapsePill from './CollapsePill.vue'

// 依据标注：三路通道分 section + source_type 标签 + 匹配度 + 源文字展开 + KG 图谱路径
const props = defineProps({
  /** 扁平来源（历史消息兼容路径） */
  sources: { type: Array, default: () => [] },
  /** 三路检索分组结果（normalizeRetrievalChannels 的输出），优先于 sources */
  channels: { type: Array, default: () => [] },
  title: { type: String, default: '检索来源' },
})
defineEmits(['node-click'])

const expanded = ref('')
const showGraph = ref('')
function toggle(key) {
  expanded.value = expanded.value === key ? '' : key
}

const channels = computed(() => props.channels || [])
const totalCount = computed(() =>
  channels.value.length
    ? channels.value.reduce((sum, c) => sum + (c.count || 0), 0)
    : props.sources.length,
)
// 三路全空且没有任何说明时不渲染总容器（点开是空的比不显示更糟）
const hasAny = computed(() =>
  channels.value.length
    ? channels.value.some((c) => c.has_content)
    : props.sources.length > 0,
)
// 胶囊右侧一句话说明：让人一眼看出三种检索各查到了几条
const hint = computed(() => {
  if (!channels.value.length) return ''
  return channels.value.map((c) => `${c.label}${c.count}`).join(' / ')
})

const TYPE_COLORS = {
  kb: { color: '#0E7A44', bg: '#E8F5E9' },
  kg: { color: '#6D28D9', bg: '#EDE9FE' },
  policy: { color: '#B45309', bg: '#FEF3C7' },
  weather: { color: '#0E7490', bg: '#CFFAFE' },
  web: { color: '#4B5563', bg: '#F3F4F6' },
}
const typeStyle = (t) => TYPE_COLORS[t] || TYPE_COLORS.web
</script>

<style scoped>
/* 通道分节：每一路一块，块之间用细分割线，视觉上区分「三种检索方式」 */
.channel + .channel {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed #ece7dd;
}
.channel-head {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
  min-width: 0;
}
.channel-icon {
  font-size: 12px;
  line-height: 1;
  flex-shrink: 0;
}
.channel-label {
  font-size: 12px;
  font-weight: 700;
  color: var(--brown);
  flex-shrink: 0;
}
.channel-count {
  font-size: 10px;
  line-height: 1.6;
  padding: 0 6px;
  border-radius: 6px;
  flex-shrink: 0;
}
.channel-status {
  font-size: 10px;
  color: var(--brown-faint);
  flex-shrink: 0;
}
.channel-detail {
  font-size: 10px;
  color: var(--brown-faint);
  min-width: 0;
}
.channel-empty {
  font-size: 11px;
  line-height: 1.6;
  color: var(--brown-faint);
  padding: 4px 0 2px;
}

.source-card {
  display: flex;
  flex-direction: column;
  padding: 10px 12px;
  border-radius: 12px;
  background: #faf8f4;
  border: 1px solid #f0ece4;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    border-color 0.2s ease;
}
/* 悬浮上浮：需求指定的交互反馈 */
.source-card:hover {
  transform: translateY(-2px);
  border-color: rgba(14, 122, 68, 0.25);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.07);
}

.source-type {
  font-size: 10px;
  line-height: 1.6;
  padding: 0 6px;
  border-radius: 6px;
  white-space: nowrap;
}

/* 标题最多两行，超出省略——来源标题动辄一行半，不夹住会让卡片高低参差 */
.source-title {
  flex: 1;
  min-width: 0;
  font-size: 12px;
  line-height: 1.5;
  color: var(--brown);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 源文字：摘录样式，收起时夹 3 行 */
.src-text {
  margin-top: 6px;
  padding: 6px 8px;
  border-radius: 8px;
  background: #fff;
  border-left: 3px solid var(--brand-mist);
  font-size: 11px;
  line-height: 1.65;
  color: var(--brown-soft);
  white-space: pre-wrap;
  word-break: break-word;
}
.src-text.clamped {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.source-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}
.src-act {
  font-size: 11px;
  line-height: 1.4;
  padding: 2px 8px;
  border-radius: 9999px;
  border: 1px solid rgba(14, 122, 68, 0.2);
  background: #fff;
  color: var(--brand);
  cursor: pointer;
  text-decoration: none;
  transition:
    background 0.2s ease,
    color 0.2s ease;
}
.src-act:hover {
  background: var(--brand-mist);
  color: var(--brand-deep);
}
.src-act-graph {
  border-color: rgba(109, 40, 217, 0.2);
  color: #6d28d9;
}
.src-act-graph:hover {
  background: #ede9fe;
  color: #5b21b6;
}

.src-excerpt {
  margin-top: 8px;
  padding: 6px 8px;
  border-radius: 8px;
  background: #fff;
  border-left: 3px solid var(--brand-mist);
  font-size: 11px;
  line-height: 1.6;
  color: var(--brown-soft);
  white-space: pre-wrap;
}
</style>
