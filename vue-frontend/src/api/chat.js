import req from './request'

/**
 * @typedef {Object} ChatPayload
 * AI 能力升级（阶段 1~5）增量载荷。所有字段均可能缺失或为 null，
 * 网页端一律经 `@/utils/aiTypes` 的 normalizePayload 归一化后再渲染。
 * @property {number} [api_version]
 * @property {'prescription'|'diagnose'|'fact'|'report'} [intent]
 * @property {Object|null} [prescription]            结构化处方（诊断/措施/成本/风险/依据）
 * @property {Object|null} [reasoning_chain]         推理链 {symptoms, environment, knowledge_match, excluded, conclusion}
 * @property {Object[]} [sources]                    SourceRef[]：{source_type, source_id, title, score, similarity, excerpt, graph_path}
 * @property {Object[]} [graph_paths]                GraphPath[]：{query, path[], rels[], nodes[{name,type}], links[], source}
 * @property {number|null} [confidence]              0~1 置信度数值
 * @property {'high'|'medium'|'low'|'unknown'} [confidence_level]
 * @property {Object|null} [need_more_info]          {reason, suggestions[], agri_station_tip}
 * @property {Object[]} [risk_warnings]              RiskWarning[]：{level, code, message, basis}
 * @property {Object|null} [agent_trace]             多智能体链路：{route[], current, final_agent, steps[], elapsed_ms, degraded, error}
 * @property {Object|null} [source_meta]             检索元信息：{kg_mode, kg_hits, kb_hits, policy_hits, retrieval_mode, degraded, dtm_source, parse_warnings[]}
 */

/**
 * @typedef {Object} ChatSyncResponse
 * @property {string} response                       自然语言回答（已剥离机器可读块）
 * @property {number} session_id
 * @property {number} api_version
 * @property {'prescription'|'diagnose'|'fact'|'report'} [intent]
 * @property {Object|null} [prescription]
 * @property {Object|null} [reasoning_chain]
 * @property {Object[]} [sources]
 * @property {Object[]} [graph_paths]
 * @property {number|null} [confidence]
 * @property {'high'|'medium'|'low'|'unknown'} [confidence_level]
 * @property {Object|null} [need_more_info]
 * @property {Object[]} [risk_warnings]
 * @property {Object|null} [agent_trace]
 * @property {Object|null} [source_meta]
 */

/**
 * 同步问答。
 * 注意：响应经 axios 拦截器解包后**直接就是 data 对象**（不是 axios response）。
 * @param {string} q 用户问题
 * @param {number|null} [sessionId] 续聊的会话 id，省略则新建会话
 * @returns {Promise<ChatSyncResponse>}
 */
export const chatSync = (q, sessionId = null) =>
  req.post('/chat/sync', sessionId ? { query: q, session_id: sessionId } : { query: q })

/**
 * 流式问答（NDJSON，每行一个 JSON 对象）。
 * 行类型：
 *  - `{"chunk":"..."}`                    正文增量（服务端已过滤机器可读块）
 *  - `{"chunk":"...","fallback":true}`    模型不可用时的兜底文本
 *  - 末行 `{"session_id":123,"api_version":2,"payload":{...}}`  结构化载荷；
 *    解析时**必须容忍未知键**（新增键只能忽略，不能因此中断解析）
 *
 * @param {string} query
 * @param {number|null} [sessionId]
 * @param {AbortSignal|null} [signal]
 * @returns {Promise<Response>} 原始 fetch Response，调用方自行读 body 流
 */
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

/**
 * 会话列表（仅返回**当前登录用户自己**的会话，后端按 user 过滤）
 * @param {number} [limit]
 * @param {number} [offset]
 * @returns {Promise<Array<{id:number, title:string, created_at:string, updated_at:string,
 *   message_count:number, last_message_preview:string, is_deleted:boolean}>>}
 */
export function fetchSessions(limit, offset) {
  return req.get('/chat/sessions', { limit, offset })
}

/**
 * 重命名会话（后端会校验会话归属，越权返回 404）
 * @param {number} sessionId
 * @param {string} title
 */
export function renameSession(sessionId, title) {
  return req.put(`/chat/sessions/${sessionId}`, { title })
}

/**
 * 删除会话（后端为软删除：is_deleted=true，列表不再返回）
 * @param {number} sessionId
 */
export function deleteSession(sessionId) {
  return req.delete(`/chat/sessions/${sessionId}`)
}

/**
 * 会话消息（历史回放）。
 * MessageOut 在 content/role/intent/created_at 之外新增了增量字段，
 * 均可能为 null/缺失，由 stores/chat 的 buildPayloadFromMessage 组装成 payload。
 * 注意 `need_more_info` 这里是**布尔**（与 sync/stream 的对象语义不同）。
 * @param {number} sessionId
 * @returns {Promise<Array<Object>>}
 */
export function fetchSessionMessages(sessionId) {
  return req.get(`/chat/sessions/${sessionId}/messages`)
}
