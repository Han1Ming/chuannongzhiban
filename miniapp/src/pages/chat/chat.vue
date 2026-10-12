<template>
  <view class="chat-page">
    <!-- 导航栏 -->
    <NavBar title="AI智能问答">
      <template #right>
        <view class="nav-actions">
          <view class="nav-btn" @tap="showSessions = true">
            <text class="nav-btn-icon">📋</text>
          </view>
          <view class="nav-btn" @tap="startNew">
            <text class="nav-btn-icon">✚</text>
          </view>
        </view>
      </template>
    </NavBar>

    <!-- 消息列表 -->
    <scroll-view
      class="msg-list"
      scroll-y
      :scroll-into-view="scrollToId"
      scroll-with-animation
      @scrolltolower="scrollToBottom"
    >
      <!-- 欢迎区域 -->
      <view class="welcome" v-if="!chat.currentMessages.length && !chat.isStreaming">
        <view class="welcome-icon-wrap">
          <text class="welcome-icon">🌾</text>
        </view>
        <text class="welcome-title">川农智伴 · AI 农业助手</text>
        <text class="welcome-desc">由大语言模型驱动，专为川南地区农业生产提供智能服务</text>

        <view class="welcome-suggestions">
          <view class="suggestion-item" v-for="(q, i) in quickQuestions" :key="i" @tap="send(q)">
            <text class="suggestion-text">{{ q }}</text>
          </view>
        </view>
      </view>

      <!-- 消息列表 -->
      <view class="messages" v-if="chat.currentMessages.length">
        <view
          v-for="(m, i) in chat.currentMessages"
          :key="i"
          :id="'msg-' + i"
          class="msg-row"
          :class="m.role === 'user' ? 'msg-row-user' : 'msg-row-ai'"
        >
          <!-- AI头像 -->
          <view class="msg-avatar" v-if="m.role === 'assistant'">
            <text class="avatar-icon">🤖</text>
          </view>

          <view class="msg-content" :class="{ 'msg-content-wide': m.role === 'assistant' && m.payload }">
            <!-- 用户消息气泡 -->
            <view v-if="m.role === 'user'" class="bubble bubble-user">
              <text class="bubble-text">{{ m.content }}</text>
            </view>

            <!-- AI消息气泡 -->
            <view v-else class="bubble bubble-ai">
              <!--
                strip-sources：该条消息已经有结构化检索通道时，正文里那份
                「检索来源」折叠容器由下方 SourceList 组件呈现，避免展示两遍。
                流式阶段还没有 payload，保持不摘，正文里那份兜底可见。
              -->
              <MarkdownRender
                v-if="m.content && !m.loading"
                :content="m.content"
                :strip-sources="!!(m.payload && m.payload.retrieval_channels && m.payload.retrieval_channels.length)"
              />
              <view v-else-if="m.loading" class="loading-dots">
                <view class="dot dot-1" />
                <view class="dot dot-2" />
                <view class="dot dot-3" />
              </view>
              <text v-else-if="m.isError" class="error-text">{{ m.content || '请求失败' }}</text>

              <!--
                AI 增量载荷的结构化渲染（全部 v-if 守卫，字段缺失时保持纯 Markdown 行为）：
                置信度 → 处方 → 低置信度引导 → 推理链 → 来源 → 图谱路径 → 任务链路
              -->
              <view class="ai-blocks" v-if="m.payload && !m.loading">
                <ConfidenceTag
                  v-if="m.payload.confidence_level !== 'unknown' || m.payload.confidence"
                  :level="m.payload.confidence_level"
                  :confidence="m.payload.confidence"
                  size="small"
                />

                <!-- 低置信度：展示引导且不展示处方 -->
                <LowConfidenceGuide
                  v-if="isLowConfidence(m)"
                  :guide="m.payload.need_more_info"
                  @retake="onRetake"
                />

                <PrescriptionCard
                  v-else-if="m.payload.prescription"
                  :prescription="m.payload.prescription"
                  :risk-warnings="m.payload.risk_warnings"
                  :sources="m.payload.sources"
                  :channels="m.payload.retrieval_channels"
                />

                <!-- 无处方但有风险提示时单独展示，避免中置信度风险被吞掉 -->
                <view
                  class="risk-standalone"
                  v-if="!isLowConfidence(m) && !m.payload.prescription && m.payload.risk_warnings.length"
                >
                  <text class="risk-title">⚠️ 风险提示</text>
                  <view class="risk-item" v-for="(w, i) in m.payload.risk_warnings" :key="i">
                    <text class="risk-msg">{{ w.message }}</text>
                  </view>
                </view>

                <ReasoningPanel v-if="m.payload.reasoning_chain" :chain="m.payload.reasoning_chain" />
                <!--
                  检索来源：三路通道（本地知识库/知识图谱/联网搜索）的可收缩容器。
                  v-if 用 hasSources(m) 而不是 sources.length —— 三路都为空但带"无结果/
                  未启用"说明时也要显示，农户需要知道系统查了哪几个地方。
                -->
                <SourceList
                  v-if="hasSources(m) && !m.payload.prescription"
                  :sources="m.payload.sources"
                  :channels="m.payload.retrieval_channels"
                />
                <GraphPathTree v-if="m.payload.graph_paths.length" :paths="m.payload.graph_paths" />
                <AgentTrace v-if="m.payload.agent_trace" :trace="m.payload.agent_trace" />
              </view>

              <!-- 操作按钮 -->
              <view class="bubble-actions" v-if="m.content && !m.loading">
                <text class="action-btn" @tap="playTTS(m)">🔊 播放</text>
                <text class="action-btn" @tap="copyText(m)">📋 复制</text>
              </view>
            </view>

            <!-- 时间 -->
            <text class="msg-time" v-if="m.time">{{ formatTime(m.time) }}</text>
          </view>

          <!-- 用户头像 -->
          <view class="msg-avatar msg-avatar-user" v-if="m.role === 'user'">
            <text class="avatar-icon">👤</text>
          </view>
        </view>
      </view>

      <!-- 底部占位 -->
      <view id="msg-bottom" />
    </scroll-view>

    <!-- 图片预览 -->
    <view class="preview-bar" v-if="previewImage">
      <image class="preview-img" :src="previewImage" mode="aspectFill" />
      <text class="preview-label">图片诊断模式 · AI将自动分析作物图片</text>
      <text class="preview-close" @tap="clearPreview">✕</text>
    </view>

    <!-- 输入区 -->
    <view class="input-area">
      <view class="input-box">
        <view class="toolbar">
          <text class="tool-btn" @tap="chooseImage">📷</text>
          <text
            class="tool-btn"
            :class="{ recording: isRecording }"
            @touchstart.prevent="onMicTouchStart"
            @touchend.prevent="onMicTouchEnd"
          >🎤</text>
        </view>
        <input
          class="text-input"
          v-model="inputText"
          placeholder="输入您的农业问题..."
          confirm-type="send"
          @confirm="send(inputText)"
          :disabled="chat.isStreaming"
        />
        <text
          class="send-btn"
          :class="{ disabled: !inputText.trim() && !previewImage }"
          @tap="send(inputText)"
          v-if="!chat.isStreaming"
        >➤</text>
        <text class="send-btn send-btn-stop" @tap="stopStream" v-else>■</text>
      </view>
    </view>

    <!-- 会话列表弹窗 -->
    <view class="session-mask" v-if="showSessions" @tap="showSessions = false" />
    <view class="session-panel" :class="{ show: showSessions }">
      <view class="panel-header">
        <text class="panel-title">对话历史</text>
        <text class="panel-close" @tap="showSessions = false">✕</text>
      </view>
      <scroll-view class="panel-list" scroll-y>
        <view
          class="session-item"
          v-for="c in chat.conversations"
          :key="c.id"
          :class="{ active: c.id === chat.currentId, 'session-error': c.loadError }"
          @tap="switchSession(c)"
        >
          <view class="session-info">
            <text class="session-title">{{ c.title }}</text>
            <!-- 发起时间用会话的 createdAt（服务端真值优先） -->
            <text class="session-time">发起 {{ formatDateTime(c.createdAt) }}</text>
          </view>
          <text class="session-act" @tap.stop="startRename(c)">✏️</text>
          <text class="session-del" @tap.stop="confirmDelete(c)">🗑️</text>
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import NavBar from '@/components/NavBar.vue'
import MarkdownRender from '@/components/MarkdownRender.vue'
import ConfidenceTag from '@/components/ai/ConfidenceTag.vue'
import PrescriptionCard from '@/components/ai/PrescriptionCard.vue'
import LowConfidenceGuide from '@/components/ai/LowConfidenceGuide.vue'
import ReasoningPanel from '@/components/ai/ReasoningPanel.vue'
import SourceList from '@/components/ai/SourceList.vue'
import GraphPathTree from '@/components/ai/GraphPathTree.vue'
import AgentTrace from '@/components/ai/AgentTrace.vue'
import { useChatStore } from '@/store/chat'
import { useAuthStore } from '@/store/auth'
import { chatSync } from '@/api/chat'
import { diagnoseImage, voiceToText, textToSpeech } from '@/api/multimodal'
import { QUICK_QUESTIONS } from '@/utils/constants'
import { relativeTime, formatDate } from '@/utils/format'
import { handleError } from '@/utils/error'
import { normalizeDiagnoseResult, prescriptionToText } from '@/utils/aiTypes'

