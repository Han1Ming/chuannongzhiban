<template>
  <!--
    底部对话输入框。
    设计目标（需求）：从「贴底的白条 + 内嵌浅灰输入框」改成「浮在页面上的纯白大圆角卡片」。
    做法：外层容器透明（只用顶部渐隐让内容从卡片下面淡出），白卡 + 柔和阴影由 .composer-box 承担，
    两者背景**必须解耦**——旧实现是白条套浅灰盒，盒子永远看不出层次。
  -->
  <div class="composer">
    <div class="composer-inner">
      <transition name="preview-fade">
        <div v-if="previewImage" class="preview-bar">
          <div class="w-14 h-14 rounded-xl overflow-hidden shrink-0 img-zoom">
            <img :src="previewImage" class="w-full h-full object-cover" alt="预览" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-xs font-medium truncate" style="color: var(--brown)">图片诊断模式</p>
            <p class="text-[11px]" style="color: var(--brown-faint)">
              AI 将自动分析作物图片并给出诊断
            </p>
          </div>
          <button
            class="w-7 h-7 rounded-full flex items-center justify-center cursor-pointer transition-colors hover:bg-red-50 hover:text-red-500"
            style="color: #999"
            type="button"
            aria-label="取消图片"
            @click="clearPreview"
          >
            <el-icon :size="14"><Close /></el-icon>
          </button>
        </div>
      </transition>

      <div class="composer-box">
        <div class="composer-tools">
          <el-tooltip content="上传图片诊断" placement="top">
            <button
              class="tool-btn"
              :class="{ 'is-active': !!image }"
              type="button"
              aria-label="上传图片诊断"
              @click="$refs.imgInput.click()"
            >
              <el-icon :size="18"><Picture /></el-icon>
            </button>
          </el-tooltip>
          <input ref="imgInput" type="file" accept="image/*" class="hidden" @change="onImagePick" />

          <el-tooltip :content="recording ? '点击停止' : '语音输入'" placement="top">
            <button
              class="tool-btn"
              :class="{ 'is-recording': recording }"
              type="button"
              :aria-label="recording ? '停止录音' : '语音输入'"
              @click="toggleRec"
            >
              <el-icon :size="18"><Microphone /></el-icon>
            </button>
          </el-tooltip>

          <el-tooltip content="上传音频文件" placement="top">
            <button
              class="tool-btn"
              type="button"
              aria-label="上传音频文件"
              @click="$refs.audioInput.click()"
            >
              <el-icon :size="18"><Headset /></el-icon>
            </button>
          </el-tooltip>
          <input
            ref="audioInput"
            type="file"
            accept="audio/*,.m4a,.mp3,.wav"
            class="hidden"
            @change="onAudioPick"
          />
        </div>

        <textarea
          ref="$input"
          :value="text"
          placeholder="输入您的农业问题，Enter 发送"
          rows="1"
          class="composer-input"
          :disabled="streaming"
          @input="onInput"
          @keydown.enter.exact.prevent="$emit('send')"
        ></textarea>

        <button
          v-if="streaming"
          class="composer-send composer-send-stop"
          type="button"
          aria-label="停止回答"
          @click="$emit('stop')"
        >
          <el-icon :size="18"><Close /></el-icon>
        </button>
        <button
          v-else
          class="composer-send"
          type="button"
          :disabled="!canSend"
          :aria-label="canSend ? '发送' : '请输入内容'"
          @click="$emit('send')"
        >
          <el-icon :size="19"><Promotion /></el-icon>
        </button>
      </div>

      <!-- 免责声明：移出输入框容器，放在正下方居中 -->
      <p class="composer-disclaimer">
        AI回答仅供参考 · 支持农业技术问答、病虫害诊断、种植方案推荐
      </p>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Close, Headset, Microphone, Picture, Promotion } from '@element-plus/icons-vue'
import { voiceToText } from '@/api/multimodal'

/**
 * 输入框组件。
 *
 * 从 ChatView 抽出来的理由：这块原本是 135 行内联 DOM + 6 个 scoped 样式块，
 * 和消息流、诊断卡片挤在同一个 1600 行文件里，改一下圆角就要在长文件里定位。
 * 抽出后 text 走 v-model:text、待诊断图片走 v-model:image，语音/图片的录放逻辑完全内聚。
 */
const props = defineProps({
  /** 输入框文本（v-model:text） */
  text: { type: String, default: '' },
  /** 待诊断图片 File（v-model:image） */
  image: { type: Object, default: null },
  /** 流式回答中：禁用输入并换成停止按钮 */
  streaming: { type: Boolean, default: false },
})
const emit = defineEmits(['update:text', 'update:image', 'send', 'stop'])

const $input = ref(null)
const imgInput = ref(null)
const audioInput = ref(null)
const previewImage = ref('')
const recording = ref(false)

let mediaRecorder = null
let mediaStream = null

/** 有文字或有待诊断图片即可发送（只发图片=走诊断，是既有且正确的行为） */
const canSend = computed(() => !!props.text.trim() || !!props.image)

