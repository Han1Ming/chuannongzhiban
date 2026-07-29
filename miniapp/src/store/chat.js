import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getToken } from '@/utils/auth'

function storageKey() {
  const token = getToken()
  return token ? `cnzb_chats_${token.slice(-8)}` : 'cnzb_chats_anonymous'
}

export const useChatStore = defineStore('chat', () => {
  const conversations = ref(loadConversations())
  const currentId = ref(null)
  const isStreaming = ref(false)

  const currentMessages = computed(() =>
    conversations.value.find(c => c.id === currentId.value)?.messages || []
  )

  const currentTitle = computed(() =>
    conversations.value.find(c => c.id === currentId.value)?.title || '新对话'
  )

  const currentSessionId = computed(() =>
    conversations.value.find(c => c.id === currentId.value)?.session_id || null
  )

  function newConversation() {
    const id = Date.now().toString()
    conversations.value.unshift({
      id,
      title: '新对话',
      messages: [],
      createdAt: new Date().toISOString(),
      session_id: null
    })
    currentId.value = id
    save()
    return id
  }

  function addMessage(role, content, extra = {}) {
    let conv = conversations.value.find(c => c.id === currentId.value)
    if (!conv) {
      currentId.value = newConversation()
      conv = conversations.value.find(c => c.id === currentId.value)
    }
    conv.messages.push({
      role,
      content,
      time: new Date().toISOString(),
      ...extra
    })
    // 自动以第一条用户消息作为标题
    if (role === 'user' && conv.messages.filter(m => m.role === 'user').length === 1) {
      conv.title = content.slice(0, 28) + (content.length > 28 ? '...' : '')
    }
    save()
    scrollToBottom()
  }

  function updateLastMessage(content) {
    const conv = conversations.value.find(c => c.id === currentId.value)
    if (!conv || !conv.messages.length) return
    const last = conv.messages[conv.messages.length - 1]
    last.content = content
    last.loading = false   // 清除 loading 状态，显示实际内容
    save()
  }

  function updateSessionId(sessionId) {
    const conv = conversations.value.find(c => c.id === currentId.value)
    if (conv) {
      conv.session_id = sessionId
      save()
    }
  }

  // 从服务端加载会话消息到本地 store
  function hydrateFromServer(sessionId, title, messages) {
    let conv = conversations.value.find(c => c.session_id === sessionId)
    if (!conv) {
      conv = {
        id: Date.now().toString(),
        title: title || '历史对话',
        messages: [],
        createdAt: new Date().toISOString(),
        session_id: sessionId
      }
      conversations.value.unshift(conv)
    }
    conv.messages = messages.map(m => ({
      role: m.role,
      content: m.content,
      time: m.created_at
    }))
    currentId.value = conv.id
    save()
  }

  function switchConversation(id) {
    currentId.value = id
  }

  function deleteConversation(id) {
    conversations.value = conversations.value.filter(c => c.id !== id)
    if (currentId.value === id) {
      currentId.value = conversations.value[0]?.id || null
    }
    save()
  }

  function clearAll() {
    conversations.value = []
    currentId.value = null
    save()
  }

  function loadConversations() {
    try {
      return uni.getStorageSync(storageKey()) || []
    } catch {
      return []
    }
  }

  function save() {
    try {
      uni.setStorageSync(storageKey(), conversations.value.slice(0, 100))
    } catch (e) {
      console.error('保存聊天记录失败', e)
    }
  }

  function scrollToBottom() {
    uni.nextTick(() => {
      // 由页面组件实现滚动
    })
  }

  return {
    conversations,
    currentId,
    isStreaming,
    currentMessages,
    currentTitle,
    currentSessionId,
    newConversation,
    addMessage,
    updateLastMessage,
    updateSessionId,
    hydrateFromServer,
    switchConversation,
    deleteConversation,
    clearAll
  }
})