const chat = useChatStore()
const authStore = useAuthStore()
const inputText = ref('')
const previewImage = ref('')
const pendingImage = ref(null)
const showSessions = ref(false)
const scrollToId = ref('')
const quickQuestions = QUICK_QUESTIONS
const isRecording = ref(false)
let recorder = null

onMounted(async () => {
  if (!authStore.isLoggedIn) {
    uni.navigateTo({ url: '/pages/login/login' })
    return
  }

  await initSession()

  recorder = uni.getRecorderManager()
  recorder.onStop(async (res) => {
    if (!res.tempFilePath) return
    uni.showLoading({ title: '识别中...' })
    try {
      const result = await voiceToText(res.tempFilePath)
      const text = result?.text || ''
      if (text) {
        inputText.value = text
      } else {
        // 把后端可读原因透出来（格式不支持 / 额度耗尽 / 未识别到内容），
        // 而不是笼统的"语音识别失败"
        uni.showToast({ title: result?.error || '没有识别到语音内容，请靠近麦克风重试', icon: 'none', duration: 3000 })
      }
    } catch (err) {
      uni.showToast({ title: (err && err.message) || '语音识别失败', icon: 'none', duration: 3000 })
    } finally {
      uni.hideLoading()
    }
  })

  uni.$on('quick-question', (q) => { send(q) })
})

