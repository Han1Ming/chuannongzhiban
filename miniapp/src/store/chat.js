import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getUser } from '@/utils/auth'
import {
  normalizePayload,
  isEmptyPayload,
  trimPayloadForStorage,
  DEFAULT_LOW_CONFIDENCE_GUIDE
} from '@/utils/aiTypes'
import { fetchSessions, fetchSessionMessages, updateSession, deleteSession } from '@/api/chat'

/**
 * 会话隔离的三条硬规则（与网页端保持同一口径）：
 *
 * 1. **存储键绑定用户 id，未登录不落盘。**
 *    旧实现用 `token.slice(-8)` 做键：同一用户重新登录会拿到新 token，
 *    于是同一个人也读不到自己上一次的记录；而且键与业务身份无关，排查串号困难。
 *
 * 2. **切换会话整段替换消息，不合并。**
 *    每个会话的 messages 独立持有，`openSession` 从服务端拉取后**整体覆盖**，
 *    因此会话之间不可能串台。
 *
 * 3. **会话列表以服务端为准，账号变化时重置。**
 *    `loadSessionList` 用服务端返回的当前用户会话**重建**列表（只保留未发的本地草稿），
 *    登录/退出时调用 `resetForUser()` 清掉上一个用户的内存数据。
 */
const STORAGE_PREFIX = 'cnzb_chats_user_'

/** 当前登录用户 id；未登录返回 null。 */
function currentUserId() {
  const user = getUser()
  const id = user?.id ?? user?.user_id
  if (id === null || id === undefined || id === '') return null
  return String(id)
}

function storageKey() {
  const id = currentUserId()
  return id ? STORAGE_PREFIX + id : null
}

/** 落盘前的瘦身：结构化载荷只保留渲染必需字段，避免 setStorageSync 超限丢整份记录 */
function slimForPersist(conversations) {
  return conversations.slice(0, 60).map((c) => ({
    ...c,
    messages: (c.messages || []).map((m) => {
      if (!m.payload) return m
      const payload = trimPayloadForStorage(m.payload)
      return payload ? { ...m, payload } : { ...m, payload: null }
    })
  }))
}

/**
 * 把后端 MessageOut 的新增字段映射成前端的 payload 对象。
 *
 * 注意两个同名但含义不同的字段，别混淆：
 *   - `needMoreInfo`（布尔）：来自后端 MessageOut.need_more_info，只表示「这条回答是否信息不足」；
 *   - `needMoreInfoGuide`（对象）：{reason, suggestions, agri_station_tip}，用于渲染引导卡片。
 * 后端 MessageOut 只有布尔，因此这里补一个空对象作兜底，让引导组件出默认文案而不是整块消失。
 */
function mapServerMessage(m) {
  const msg = { role: m.role, content: m.content, time: m.created_at }
  const hasPayload =
    m.prescription || m.reasoning_chain || m.sources?.length || m.graph_paths?.length ||
    m.confidence_level || m.need_more_info || m.risk_warnings?.length || m.agent_trace
  if (hasPayload) {
    const payload = normalizePayload({
      api_version: m.api_version,
      intent: m.intent,
      prescription: m.prescription,
      reasoning_chain: m.reasoning_chain,
      sources: m.sources,
      graph_paths: m.graph_paths,
      confidence: m.confidence,
      confidence_level: m.confidence_level,
      need_more_info: m.need_more_info,
      risk_warnings: m.risk_warnings,
      agent_trace: m.agent_trace,
      source_meta: m.source_meta
    })
    if (!payload.need_more_info && m.need_more_info) {
      payload.need_more_info = { ...DEFAULT_LOW_CONFIDENCE_GUIDE }
    }
    msg.payload = payload
    msg.needMoreInfo = !!m.need_more_info || payload.confidence_level === 'low'
    msg.needMoreInfoGuide = payload.need_more_info || null
  }
  return msg
}

