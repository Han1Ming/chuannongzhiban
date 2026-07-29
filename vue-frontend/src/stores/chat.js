import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getUser } from '@/utils/auth'

function userKey() {
  // 使用用户ID做key，退出登录后再登录历史仍然保留
  const user = getUser()
  const userId = user?.id || 'guest'
  return 'cnzb_chats_user_' + userId
}

export const useChatStore = defineStore('chat', () => {
  const conversations = ref(load())
  const currentId = ref(null)
  const isStreaming = ref(false)

  const currentMessages = computed(() =>
    conversations.value.find(c => c.id === currentId.value)?.messages || []
  )

  function newConv() {
    const id = Date.now().toString()
    conversations.value.unshift({ id, title: '新对话', messages: [], createdAt: new Date().toISOString(), session_id: null })
    currentId.value = id; save()
    return id
  }

  function addMsg(role, content, extra = {}) {
    let conv = conversations.value.find(c => c.id === currentId.value)
    if (!conv) { currentId.value = newConv(); conv = conversations.value.find(c => c.id === currentId.value) }
    conv.messages.push({ role, content, time: new Date().toISOString(), ...extra })
    if (role === 'user' && conv.messages.filter(m => m.role === 'user').length === 1)
      conv.title = content.slice(0, 28) + (content.length > 28 ? '…' : '')
    save()
  }

  function appendLast(content) {
    const conv = conversations.value.find(c => c.id === currentId.value)
    if (!conv || !conv.messages.length) return
    const last = conv.messages[conv.messages.length - 1]
    if (last.role === 'assistant') last.content += content
    else conv.messages.push({ role: 'assistant', content, time: new Date().toISOString() })
    save()
  }

  function updateSessionId(sessionId) {
    const conv = conversations.value.find(c => c.id === currentId.value)
    if (conv) { conv.session_id = sessionId; save() }
  }

  function switchConversation(id) { currentId.value = id; save() }

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

  function delConv(id) {
    conversations.value = conversations.value.filter(c => c.id !== id)
    if (currentId.value === id) currentId.value = conversations.value[0]?.id || null
    save()
  }

  function clearAll() {
    conversations.value = []
    currentId.value = null
    save()
  }

  function load() {
    try { return JSON.parse(localStorage.getItem(userKey())) || [] } catch { return [] }
  }
  function save() {
    localStorage.setItem(userKey(), JSON.stringify(conversations.value.slice(0, 100)))
  }

  return {
    conversations, currentId, isStreaming, currentMessages,
    newConv, addMsg, appendLast, updateSessionId,
    switchConversation, delConv, clearAll, hydrateFromServer
  }
})