onUnmounted(() => { uni.$off('quick-question') })

/**
 * 进入问答页的初始化：
 * 1. 按**当前登录用户**重置会话（避免看到上一个账号的记录）；
 * 2. 拉取本人会话列表，仅用于左侧/弹窗展示，**不预取任何消息**；
 * 3. 停在**一个全新的空白会话**上——用户每次进来都是干净的新问答，
 *    历史会话只有主动点击时才加载消息。
 *
 * 注意问答页是 tabBar 页面，`switchTab` 回来不会重新 mounted，
 * 因此会话列表页跳转过来的目标会话在 `onShow` 里处理。
 */
async function initSession() {
  chat.resetForUser()
  try {
    await chat.loadSessionList(50)
  } catch {
    /* 拉取失败时保留本地缓存列表，用户仍能看到自己上次的会话 */
  }
  chat.newConversation()
}

async function openTargetSession() {
  const sessionId = getApp().globalData?.targetSessionId
  if (!sessionId) return
  getApp().globalData.targetSessionId = null
  showSessions.value = false
  try {
    await chat.openSessionByServerId(sessionId)
    scrollToBottom()
  } catch (err) {
    handleError(err, { fallbackMsg: '会话内容加载失败' })
  }
}

onShow(() => {
  if (!authStore.isLoggedIn) return
  openTargetSession()
})

// 监听消息数量变化和最后一条消息内容变化，自动滚动到底部
watch(() => chat.currentMessages.length, () => { scrollToBottom() })
watch(() => {
  const msgs = chat.currentMessages
  return msgs.length ? msgs[msgs.length - 1].content : ''
}, () => { scrollToBottom() })

function formatTime(time) { return relativeTime(time) }
function formatDateTime(time) { return formatDate(time, 'MM-DD HH:mm') }

function scrollToBottom() {
  const msgs = chat.currentMessages
  if (!msgs.length) return
  nextTick(() => {
    scrollToId.value = 'msg-' + (msgs.length - 1)
  })
}

