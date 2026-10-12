<template>
  <!--
    AI 回答操作栏：复制 · 语音朗读 · 重新生成 · 赞/踩。
    默认**常驻可见**（低对比度），鼠标悬停整条回答时提升到全对比度。
    旧实现是 `opacity-0 hover:opacity-100`——手机和平板上根本没有 hover，
    等于把复制/朗读彻底藏起来了，这是被一并修掉的实际缺陷。
  -->
  <div class="msg-actions">
    <!-- ① 复制 -->
    <el-tooltip :content="copied ? '已复制' : '复制回答'" placement="top" :show-after="400">
      <button
        class="act-btn"
        :class="{ 'is-on': copied }"
        type="button"
        :aria-label="copied ? '已复制' : '复制回答'"
        @click="doCopy"
      >
        <el-icon :size="17">
          <Check v-if="copied" />
          <CopyDocument v-else />
        </el-icon>
      </button>
    </el-tooltip>

    <!--
      ② 语音朗读（需求重点）
      待播 = 静默喇叭；播放中 = 喇叭 + 声波，并带两圈错峰扩散的波纹；
      暂停 = 回到静默喇叭但保持主色高亮，用户一眼能看出「是这条被暂停了」。
    -->
    <el-tooltip :content="speechTip" placement="top" :show-after="400">
      <button
        class="act-btn act-speak"
        :class="speechClass"
        type="button"
        :aria-label="speechTip"
        @click="onSpeak"
      >
        <span class="act-ripple" aria-hidden="true"></span>
        <span class="act-ripple act-ripple-2" aria-hidden="true"></span>
        <AgriIcons :name="speechState === 'playing' || speechState === 'loading' ? 'speaker-wave' : 'speaker'" :size="17" />
      </button>
    </el-tooltip>

    <!-- ③ 重新生成 -->
    <el-tooltip :content="regenTip" placement="top" :show-after="400">
      <button
        class="act-btn"
        :class="{ 'is-busy': !canRegenerate || busy }"
        type="button"
        :aria-label="regenTip"
        @click="onRegenerate"
      >
        <el-icon :size="17"><Refresh /></el-icon>
      </button>
    </el-tooltip>

    <span class="act-divider" aria-hidden="true"></span>

    <!-- ④ 赞 / 踩：本期只做前端态（后端无反馈接口），再点一次取消 -->
    <el-tooltip :content="feedback === 'like' ? '取消' : '有帮助'" placement="top" :show-after="400">
      <button
        class="act-btn"
        :class="{ 'is-on': feedback === 'like' }"
        type="button"
        :aria-label="feedback === 'like' ? '取消点赞' : '这条回答有帮助'"
        @click="onFeedback('like')"
      >
        <AgriIcons name="thumb-up" :size="17" />
      </button>
    </el-tooltip>
    <el-tooltip :content="feedback === 'dislike' ? '取消' : '没帮助'" placement="top" :show-after="400">
      <button
        class="act-btn"
        :class="{ 'is-bad': feedback === 'dislike' }"
        type="button"
        :aria-label="feedback === 'dislike' ? '取消点踩' : '这条回答没帮助'"
        @click="onFeedback('dislike')"
      >
        <AgriIcons name="thumb-down" :size="17" />
      </button>
    </el-tooltip>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import { Check, CopyDocument, Refresh } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import AgriIcons from '@/components/icons/AgriIcons.vue'
import { useSpeech } from '@/composables/useSpeech'

const props = defineProps({
  /** 朗读与复制的文本源（自然语言正文） */
  text: { type: String, default: '' },
  /**
   * 语音播报专用文本（后端 spoken_text）。
   * 后端已经把它处理成"能直接念"的纯文本：去掉 Markdown 标记、折叠块、
   * 依据/出处等元信息，列表项各自成句。直接用正文念会读出"星号星号结论"，
   * 所以有它就优先用它。
   */
  speechText: { type: String, default: '' },
  /** 复制到剪贴板的完整文本（正文 + 处方/依据），缺省时退回 text */
  copyText: { type: String, default: '' },
  /** 稳定的消息标识：朗读状态按它区分「谁的喇叭在响」 */
  messageKey: { type: [String, Number], required: true },
  /** 当前反馈态：'like' | 'dislike' | null */
  feedback: { type: String, default: null },
  /** 是否允许重新生成（只有最后一条回答允许，中间轮次重生成会丢掉后续对话） */
  canRegenerate: { type: Boolean, default: false },
  /** 流式进行中：此时重生成会造成两条回答并行追加 */
  busy: { type: Boolean, default: false },
})
const emit = defineEmits(['regenerate', 'feedback'])

