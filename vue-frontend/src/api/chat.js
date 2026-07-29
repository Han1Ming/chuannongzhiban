import req from './request'

export const chatSync = q => req.post('/chat/sync', { query: q })

export async function chatStream(query, sessionId = null, signal = null) {
  const token = localStorage.getItem('cnzb_token')
  const body = { query }
  if (sessionId) body.session_id = sessionId
  return fetch('/chat/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
    signal
  })
}

// 从后端加载会话列表
export function fetchSessions(limit, offset) {
  return req.get('/chat/sessions', { limit, offset })
}

// 从后端加载会话消息
export function fetchSessionMessages(sessionId) {
  return req.get(`/chat/sessions/${sessionId}/messages`)
}