async function send(text) {
  const msg = (text || inputText.value || '').trim()
  if (!msg && !pendingImage.value) return
  if (chat.isStreaming) return

  if (pendingImage.value) { await doDiagnose(); return }
  inputText.value = ''
  chat.isStreaming = true

  if (!chat.currentId) chat.newConversation()
  chat.addMessage('user', msg)
  chat.addMessage('assistant', '', { loading: true })

  try {
    const result = await chatSync(msg, chat.currentSessionId)
    chat.updateLastMessage(result.response || '抱歉，未获取到回答')
    // 结构化增量载荷单独挂到这条消息上，供气泡内的处方/推理链/来源组件渲染
    chat.updateLastPayload(result)
    if (result.session_id) chat.updateSessionId(result.session_id)
  } catch (err) {
    const { message } = handleError(err, { fallbackMsg: '请求失败，请检查网络', showToast: false })
    chat.updateLastMessage(message)
    chat.currentMessages[chat.currentMessages.length - 1].isError = true
  } finally {
    chat.isStreaming = false
  }
}

function stopStream() { chat.isStreaming = false }

function chooseImage() {
  uni.chooseImage({
    count: 1, sizeType: ['compressed'], sourceType: ['album', 'camera'],
    success: (res) => {
      pendingImage.value = res.tempFilePaths[0]
      previewImage.value = res.tempFilePaths[0]
    }
  })
}

async function doDiagnose() {
  if (!pendingImage.value) return
  chat.isStreaming = true
  chat.addMessage('user', '[图片诊断]', { type: 'image' })
  chat.addMessage('assistant', '', { loading: true })

  try {
    const raw = await diagnoseImage(pendingImage.value)
    const result = normalizeDiagnoseResult(raw)
    let response = '🔬 图片诊断完成\n\n'
    if (result.summary) response += result.summary + '\n\n'
    if (result.results?.length) {
      result.results.forEach((r, i) => {
        response += `**${i+1}. ${r.filename || '图片'}**\n`
        response += `- 诊断：${r.diagnosis || '无法识别'}\n`
        if (r.severity) response += `- 严重程度：${r.severity}\n`
        if (r.confidence) response += `- 置信度：${(r.confidence * 100).toFixed(1)}%（${r.confidence_label || '未知'}）\n`
        if (r.advice) response += `- 建议：${r.advice}\n`
        response += '\n'
      })
    }
    chat.updateLastMessage(response.trim())
    // 多图诊断结果聚合成一份气泡载荷（气泡只能渲染一份处方/置信度）
    chat.updateLastPayload(buildDiagnosePayload(result))
  } catch {
    chat.updateLastMessage('⚠️ 图片诊断失败，请重试')
  } finally {
    clearPreview(); chat.isStreaming = false
  }
}

/**
 * 把多图诊断响应聚合成聊天气泡可渲染的增量载荷。
 * 单图场景等价于直接使用 results[0]；多图时取「第一份有处方的结果」，
 * 风险提示/来源/图谱路径做去重合并，保证不会漏掉任何一张图的警告。
 */
function buildDiagnosePayload(result) {
  const results = result.results || []
  const withRx = results.find(r => r.prescription)
  const primary = withRx || results[0] || {}

  const warnings = []
  const sourceKeys = new Set()
  const sources = []
  results.forEach(r => {
    (r.risk_warnings || []).forEach(w => {
      const key = w.code || w.message
      if (key && !warnings.some(x => (x.code || x.message) === key)) warnings.push(w)
    })
    ;(r.sources || []).forEach(s => {
      const key = `${s.source_type}:${s.source_id}:${s.title}`
      if (!sourceKeys.has(key)) { sourceKeys.add(key); sources.push(s) }
    })
  })

  const graphPaths = []
  results.forEach(r => (r.graph_paths || []).forEach(p => { if (graphPaths.length < 5) graphPaths.push(p) }))

  // 低置信度优先展示引导：任一张图低置信度都值得提醒用户补充照片
  const lowResult = results.find(r => r.confidence_level === 'low' && r.need_more_info)

  return {
    api_version: result.api_version,
    intent: 'diagnose',
    confidence: result.overall_confidence,
    confidence_level: result.overall_confidence_level,
    prescription: primary.prescription || null,
    reasoning_chain: primary.reasoning_chain || null,
    sources,
    graph_paths: graphPaths,
    risk_warnings: warnings,
    need_more_info: lowResult?.need_more_info || result.need_more_info || null,
    agent_trace: null,
    source_meta: result.source_meta
  }
}