// ---------- 文本 ----------
function onInput(e) {
  emit('update:text', e.target.value)
  autoResize()
}

/** 自适应高度：先归零再按 scrollHeight 撑开，上限 120px 与 CSS max-height 对齐 */
function autoResize() {
  const el = $input.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = Math.min(el.scrollHeight, 120) + 'px'
}

// 父组件清空 / 语音识别回填文本时都要重算高度：
// 旧实现靠父组件手动调 autoResize()，漏调一次输入框就卡在旧高度上。
watch(
  () => props.text,
  () => nextTick(autoResize),
)

// ---------- 图片 ----------
function onImagePick(e) {
  const file = e.target.files?.[0]
  e.target.value = ''
  if (!file) return
  setPreview(file)
  emit('update:image', file)
}

function setPreview(file) {
  if (previewImage.value) URL.revokeObjectURL(previewImage.value)
  previewImage.value = URL.createObjectURL(file)
}

function clearPreview() {
  if (previewImage.value) URL.revokeObjectURL(previewImage.value)
  previewImage.value = ''
  emit('update:image', null)
}

// 父组件（新建对话 / 发送后）把 image 置空时，本地预览必须跟着清，
// 否则会出现「图已经发出去了，预览条还挂在那里」。
watch(
  () => props.image,
  (v) => {
    if (!v && previewImage.value) {
      URL.revokeObjectURL(previewImage.value)
      previewImage.value = ''
    }
  },
)

// ---------- 录音 ----------
async function toggleRec() {
  if (recording.value) {
    recording.value = false
    if (mediaRecorder && mediaRecorder.state !== 'inactive') mediaRecorder.stop()
    if (mediaStream) {
      mediaStream.getTracks().forEach((t) => t.stop())
      mediaStream = null
    }
    return
  }
  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true })
    // 浏览器录音默认是 webm，而识别服务只吃 wav/mp3/m4a/aac/flac/opus/ogg。
    // 这里按浏览器实际支持情况挑一个**服务端认**的容器，避免录完必失败。
    const preferred = [
      'audio/mp4',
      'audio/ogg;codecs=opus',
      'audio/ogg',
      'audio/webm;codecs=opus',
      'audio/webm',
    ]
    const mimeType = preferred.find(
      (m) => window.MediaRecorder && MediaRecorder.isTypeSupported?.(m),
    )
    mediaRecorder = mimeType
      ? new MediaRecorder(mediaStream, { mimeType })
      : new MediaRecorder(mediaStream)
    const ext = mimeType?.includes('mp4') ? 'm4a' : mimeType?.includes('ogg') ? 'ogg' : 'webm'
    const chunks = []
    mediaRecorder.ondataavailable = (e) => chunks.push(e.data)
    mediaRecorder.onstop = async () => {
      recording.value = false
      if (mediaStream) {
        mediaStream.getTracks().forEach((t) => t.stop())
        mediaStream = null
      }
      if (!chunks.length) return
      const blob = new Blob(chunks, { type: mimeType || 'audio/webm' })
      try {
        const r = await voiceToText(new File([blob], `recording.${ext}`))
        const t = r?.text || ''
        // 识别结果**追加**到现有文本，而不是覆盖——用户可能已经打了一半字
        if (t) emit('update:text', (props.text ? props.text + ' ' : '') + t)
        else ElMessage.warning(r?.error || '没有识别到语音内容，请靠近麦克风重试')
      } catch (err) {
        ElMessage.warning(err?.message || '语音识别失败')
      }
    }
    mediaRecorder.start()
    recording.value = true
  } catch {
    ElMessage.warning('无法访问麦克风，请检查浏览器麦克风权限')
  }
}

async function onAudioPick(e) {
  const file = e.target.files?.[0]
  e.target.value = ''
  if (!file) return
  try {
    const r = await voiceToText(file)
    const t = r?.text || ''
    if (t) emit('update:text', (props.text ? props.text + ' ' : '') + t)
    // 把后端的可读原因透出来（格式不支持 / 额度耗尽 / Key 无效），而不是笼统的"失败"
    else ElMessage.warning(r?.error || '音频识别结果为空，请换一段清晰的录音')
  } catch (err) {
    ElMessage.warning(err?.message || '音频识别失败')
  }
}

// 卸载时收尾：录音流不停会一直占用麦克风指示灯，objectURL 不撤销会泄漏
onBeforeUnmount(() => {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') mediaRecorder.stop()
  if (mediaStream) mediaStream.getTracks().forEach((t) => t.stop())
  if (previewImage.value) URL.revokeObjectURL(previewImage.value)
})

// 父组件需要「发送后清空」时不必碰 DOM，这里暴露一个显式方法
defineExpose({ clearPreview, autoResize })
</script>

