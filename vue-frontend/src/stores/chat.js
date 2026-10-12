import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getUser } from '@/utils/auth'
import { isEmptyPayload, normalizePayload, toArray } from '@/utils/aiTypes'
import {
  fetchSessions,
  fetchSessionMessages,
  renameSession as apiRenameSession,
  deleteSession as apiDeleteSession,
} from '@/api/chat'

/**
 * 会话隔离的三条硬规则（修的就是这三处）：
 *
 * 1. **存储键必须绑定用户 id，未登录不落盘。**
 *    旧实现回落到 `'guest'`，凡是拿不到 user 对象的场景（存储被清、字段缺失）
 *    都会共用同一个 localStorage 桶，是「A 的记录出现在 B 的列表里」的直接来源。
 *
 * 2. **切换会话必须整段替换消息，不能合并。**
 *    每个会话的 messages 独立持有，`openSession` 从服务端拉取后**整体覆盖**，
 *    因此会话之间不可能串台。
 *
 * 3. **会话列表以服务端为准，登录用户变化时重置。**
 *    `loadSessionList` 用服务端返回的当前用户会话重建列表（只保留未发的本地草稿），
 *    账号切换时调用 `resetForUser()` 清掉上一个用户的内存数据。
 */
const STORAGE_PREFIX = 'cnzb_chats_user_'

/** localStorage 单条来源摘要的截断长度：excerpt 是最大体积来源，截断后才能多存几轮对话 */
const EXCERPT_LIMIT = 200

/** 当前登录用户 id；未登录返回 null。 */
function currentUserId() {
  const user = getUser()
  const id = user?.id ?? user?.user_id
  if (id === null || id === undefined || id === '') return null
  return String(id)
}

function userKey() {
  const id = currentUserId()
  return id ? STORAGE_PREFIX + id : null
}

/**
 * 持久化前的瘦身：只截断 payload 里的原文摘要，其余字段保留（卡片渲染依赖它们）。
 * 不做整体丢弃，否则刷新页面后处方/依据会消失，用户会以为功能坏了。
 */
function slimForPersist(conversations) {
  return conversations.slice(0, 100).map((c) => ({
    ...c,
    // 未加载过消息的会话不把 loaded=false 写死，刷新后仍会按需拉取
    messages: (c.messages || []).map((m) => {
      if (!m.payload) return m
      const trimSources = (list) =>
        toArray(list).map((s) =>
          s && s.excerpt && s.excerpt.length > EXCERPT_LIMIT
            ? { ...s, excerpt: s.excerpt.slice(0, EXCERPT_LIMIT) + '…' }
            : s,
        )
      const prescription = m.payload.prescription
      return {
        ...m,
        payload: {
          ...m.payload,
          sources: trimSources(m.payload.sources),
          prescription: prescription
            ? { ...prescription, sources: trimSources(prescription.sources) }
            : prescription,
        },
      }
    }),
  }))
}

/**
 * 把后端 MessageOut 的增量字段组装成前端 payload 形状。
 * 老消息这些字段全是 null/缺失，返回 null，渲染时自动回退纯文本。
 */
function buildPayloadFromMessage(m) {
  const hasAny =
    m.prescription ||
    m.reasoning_chain ||
    toArray(m.sources).length ||
    toArray(m.graph_paths).length ||
    (m.confidence !== null && m.confidence !== undefined) ||
    m.confidence_level ||
    m.need_more_info ||
    toArray(m.risk_warnings).length ||
    m.agent_trace ||
    m.source_meta ||
    m.api_version
  if (!hasAny) return null

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
    source_meta: m.source_meta,
  })
  // 后端 MessageOut 的 need_more_info 是布尔（只表示「曾提示补充信息」），
  // 无法还原 reason/suggestions；这里补一个空对象让引导组件出兜底文案而不是整块消失。
  if (!payload.need_more_info && m.need_more_info) {
    payload.need_more_info = { reason: '', suggestions: [], agri_station_tip: '' }
  }
  return isEmptyPayload(payload) ? null : payload
}

/** 服务端消息 → 本地消息（含结构化载荷与两个 need_more_info 语义的区分）。 */
function mapServerMessage(m) {
  const msg = { role: m.role, content: m.content, time: m.created_at }
  const payload = buildPayloadFromMessage(m)
  if (payload) {
    msg.payload = payload
    // needMoreInfo(布尔) 与 needMoreInfoGuide(对象) 语义不同，见 updateLastPayload 注释
    msg.needMoreInfo = !!m.need_more_info || payload.confidence_level === 'low'
    msg.needMoreInfoGuide = payload.need_more_info || null
  }
  return msg
}