/** 该条 AI 消息是否按低置信度处理（低置信度不渲染处方） */
function isLowConfidence(m) {
  return !!m.payload && m.payload.confidence_level === 'low'
}

/**
 * 该条消息有没有「检索来源」可展示。
 *
 * 有三路通道时以通道为准：通道为空但带状态说明（"无结果 / 本次未启用 / 调用失败"）
 * 也算有内容——否则农户看不到"这一路查了但没有结果"，会以为系统只查了一个地方。
 * 没有通道的老消息退回扁平 sources。
 */
function hasSources(m) {
  if (!m.payload) return false
  const channels = m.payload.retrieval_channels || []
  if (channels.length) return channels.some((c) => c.has_content)
  return (m.payload.sources || []).length > 0
}

/**
 * 低置信度引导里的「补充照片」：复用现有 doDiagnose 流程，
 * 不重写上传逻辑，直接把新照片设为待诊断图片并立即重跑。
 */
function onRetake(path) {
  if (!path) return
  pendingImage.value = path
  previewImage.value = path
  doDiagnose()
}

function clearPreview() { previewImage.value = ''; pendingImage.value = null }

function onMicTouchStart() {
  if (!recorder) return
  isRecording.value = true
  recorder.start({ format: 'mp3', sampleRate: 16000, duration: 60000 })
}

function onMicTouchEnd() {
  if (!recorder) return
  isRecording.value = false
  recorder.stop()
}

async function playTTS(msg) {
  // 兼容传入字符串（旧调用）与消息对象：结构化组件不是 HTML 字符串，
  // 直接读 content 会漏掉处方，所以显式拼接处方要点
  const content = typeof msg === 'string' ? msg : (msg?.content || '')
  const rxText = typeof msg === 'object' ? prescriptionToText(msg.payload) : ''
  const source = rxText ? `${content}\n${rxText}` : content
  const clean = source.replace(/<[^>]*>/g, '').replace(/\*\*/g, '').slice(0, 500)
  uni.showLoading({ title: '生成语音...' })
  try {
    const res = await textToSpeech(clean)
    if (res?.audio_base64) {
      const ctx = uni.createInnerAudioContext()
      // 必须用后端返回的**实际**格式：曾出现"字节是 WAV、前端按 mp3 解码"导致播放无声
      ctx.src = `data:audio/${res.format || 'mp3'};base64,${res.audio_base64}`
      ctx.onError(() => {
        uni.showModal({
          title: '语音播放失败',
          content: '音频解码失败，请稍后重试。若持续失败，说明语音合成服务当前不可用。',
          showCancel: false
        })
      })
      ctx.play()
    } else {
      // 小程序没有浏览器那样的本地播报兜底，因此必须把原因说清楚，
      // 而不是只弹一句没有信息量的"语音合成失败"
      uni.showModal({
        title: '语音播报暂不可用',
        content: res?.error || '语音合成服务未返回音频，请联系管理员检查 DashScope 额度与 Key。',
        showCancel: false
      })
    }
  } catch (err) {
    uni.showModal({
      title: '语音播报暂不可用',
      content: (err && err.message) || '语音合成请求失败，请检查网络后重试。',
      showCancel: false
    })
  } finally {
    uni.hideLoading()
  }
}

function copyText(msg) {
  const content = typeof msg === 'string' ? msg : (msg?.content || '')
  const clean = content.replace(/<[^>]*>/g, '').replace(/\*\*/g, '')
  // 复制要带上处方要点：结构化渲染的内容不在 content 里
  const rxText = typeof msg === 'object' ? prescriptionToText(msg.payload) : ''
  const data = rxText ? `${clean}\n\n【防治处方】\n${rxText}` : clean
  uni.setClipboardData({ data, success: () => uni.showToast({ title: '已复制', icon: 'success' }) })
}

function startNew() {
  // 每次新建都是空白会话，不继承历史消息
  chat.newConversation()
  showSessions.value = false
}

/**
 * 点击会话：拉取该会话的消息并**整段替换**。
 * 切换会话只换 currentId，消息来自各会话自己的 messages 数组，因此不会串台。
 */
async function switchSession(conv) {
  showSessions.value = false
  if (chat.isStreaming) {
    uni.showToast({ title: '正在回答中，请稍候再切换', icon: 'none' })
    return
  }
  try {
    await chat.openSession(conv.id)
    scrollToBottom()
  } catch (err) {
    handleError(err, { fallbackMsg: '会话内容加载失败' })
  }
}