// ---------- 复制 ----------
const copied = ref(false)
let copyTimer = null

async function doCopy() {
  const payload = props.copyText || props.text || ''
  if (!payload) return
  try {
    await navigator.clipboard.writeText(payload)
    copied.value = true
    ElMessage.success('已复制')
    clearTimeout(copyTimer)
    copyTimer = setTimeout(() => (copied.value = false), 1800)
  } catch {
    ElMessage.warning('复制失败，请手动选择文本')
  }
}
// 组件卸载后定时器还在跑会 setState 到已销毁的实例上，这里必须清
onBeforeUnmount(() => clearTimeout(copyTimer))

// ---------- 语音朗读 ----------
const { toggle, stateOf } = useSpeech()
const speechState = computed(() => stateOf(props.messageKey))
const speechTip = computed(
  () =>
    ({
      idle: '语音朗读',
      loading: '正在合成语音…',
      playing: '暂停朗读',
      paused: '继续朗读',
    })[speechState.value] || '语音朗读',
)
const speechClass = computed(() => `is-${speechState.value}`)

function onSpeak() {
  // 播报优先用后端给的可播报文本（已去 Markdown/元信息，列表项成句）
  const speech = props.speechText || props.text
  if (!speech) {
    ElMessage.warning('这条回答没有可朗读的文字')
    return
  }
  toggle(props.messageKey, speech)
}

// ---------- 重新生成 ----------
const regenTip = computed(() => {
  if (props.busy) return '正在回答中，稍候再试'
  if (!props.canRegenerate) return '只能对最后一条回答重新生成'
  return '重新生成'
})
function onRegenerate() {
  // 不用 disabled 属性：disabled 的按钮收不到鼠标事件，tooltip 就不会弹，
  // 用户看不到「为什么点不动」。这里改成软禁用 + 明确提示。
  if (!props.canRegenerate || props.busy) {
    ElMessage.info(regenTip.value)
    return
  }
  emit('regenerate')
}

// ---------- 赞 / 踩 ----------
function onFeedback(value) {
  emit('feedback', props.feedback === value ? null : value)
}
</script>

<style scoped>
.msg-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 6px;
  padding-left: 4px;
  /* 常驻可见但压低对比度：不抢回答主体的视觉重量，同时触屏也能点到 */
  opacity: 0.6;
  transition: opacity 0.2s ease;
}
.msg-item:hover .msg-actions,
.msg-actions:focus-within {
  opacity: 1;
}

.act-btn {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border: none;
  border-radius: 8px;
  background: transparent;
  /* 默认半透明灰 */
  color: #b4b4b4;
  cursor: pointer;
  transition:
    color 0.2s ease,
    background 0.2s ease,
    transform 0.15s ease;
}
.act-btn:hover {
  /* Hover 全亮 + 主色调 */
  color: var(--brand);
  background: rgba(14, 122, 68, 0.08);
}
.act-btn:active {
  transform: scale(0.92);
}
.act-btn.is-busy {
  color: #d4d4d4;
  cursor: not-allowed;
}
.act-btn.is-busy:hover {
  color: #c4c4c4;
  background: transparent;
}
/* 复制成功 / 已点赞 */
.act-btn.is-on {
  color: var(--brand);
  background: var(--brand-mist);
}
/* 已点踩 */
.act-btn.is-bad {
  color: #b45309;
  background: #fef3c7;
}

.act-divider {
  width: 1px;
  height: 14px;
  margin: 0 2px;
  background: #e8e8e8;
}

/* ===== 语音朗读：播放/暂停态 + 波纹扩散 ===== */
.act-speak.is-playing,
.act-speak.is-paused {
  color: var(--brand);
  background: var(--brand-mist);
}
.act-speak.is-loading {
  color: var(--brand);
  background: rgba(14, 122, 68, 0.06);
  animation: actBreathe 1s ease-in-out infinite;
}
.act-ripple {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  border: 1px solid currentColor;
  opacity: 0;
  pointer-events: none;
}
/* 只在播放中扩散，暂停时立刻停住——波纹本身就是"正在出声"的信号 */
.act-speak.is-playing .act-ripple {
  animation: actRipple 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;
}
.act-speak.is-playing .act-ripple-2 {
  animation-delay: 0.6s;
}
@keyframes actRipple {
  0% {
    transform: scale(0.88);
    opacity: 0.55;
  }
  70% {
    transform: scale(1.55);
    opacity: 0;
  }
  100% {
    transform: scale(1.55);
    opacity: 0;
  }
}
@keyframes actBreathe {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
}
</style>
