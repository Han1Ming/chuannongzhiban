import { post, get, put as httpPut, del } from './request'

// 同步聊天（MVP 使用）
export function chatSync(query, sessionId) {
  const data = { query }
  if (sessionId) data.session_id = sessionId
  return post('/chat/sync', data)
}

// 获取会话列表
export function fetchSessions(limit = 50, offset = 0) {
  return get('/chat/sessions', { limit, offset })
}

// 更新会话
export function updateSession(sessionId, data) {
  return httpPut(`/chat/sessions/${sessionId}`, data)
}

// 删除会话
export function deleteSession(sessionId) {
  return del(`/chat/sessions/${sessionId}`)
}

// 获取会话消息
export function fetchSessionMessages(sessionId) {
  return get(`/chat/sessions/${sessionId}/messages`)
}