// 重命名：小程序没有 Element 的输入弹窗，用官方 showModal 的 editable 输入框
function startRename(conv) {
  uni.showModal({
    title: '修改会话标题',
    editable: true,
    placeholderText: '请输入新的会话标题',
    content: conv.title || '',
    success: async (res) => {
      if (!res.confirm) return
      const title = (res.content || '').trim()
      if (!title) {
        uni.showToast({ title: '标题不能为空', icon: 'none' })
        return
      }
      try {
        await chat.renameConversation(conv.id, title)
        uni.showToast({ title: '标题已更新', icon: 'success' })
      } catch (err) {
        handleError(err, { fallbackMsg: '标题保存失败，已还原' })
      }
    }
  })
}

function confirmDelete(conv) {
  uni.showModal({
    title: '确认删除',
    content: `删除会话「${conv.title}」后不再出现在列表中`,
    success: async (res) => {
      if (!res.confirm) return
      try {
        await chat.deleteConversation(conv.id)
        uni.showToast({ title: '已删除', icon: 'success' })
      } catch (err) {
        handleError(err, { fallbackMsg: '删除失败' })
      }
    }
  })
}
</script>

<style scoped>
.chat-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #FDF8F3;
}

/* 消息列表 */
.msg-list {
  flex: 1;
  padding: 12px 16px 8px;
  overflow-y: auto;
}

/* 欢迎区域 */
.welcome {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 30px 16px;
}
.welcome-icon-wrap {
  width: 80px;
  height: 80px;
  border-radius: 24px;
  background: linear-gradient(135deg, #E8F5E9, #C8E6C9);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}
.welcome-icon {
  font-size: 40px;
}
.welcome-title {
  font-size: 20px;
  font-weight: 700;
  color: #1A4A2E;
  text-align: center;
  margin-bottom: 8px;
}
.welcome-desc {
  font-size: 13px;
  color: #8B7355;
  text-align: center;
  line-height: 1.5;
  margin-bottom: 20px;
}
.welcome-suggestions {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.suggestion-item {
  padding: 12px 16px;
  background: #fff;
  border-radius: 12px;
  border: 1px solid #E8E0D4;
}
.suggestion-item:active {
  background: #E8F5E9;
  border-color: #2D7A4A;
}
.suggestion-text {
  font-size: 14px;
  color: #5C4033;
}

/* 消息行 */
.msg-row {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  align-items: flex-start;
}
.msg-row-user {
  flex-direction: row-reverse;
}
.msg-row-ai {
  flex-direction: row;
}
.msg-avatar {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #F5EDE0;
  flex-shrink: 0;
}
.msg-avatar-user {
  background: linear-gradient(135deg, #2D7A4A, #1A4A2E);
}
.avatar-icon {
  font-size: 18px;
}
.msg-content {
  max-width: 78%;
  display: flex;
  flex-direction: column;
}
/* 带结构化载荷（处方/图谱路径）时放宽气泡，避免窄屏下卡片被挤压 */
.msg-content-wide {
  max-width: 92%;
}

/* 气泡 */
.bubble {
  padding: 12px 14px;
  border-radius: 16px;
  font-size: 14px;
  line-height: 1.6;
}
.bubble-user {
  background: linear-gradient(135deg, #2D7A4A, #1A4A2E);
  color: #fff;
  border-radius: 16px 16px 4px 16px;
}
.bubble-ai {
  background: #fff;
  color: #2C1810;
  border-radius: 4px 16px 16px 16px;
  border: 1px solid #F0ECE4;
  border-left: 4px solid #2D7A4A;
  box-shadow: 0 1px 4px rgba(0,0,0,0.03);
}
.bubble-text {
  word-break: break-word;
}
/* AI 结构化区块：与 Markdown 正文之间留出间距 */
.ai-blocks {
  display: flex;
  flex-direction: column;
  margin-top: 10rpx;
}
.risk-standalone {
  background: #FDF3E3;
  border-radius: 10rpx;
  padding: 10rpx 12rpx;
  margin-top: 12rpx;
}
.risk-title {
  font-size: 22rpx;
  font-weight: 600;
  color: #E6A23C;
  display: block;
  margin-bottom: 4rpx;
}
.risk-item {
  margin-bottom: 4rpx;
}
.risk-msg {
  font-size: 22rpx;
  color: #2C1810;
  line-height: 1.6;
}
.msg-time {
  font-size: 10px;
  color: #C4A882;
  margin-top: 4px;
  padding: 0 4px;
}

/* loading 动画 */
.loading-dots {
  display: flex;
  gap: 4px;
  padding: 4px 0;
}
.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #2D7A4A;
  animation: dotBounce 1.4s infinite ease-in-out;
}
.dot-1 { animation-delay: 0s; }
.dot-2 { animation-delay: 0.2s; }
.dot-3 { animation-delay: 0.4s; }
@keyframes dotBounce {
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
  40% { transform: scale(1); opacity: 1; }
}

.error-text {
  color: #DC2626;
  font-size: 13px;
}

/* 气泡操作按钮 */
.bubble-actions {
  display: flex;
  gap: 12px;
  margin-top: 8px;
  padding-top: 6px;
  border-top: 1px solid #F0ECE4;
}
.action-btn {
  font-size: 12px;
  color: #8B7355;
  padding: 2px 4px;
}

/* 图片预览 */
.preview-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  background: #F8F6F2;
  border-top: 1px solid #E8E0D4;
}
.preview-img {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  flex-shrink: 0;
}
.preview-label {
  flex: 1;
  font-size: 12px;
  color: #5C4033;
}
.preview-close {
  font-size: 18px;
  color: #C4A882;
  padding: 4px;
}

/* 输入区 */
.input-area {
  padding: 8px 12px 12px;
  background: #fff;
  border-top: 1px solid #E8E0D4;
}
.input-box {
  display: flex;
  align-items: center;
  background: #F8F6F2;
  border-radius: 14px;
  padding: 6px 8px;
  gap: 4px;
  border: 2px solid transparent;
  transition: border-color 0.2s;
}
.input-box:focus-within {
  border-color: #2D7A4A;
}
.toolbar {
  display: flex;
  gap: 2px;
}
.tool-btn {
  font-size: 20px;
  padding: 6px;
}
.tool-btn.recording {
  color: #DC2626;
  animation: pulse 1s infinite;
}
@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.2); }
}
.text-input {
  flex: 1;
  font-size: 15px;
  height: 36px;
  color: #2C1810;
  padding: 0 8px;
}
.text-input::placeholder {
  color: #C4A882;
}
.send-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #2D7A4A, #1A4A2E);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  box-shadow: 0 2px 8px rgba(45,122,74,0.3);
}
.send-btn.disabled {
  opacity: 0.4;
  box-shadow: none;
}
.send-btn-stop {
  background: #DC2626;
  font-size: 14px;
}