export const useChatStore = defineStore('chat', () => {
  const conversations = ref(load())
  const currentId = ref(null)
  const isStreaming = ref(false)
  /** 会话列表是否已从服务端拉取过，避免重复请求 */
  const sessionListLoaded = ref(false)

  const currentConversation = computed(
    () => conversations.value.find((c) => c.id === currentId.value) || null,
  )
  // 消息严格取自当前会话对象，切换会话不可能读到别的会话的消息
  const currentMessages = computed(() => currentConversation.value?.messages || [])

  // ------------------------------------------------------------------ //
  // 会话的增删改查
  // ------------------------------------------------------------------ //
  /**
   * 新建一个空白会话。
   * 已经存在「一条消息都没发过」的草稿时会复用它，避免反复进入页面堆出一串空会话。
   */
  function newConversation(title = '新对话') {
    const draft = conversations.value.find((c) => !c.session_id && !(c.messages || []).length)
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
      loaded: true,
    })
    currentId.value = id
    save()
    return id
  }

  /** 兼容旧调用名 */
  const newConv = newConversation

  /**
   * 打开会话：先把 currentId 切过去，再从服务端拉取消息并**整段替换**该会话的消息。
   * 这就是「不同会话互不串台」的落点。
   */
  async function openSession(localId) {
    const conv = conversations.value.find((c) => c.id === localId)
    if (!conv) return
    currentId.value = conv.id
    if (!conv.session_id) {
      conv.loaded = true
      return
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
  }

  /** 兼容旧调用名：只切换指针，不拉取消息（保留给不需要历史的场景） */
  function switchConversation(id) {
    currentId.value = id
  }

  /**
   * 从服务端加载**当前用户**的会话列表。
   *
   * 关键：以服务端返回的列表**重建** conversations，而不是往现有数组里 merge。
   * 旧实现用 hydrateFromServer 往数组里 unshift，上一个用户残留的会话不会被清掉，
   * 于是切换账号后侧边栏会同时出现两个用户的会话。
   *
   * 只保留本地「还没发过消息的草稿会话」，其余一切以服务端为准。
   */
  async function loadSessionList(limit = 50) {
    if (!currentUserId()) {
      conversations.value = []
      currentId.value = null
      sessionListLoaded.value = true
      return []
    }
    const sessions = (await fetchSessions(limit, 0)) || []
    const drafts = conversations.value.filter((c) => !c.session_id)
    const loadedById = new Map(
      conversations.value.filter((c) => c.session_id).map((c) => [String(c.session_id), c]),
    )

    conversations.value = [
      ...drafts,
      ...sessions.map((s) => {
        const existing = loadedById.get(String(s.id))
        return {
          id: existing?.id || 'srv-' + s.id,
          session_id: s.id,
          title: s.title || '未命名会话',
          // 创建时间用于侧边栏「发起时间」，优先用服务端真值
          createdAt: s.created_at || existing?.createdAt || null,
          updatedAt: s.updated_at || existing?.updatedAt || null,
          messageCount: s.message_count ?? 0,
          preview: s.last_message_preview || '',
          messages: existing?.messages || [],
          loaded: !!existing?.loaded,
        }
      }),
    ]
    sessionListLoaded.value = true
    save()
    return conversations.value
  }

  /** 修改会话标题：本地立即生效，有服务端会话时同步持久化 */
  async function renameConversation(localId, title) {
    const conv = conversations.value.find((c) => c.id === localId)
    if (!conv) return false
    const next = (title || '').trim().slice(0, 50)
    if (!next) return false
    const previous = conv.title
    conv.title = next
    conv.updatedAt = new Date().toISOString()
    save()
    if (!conv.session_id) return true
    try {
      await apiRenameSession(conv.session_id, next)
      return true
    } catch (e) {
      conv.title = previous // 服务端失败则回滚，避免界面与库不一致
      save()
      throw e
    }
  }

  /** 删除会话：本地立即移除，有服务端会话时同步软删除 */
  async function deleteConversation(localId) {
    const conv = conversations.value.find((c) => c.id === localId)
    conversations.value = conversations.value.filter((c) => c.id !== localId)
    if (currentId.value === localId) currentId.value = null
    save()
    if (conv?.session_id) {
      try {
        await apiDeleteSession(conv.session_id)
      } catch {
        /* 服务端删除失败不回滚本地：用户已表达删除意图，下次拉列表会自动纠正 */
      }
    }
  }

  // ------------------------------------------------------------------ //
  // 消息
  // ------------------------------------------------------------------ //
  function addMsg(role, content, extra = {}) {
    let conv = conversations.value.find((c) => c.id === currentId.value)
    if (!conv) {
      currentId.value = newConversation()
      conv = conversations.value.find((c) => c.id === currentId.value)
    }
    const { payload: rawPayload, ...rest } = extra
    // payload 一律在这里归一化：组件只认一种形状，历史数据缺字段也不会崩
    const payload = rawPayload ? normalizePayload(rawPayload) : null
    const msg = { role, content, time: new Date().toISOString(), ...rest }
    if (payload && !isEmptyPayload(payload)) msg.payload = payload
    conv.messages.push(msg)
    conv.updatedAt = msg.time
    // 「发起时间」取第一条提问的时间，而不是进入页面创建草稿的时间：
    // 用户可能进页面后过一会儿才发问，用草稿创建时间会显示偏早
    if (role === 'user' && !conv.session_id && conv.messages.filter((m) => m.role === 'user').length === 1) {
      conv.createdAt = msg.time
      conv.title = content.slice(0, 28) + (content.length > 28 ? '…' : '')
    }
    save()
  }

  function appendLast(content) {
    const conv = conversations.value.find((c) => c.id === currentId.value)
    if (!conv || !conv.messages.length) return
    const last = conv.messages[conv.messages.length - 1]
    if (last.role === 'assistant') last.content += content
    else conv.messages.push({ role: 'assistant', content, time: new Date().toISOString() })
    conv.updatedAt = new Date().toISOString()
    save()
  }

  /**
   * 流式末行 / sync 响应到达后把结构化载荷挂到最后一条 assistant 消息。
   * 两个字段刻意分开：
   *  - needMoreInfo      布尔：后端 MessageOut 的口径，仅表示「这条回答曾要求补充信息」
   *  - needMoreInfoGuide 对象：{reason, suggestions, agri_station_tip}，用于渲染引导卡片
   * 混用会导致历史会话渲染引导时取到 true 而炸模板。
   */
  function updateLastPayload(payload) {
    const conv = conversations.value.find((c) => c.id === currentId.value)
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

  /**
   * 「重新生成」的前置步骤：把**最后一条** assistant 消息整条摘掉（含其结构化 payload）。
   *
   * 为什么必须由 store 提供：旧代码里重生成只能"再发一次问题"，于是新旧两条回答会
   * 首尾叠在同一条会话里，用户看到两份互相矛盾的答案。
   * 这里只允许摘最后一条——中间轮次重生成会连带丢掉后续对话，语义上不该允许，
   * 因此返回 null 让调用方明确拒绝，而不是悄悄改坏历史。
   *
   * @returns {object|null} 被摘掉的消息；不满足条件时为 null
   */
  function dropLastAssistant() {
    const conv = conversations.value.find((c) => c.id === currentId.value)
    if (!conv || !conv.messages.length) return null
    const last = conv.messages[conv.messages.length - 1]
    if (last.role !== 'assistant') return null
    conv.messages.pop()
    conv.updatedAt = new Date().toISOString()
    save()
    return last
  }

  /**
   * 赞 / 踩：本期为**纯前端态**（后端无反馈接口，chat_messages 也没有反馈列）。
   * 记在消息对象上，随 slimForPersist 一起落 localStorage，刷新后仍在；
   * 再点一次同一个值 = 取消。将来后端补列时，这里换成接口调用即可，组件不用动。
   */
  function setFeedback(index, value) {
    const conv = conversations.value.find((c) => c.id === currentId.value)
    const msg = conv?.messages?.[index]
    if (!msg || msg.role !== 'assistant') return
    msg.feedback = value || null
    save()
  }

  /** 后端返回会话 id 后回填到当前会话，并把标题/时间与服务端对齐 */
  function updateSessionId(sessionId, extra = {}) {
    const conv = conversations.value.find((c) => c.id === currentId.value)
    if (!conv || !sessionId) return
    conv.session_id = sessionId
    conv.id = conv.id.startsWith('local-') ? 'srv-' + sessionId : conv.id
    if (extra.title) conv.title = extra.title
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
   * 未登录时清理为空且不落盘，避免把上一个用户的数据写进公共键。
   */
  function resetForUser() {
    conversations.value = load()
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

  function load() {
    const key = userKey()
    if (!key) return []
    try {
      const parsed = JSON.parse(localStorage.getItem(key))
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }

  function save() {
    const key = userKey()
    // 未登录一律不落盘：宁可不缓存，也不能把聊天记录写进任何用户都能读到的键
    if (!key) return
    try {
      localStorage.setItem(key, JSON.stringify(slimForPersist(conversations.value)))
    } catch {
      // 配额写满时退化为不持久化本轮结构化载荷，保证聊天本身不中断
      try {
        localStorage.setItem(
          key,
          JSON.stringify(
            conversations.value.slice(0, 100).map((c) => ({
              ...c,
              messages: (c.messages || []).map(({ payload, ...rest }) => rest),
            })),
          ),
        )
      } catch {
        /* 仍然失败则放弃本次持久化 */
      }
    }
  }

  return {
    conversations, currentId, isStreaming, sessionListLoaded,
    currentConversation, currentMessages,
    newConversation, newConv, openSession, switchConversation,
    loadSessionList, renameConversation, deleteConversation,
    addMsg, appendLast, updateLastPayload, updateSessionId,
    dropLastAssistant, setFeedback,
    resetForUser, clearAll,
  }
})
