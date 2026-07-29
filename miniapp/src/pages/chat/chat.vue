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

          <view class="msg-content">
            <!-- 用户消息气泡 -->
            <view v-if="m.role === 'user'" class="bubble bubble-user">
              <text class="bubble-text">{{ m.content }}</text>
            </view>

            <!-- AI消息气泡 -->
            <view v-else class="bubble bubble-ai">
              <MarkdownRender v-if="m.content && !m.loading" :content="m.content" />
              <view v-else-if="m.loading" class="loading-dots">
                <view class="dot dot-1" />
                <view class="dot dot-2" />
                <view class="dot dot-3" />
              </view>
              <text v-else-if="m.isError" class="error-text">{{ m.content || '请求失败' }}</text>

              <!-- 操作按钮 -->
              <view class="bubble-actions" v-if="m.content && !m.loading">
                <text class="action-btn" @tap="playTTS(m.content)">🔊 播放</text>
                <text class="action-btn" @tap="copyText(m.content)">📋 复制</text>
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
          :class="{ active: c.id === chat.currentId }"
          @tap="switchSession(c.id)"
        >
          <view class="session-info">
            <text class="session-title">{{ c.title }}</text>
            <text class="session-time">{{ formatTime(c.createdAt) }}</text>
          </view>
          <text class="session-del" @tap.stop="deleteSession(c.id)">🗑️</text>
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import NavBar from '@/components/NavBar.vue'
import MarkdownRender from '@/components/MarkdownRender.vue'
import { useChatStore } from '@/store/chat'
import { useAuthStore } from '@/store/auth'
import { chatSync, fetchSessions, fetchSessionMessages } from '@/api/chat'
import { diagnoseImage, voiceToText, textToSpeech } from '@/api/multimodal'
import { QUICK_QUESTIONS } from '@/utils/constants'
import { relativeTime } from '@/utils/format'
import { handleError } from '@/utils/error'

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

  await loadServerSession()

  if (!chat.currentId && !chat.conversations.length) {
    chat.newConversation()
  }

  recorder = uni.getRecorderManager()
  recorder.onStop(async (res) => {
    if (!res.tempFilePath) return
    uni.showLoading({ title: '识别中...' })
    try {
      const result = await voiceToText(res.tempFilePath)
      const text = result?.text || result || ''
      if (text) inputText.value = text
    } catch (err) {
      handleError(err, { fallbackMsg: '语音识别失败' })
    }
    uni.hideLoading()
  })

  uni.$on('quick-question', (q) => { send(q) })
})

onUnmounted(() => { uni.$off('quick-question') })

async function loadServerSession() {
  try {
    const sessions = await fetchSessions(1, 0)
    if (sessions?.length) {
      const latest = sessions[0]
      const messages = await fetchSessionMessages(latest.id)
      if (messages?.length) {
        chat.hydrateFromServer(latest.id, latest.title, messages)
      }
    }
  } catch { /* 静默失败 */ }
}

// 监听消息数量变化和最后一条消息内容变化，自动滚动到底部
watch(() => chat.currentMessages.length, () => { scrollToBottom() })
watch(() => {
  const msgs = chat.currentMessages
  return msgs.length ? msgs[msgs.length - 1].content : ''
}, () => { scrollToBottom() })

function formatTime(time) { return relativeTime(time) }

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
    const result = await diagnoseImage(pendingImage.value)
    let response = '🔬 图片诊断完成\n\n'
    if (result.summary) response += result.summary + '\n\n'
    if (result.results?.length) {
      result.results.forEach((r, i) => {
        response += `**${i+1}. ${r.filename || '图片'}**\n`
        response += `- 诊断：${r.diagnosis || '无法识别'}\n`
        if (r.severity) response += `- 严重程度：${r.severity}\n`
        if (r.confidence) response += `- 置信度：${(r.confidence * 100).toFixed(1)}%\n`
        if (r.advice) response += `- 建议：${r.advice}\n`
        response += '\n'
      })
    }
    chat.updateLastMessage(response.trim())
  } catch {
    chat.updateLastMessage('⚠️ 图片诊断失败，请重试')
  } finally {
    clearPreview(); chat.isStreaming = false
  }
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

async function playTTS(content) {
  const clean = content.replace(/<[^>]*>/g, '').replace(/\*\*/g, '').slice(0, 500)
  uni.showLoading({ title: '生成语音...' })
  try {
    const res = await textToSpeech(clean)
    if (res?.audio_base64) {
      const ctx = uni.createInnerAudioContext()
      ctx.src = `data:audio/${res.format || 'mp3'};base64,${res.audio_base64}`
      ctx.play()
    } else { uni.showToast({ title: '语音合成失败', icon: 'none' }) }
  } catch { uni.showToast({ title: '语音合成失败', icon: 'none' }) }
  uni.hideLoading()
}

function copyText(content) {
  const clean = content.replace(/<[^>]*>/g, '').replace(/\*\*/g, '')
  uni.setClipboardData({ data: clean, success: () => uni.showToast({ title: '已复制', icon: 'success' }) })
}

function startNew() { chat.newConversation(); showSessions.value = false }
function switchSession(id) { chat.switchConversation(id); showSessions.value = false }
function deleteSession(id) {
  uni.showModal({
    title: '确认删除', content: '删除后无法恢复',
    success: (res) => { if (res.confirm) chat.deleteConversation(id) }
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
.session-del {
  font-size: 14px;
  padding: 4px;
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