export const useChatStore = defineStore('chat', () => {
  const conversations = ref(loadConversations())
  const currentId = ref(null)
  const isStreaming = ref(false)
  const sessionListLoaded = ref(false)

  const currentConversation = computed(
    () => conversations.value.find(c => c.id === currentId.value) || null
  )
  // 消息严格取自当前会话对象，切换会话不可能读到别的会话的消息
  const currentMessages = computed(() => currentConversation.value?.messages || [])

  const currentTitle = computed(() => currentConversation.value?.title || '新对话')

  const currentSessionId = computed(() => currentConversation.value?.session_id || null)

  // ------------------------------------------------------------------ //
  // 会话
  // ------------------------------------------------------------------ //
  /**
   * 新建空白会话。已存在「一条消息都没发过」的草稿时复用它，
   * 避免反复进入问答页堆出一串空会话。
   */
  function newConversation(title = '新对话') {
    const draft = conversations.value.find(c => !c.session_id && !(c.messages || []).length)
    if (draft) {
      currentId.value = draft.id
      return draft.id
    }
    const now = new Date().toISOString()
    const id = 'local-' + Date.now().toString()
    conversations.value.unshift({
      id,
      session_id: null,
      title,
      messages: [],
      createdAt: now,
      updatedAt: now,
      loaded: true
    })
    currentId.value = id
    save()
    return id
  }

  /**
   * 打开会话：切换指针 + 从服务端拉取消息并**整段替换**。
   * 这是「不同会话互不串台」的落点。
   */
  async function openSession(localId) {
    const conv = conversations.value.find(c => c.id === localId)
    if (!conv) return null
    currentId.value = conv.id
    if (!conv.session_id) {
      conv.loaded = true
      return conv
    }
    try {
      const messages = (await fetchSessionMessages(conv.session_id)) || []
      conv.messages = messages.map(mapServerMessage)
      conv.loaded = true
      conv.loadError = false
    } catch (e) {
      conv.messages = []
      conv.loaded = true
      conv.loadError = true
      throw e
    } finally {
      save()
    }
    return conv
  }

  /** 只切指针不拉消息（保留给不需要历史的场景） */
  function switchConversation(id) {
    currentId.value = id
  }

  /** 按服务端会话 id 打开（会话列表页跳转过来时用） */
  async function openSessionByServerId(sessionId) {
    let conv = conversations.value.find(c => String(c.session_id) === String(sessionId))
    if (!conv && !sessionListLoaded.value) {
      try {
        await loadSessionList()
      } catch { /* 忽略，下面统一兜底 */ }
      conv = conversations.value.find(c => String(c.session_id) === String(sessionId))
    }
    if (!conv) return null
    return openSession(conv.id)
  }

  /**
   * 加载**当前用户**的会话列表（不预取消息）。
   * 以服务端返回重建数组，而不是往现有数组里 merge——旧实现会把上一个用户
   * 残留的会话一起留在列表里，切换账号后能看到别人的会话。
   */
  async function loadSessionList(limit = 50) {
    if (!currentUserId()) {
      conversations.value = []
      currentId.value = null
      sessionListLoaded.value = true
      return []
    }
    const sessions = (await fetchSessions(limit, 0)) || []
    const drafts = conversations.value.filter(c => !c.session_id)
    const loadedById = new Map(
      conversations.value.filter(c => c.session_id).map(c => [String(c.session_id), c])
    )
    conversations.value = [
      ...drafts,
      ...sessions.map(s => {
        const existing = loadedById.get(String(s.id))
        return {
          id: existing?.id || ('srv-' + s.id),
          session_id: s.id,
          title: s.title || '未命名会话',
          // 发起时间用服务端 created_at（真值），而不是本地推测
          createdAt: s.created_at || existing?.createdAt || null,
          updatedAt: s.updated_at || existing?.updatedAt || null,
          messageCount: s.message_count ?? 0,
          preview: s.last_message_preview || '',
          messages: existing?.messages || [],
          loaded: !!existing?.loaded
        }
      })
    ]
    sessionListLoaded.value = true
    save()
    return conversations.value
  }

  /** 修改会话标题：本地立即生效，服务端失败则回滚，避免界面与库不一致 */
  async function renameConversation(localId, title) {
    const conv = conversations.value.find(c => c.id === localId)
    if (!conv) return false
    const next = (title || '').trim().slice(0, 50)
    if (!next) return false
    const previous = conv.title
    conv.title = next
    conv.updatedAt = new Date().toISOString()
    save()
    if (!conv.session_id) return true
    try {
      await updateSession(conv.session_id, { title: next })
      return true
    } catch (e) {
      conv.title = previous
      save()
      throw e
    }
  }

  /** 删除会话：本地立即移除，服务端同步软删除 */
  async function deleteConversation(localId) {
    const conv = conversations.value.find(c => c.id === localId)
    conversations.value = conversations.value.filter(c => c.id !== localId)
    if (currentId.value === localId) currentId.value = null
    save()
    if (conv?.session_id) {
      try {
        await deleteSession(conv.session_id)
      } catch { /* 本地已删，下次拉列表会自动纠正 */ }
    }
  }

  // ------------------------------------------------------------------ //
  // 消息
  // ------------------------------------------------------------------ //
  function addMessage(role, content, extra = {}) {
    let conv = conversations.value.find(c => c.id === currentId.value)
    if (!conv) {
      currentId.value = newConversation()
      conv = conversations.value.find(c => c.id === currentId.value)
    }
    const { payload: rawPayload, ...rest } = extra
    const payload = rawPayload ? normalizePayload(rawPayload) : null
    const msg = { role, content, time: new Date().toISOString(), ...rest }
    if (payload && !isEmptyPayload(payload)) msg.payload = payload
    conv.messages.push(msg)
    conv.updatedAt = msg.time
    // 「发起时间」取第一条提问的时间，而不是进入页面创建草稿的时间
    if (role === 'user' && !conv.session_id && conv.messages.filter(m => m.role === 'user').length === 1) {
      conv.createdAt = msg.time
      conv.title = content.slice(0, 28) + (content.length > 28 ? '...' : '')
    }
    save()
  }

  /** 覆盖最后一条消息（同步接口一次性返回，用于替换 loading 占位） */
  function updateLastMessage(content, extra = {}) {
    const conv = conversations.value.find(c => c.id === currentId.value)
    if (!conv || !conv.messages.length) return
    const last = conv.messages[conv.messages.length - 1]
    last.content = content
    last.loading = false   // 清除 loading 状态，显示实际内容
    if (extra.payload) {
      const payload = normalizePayload(extra.payload)
      if (!isEmptyPayload(payload)) {
        last.payload = payload
        last.needMoreInfo = !!payload.need_more_info || payload.confidence_level === 'low'
        last.needMoreInfoGuide = payload.need_more_info || null
      }
    }
    save()
  }

  /**
   * 只挂结构化载荷，不改正文（图片诊断等场景正文已单独写入）。
   *
   * 两个字段刻意分开，混用会导致历史渲染时取到布尔而炸模板：
   *  - needMoreInfo      布尔：仅表示「这条回答曾要求补充信息」
   *  - needMoreInfoGuide 对象：{reason, suggestions, agri_station_tip}，用于渲染引导卡片
   */
  function updateLastPayload(payload) {
    const conv = conversations.value.find(c => c.id === currentId.value)
    if (!conv || !conv.messages.length) return
    const last = conv.messages[conv.messages.length - 1]
    if (last.role !== 'assistant') return
    const normalized = normalizePayload(payload)
    if (isEmptyPayload(normalized) && !normalized.need_more_info) return
    last.payload = normalized
    last.needMoreInfo = !!normalized.need_more_info || normalized.confidence_level === 'low'
    last.needMoreInfoGuide = normalized.need_more_info || null
    save()
  }

  /** 后端返回会话 id 后回填，并把本地 id 换成服务端 id，便于会话列表页跳转 */
  function updateSessionId(sessionId, extra = {}) {
    const conv = conversations.value.find(c => c.id === currentId.value)
    if (!conv || !sessionId) return
    conv.session_id = sessionId
    conv.id = conv.id.startsWith('local-') ? 'srv-' + sessionId : conv.id
    if (extra.createdAt) conv.createdAt = extra.createdAt
    if (extra.updatedAt) conv.updatedAt = extra.updatedAt
    currentId.value = conv.id
    save()
  }

  // ------------------------------------------------------------------ //
  // 生命周期
  // ------------------------------------------------------------------ //
  /**
   * 登录用户变化时调用（登录成功 / 退出登录 / 进入问答页）：
   * 丢弃内存里的会话，改从**新用户自己的**存储桶读取。
   * 未登录时清空且不落盘。
   */
  function resetForUser() {
    conversations.value = loadConversations()
    currentId.value = null
    isStreaming.value = false
    sessionListLoaded.value = false
  }

  function clearAll() {
    conversations.value = []
    currentId.value = null
    sessionListLoaded.value = false
    save()
  }

  function loadConversations() {
    const key = storageKey()
    if (!key) return []
    try {
      const parsed = uni.getStorageSync(key)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }

  function save() {
    const key = storageKey()
    // 未登录一律不落盘：宁可不缓存，也不能写进任何用户都能读到的键
    if (!key) return
    try {
      uni.setStorageSync(key, slimForPersist(conversations.value))
    } catch (e) {
      // 超限时退化为只保留最近 5 条的完整载荷，保证聊天记录本身不丢
      try {
        const recent = conversations.value.slice(0, 5)
        const older = conversations.value.slice(5).map(c => ({
          ...c,
          messages: (c.messages || []).map(({ payload, ...rest }) => rest)
        }))
        uni.setStorageSync(key, [...recent, ...older].slice(0, 60))
      } catch (e2) {
        console.error('保存聊天记录失败', e2)
      }
    }
  }

  return {
    conversations,
    currentId,
    isStreaming,
    sessionListLoaded,
    currentConversation,
    currentMessages,
    currentTitle,
    currentSessionId,
    newConversation,
    openSession,
    openSessionByServerId,
    switchConversation,
    loadSessionList,
    renameConversation,
    deleteConversation,
    addMessage,
    updateLastMessage,
    updateLastPayload,
    updateSessionId,
    resetForUser,
    clearAll
  }
})