<style scoped>
/*
 * 外壳透明：白卡自己带阴影浮在米色页面上。
 * 顶部 28px 是「内容从卡片下面淡出」的渐隐带，配合 margin-top 负值让它盖住消息区底部，
 * 因此 pointer-events: none —— 否则会挡住最后一条消息上可能存在的按钮。
 */
.composer {
  position: relative;
  z-index: 10;
  flex-shrink: 0;
  margin-top: -28px;
  padding: 28px 16px 12px;
  background: linear-gradient(to bottom, rgba(253, 248, 243, 0) 0%, var(--cream) 60%);
  pointer-events: none;
}
.composer-inner {
  margin: 0 auto;
  width: 100%;
  max-width: 850px;
  pointer-events: auto;
}

/* ===== 图片预览条 ===== */
.preview-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
  padding: 10px 12px;
  border-radius: 18px;
  background: #fff;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

/* ===== 输入卡片 ===== */
.composer-box {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 24px;
  background: #fff;
  /* 预留边框宽度：聚焦时只换颜色，不改变盒模型，避免输入框"跳"一下 */
  border: 1.5px solid transparent;
  box-shadow:
    0 4px 16px rgba(0, 0, 0, 0.06),
    0 1px 3px rgba(0, 0, 0, 0.04);
  transition:
    border-color 0.25s ease,
    box-shadow 0.25s ease;
}
/*
 * 聚焦态用 :focus-within 而不是 JS 的 focus/blur 状态。
 * 旧实现是 @focus/@blur 驱动 class，于是「点左侧工具按钮」会先触发 blur，
 * 聚焦光环闪一下消失；:focus-within 天然没有这个问题。
 */
.composer-box:focus-within {
  border-color: var(--brand);
  box-shadow:
    0 0 0 4px rgba(14, 122, 68, 0.12),
    0 6px 20px rgba(14, 122, 68, 0.14);
}

/* ===== 左侧工具 ===== */
.composer-tools {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 5px;
}
.tool-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border: none;
  border-radius: 9999px;
  background: transparent;
  /* 比旧版的 #999 更深一档，图标不再"发灰看不清" */
  color: #666;
  cursor: pointer;
  transition:
    color 0.2s ease,
    background 0.2s ease;
}
.tool-btn:hover {
  color: #333;
  background: #f4f4f4;
}
.tool-btn.is-active {
  color: var(--brand);
  background: var(--brand-mist);
}
.tool-btn.is-recording {
  color: #dc2626;
  background: rgba(220, 38, 38, 0.08);
  animation: recPulse 1.5s ease-in-out infinite;
}
@keyframes recPulse {
  0%,
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.3);
  }
  50% {
    transform: scale(1.08);
    box-shadow: 0 0 0 8px rgba(220, 38, 38, 0);
  }
}

/* ===== 输入区：去掉原生边框与背景，与卡片融为一体 ===== */
.composer-input {
  flex: 1;
  min-width: 0;
  max-height: 120px;
  padding: 10px 4px;
  border: none;
  outline: none;
  background: transparent;
  resize: none;
  font-family: 'Noto Sans SC', system-ui, sans-serif;
  font-size: 15px;
  line-height: 1.6;
  color: var(--brown);
}
.composer-input::placeholder {
  color: #999;
}
.composer-input:disabled {
  cursor: not-allowed;
}
/*
 * iOS Safari 在输入框字号 < 16px 时，聚焦瞬间会强制放大整个页面。
 * 桌面端用 15px 满足设计稿，移动端必须回到 16px —— 这不是笔误。
 */
@media (max-width: 768px) {
  .composer-input {
    font-size: 16px;
  }
}

/* ===== 右侧发送按钮 ===== */
.composer-send {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 46px;
  height: 46px;
  border: none;
  border-radius: 9999px;
  /* 品牌主色实心 + 白色箭头 */
  background: var(--brand);
  color: #fff;
  cursor: pointer;
  transition:
    background 0.2s ease,
    transform 0.2s ease,
    box-shadow 0.2s ease;
}
.composer-send:hover:not(:disabled) {
  background: var(--brand-deep);
  transform: scale(1.06);
  box-shadow: 0 6px 18px rgba(14, 122, 68, 0.32);
}
.composer-send:active:not(:disabled) {
  transform: scale(0.96);
}
/* 真·置灰：用不透明度会让底下的米色透上来，看起来像"半坏的绿按钮" */
.composer-send:disabled {
  background: #dcdcdc;
  cursor: not-allowed;
}
.composer-send-stop {
  background: #dc2626;
}
.composer-send-stop:hover {
  background: #b91c1c;
  box-shadow: 0 6px 18px rgba(220, 38, 38, 0.3);
}

/* ===== 免责声明：在输入框正下方居中，12px / #999 ===== */
.composer-disclaimer {
  margin-top: 12px;
  text-align: center;
  font-size: 12px;
  line-height: 1.5;
  color: #999;
}

.preview-fade-enter-active {
  transition: all 0.3s ease;
}
.preview-fade-leave-active {
  transition: all 0.2s ease;
}
.preview-fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}
.preview-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