/* 会话列表弹窗 */
.session-mask {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.3);
  z-index: 200;
}
.session-panel {
  position: fixed;
  top: 0; left: 0; bottom: 0;
  width: 280px;
  background: #fff;
  z-index: 201;
  transform: translateX(-100%);
  transition: transform 0.3s ease;
  box-shadow: 2px 0 20px rgba(0,0,0,0.1);
}
.session-panel.show {
  transform: translateX(0);
}
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 60px 16px 12px;
  border-bottom: 1px solid #E8E0D4;
}
.panel-title {
  font-size: 16px;
  font-weight: 700;
  color: #1A4A2E;
}
.panel-close {
  font-size: 18px;
  color: #8B7355;
  padding: 4px;
}
.panel-list {
  height: calc(100vh - 100px);
  padding: 8px;
}
.session-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  border-radius: 10px;
  margin-bottom: 4px;
  transition: background 0.2s;
}
.session-item.active {
  background: #E8F5E9;
}
.session-item:active {
  background: #F5EDE0;
}
.session-info {
  flex: 1;
  min-width: 0;
}
.session-title {
  font-size: 13px;
  font-weight: 500;
  color: #2C1810;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.session-time {
  font-size: 11px;
  color: #C4A882;
  margin-top: 2px;
}
.session-act {
  font-size: 14px;
  padding: 4px;
}
.session-del {
  font-size: 14px;
  padding: 4px;
}
/* 会话消息拉取失败：给出视觉提示，避免用户以为会话是空的 */
.session-item.session-error {
  background: #FEF2F2;
}

.nav-actions {
  display: flex;
  gap: 4px;
}
.nav-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}
.nav-btn:active {
  background: rgba(0,0,0,0.04);
}
.nav-btn-icon {
  font-size: 18px;
}
</style>
