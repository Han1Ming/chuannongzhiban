import { post, get, put as httpPut, del } from './request'

/**
 * @typedef {Object} SourceRef
 * @property {'kb'|'kg'|'policy'|'weather'|'web'} [source_type] 来源类型
 * @property {string} [source_id]
 * @property {string} [title]
 * @property {number} [score]       原始检索分数（向量检索下是距离，越小越相关）
 * @property {number} [similarity]  统一到 0~1 的相似度，越大越相关；优先展示这个
 * @property {string} [excerpt]
 * @property {Object} [graph_path]
 */

/**
 * @typedef {Object} GraphPath
 * @property {string} [query]
 * @property {string[]} [path]   节点名序列
 * @property {string[]} [rels]   相邻节点间的关系类型（HARMS / TREATED_BY ...）
 * @property {Array<{name:string,type:string}>} [nodes]
 * @property {Array<Object>} [links]
 * @property {'kg'} [source]
 */

/**
 * @typedef {Object} AgentTrace
 * @property {string} [intent]
 * @property {string[]} [route]        经过的 Agent 顺序
 * @property {string} [current]
 * @property {string} [final_agent]
 * @property {Array<{agent:string,status:string,elapsed_ms:number,summary:string}>} [steps]
 * @property {number} [elapsed_ms]
 * @property {boolean} [degraded]      是否降级处理
 * @property {string|null} [error]
 */

/**
 * @typedef {Object} SourceMeta
 * @property {number} [api_version]
 * @property {'embedded'|'neo4j'|'unavailable'} [kg_mode]
 * @property {number} [kg_hits]
 * @property {number} [kb_hits]
 * @property {number} [policy_hits]
 * @property {'vector'|'hybrid'|'graph'} [retrieval_mode]
 * @property {boolean} [degraded]
 * @property {string|null} [degraded_reason]
 * @property {'inline'|'llm_extract'|'rule_from_graph'|'none'} [dtm_source]
 * @property {string[]} [parse_warnings]
 */

/**
 * @typedef {Object} Prescription 结构化处方（DTM），低置信度时后端返回 null
 * @property {string} [diagnosis]
 * @property {string} [severity]           轻度 | 中度 | 重度
 * @property {number} [confidence]
 * @property {'high'|'medium'|'low'|'unknown'} [confidence_level]
 * @property {string} [crop]
 * @property {string} [region]
 * @property {string} [season]
 * @property {Array<{step:number,action:string,detail:string,timing:string,method:string,
 *   chemicals:Array<{name:string,spec:string,dosage:string,method:string}>}>} [immediate_actions]
 * @property {Array<Object>} [follow_up]
 * @property {{currency:string,area_mu:number,items:Array<Object>,labor:Object,total:number,
 *   note:string,data_source:string}} [cost_estimate]
 * @property {Array<{level:string,code:string,message:string,basis:string}>} [risk_warnings]
 * @property {Array<{item:string,passed:boolean,detail:string}>} [fitness_check]
 * @property {SourceRef[]} [sources]
 * @property {boolean} [validated]
 * @property {string[]} [validation_errors]
 * @property {'inline'|'llm_extract'|'rule_from_graph'} [generated_by]
 */

/**
 * @typedef {Object} ChatSyncResult /chat/sync 的 data 对象
 * @property {string} response          自然语言回答（已剥离机器可读块）
 * @property {number} session_id
 * @property {number} [api_version]
 * @property {'prescription'|'diagnose'|'fact'|'report'} [intent]
 * @property {Prescription|null} [prescription]
 * @property {{symptoms:string[],environment:string[],knowledge_match:string[],
 *   excluded:string[],conclusion:string}} [reasoning_chain]
 * @property {SourceRef[]} [sources]
 * @property {GraphPath[]} [graph_paths]
 * @property {number} [confidence]
 * @property {'high'|'medium'|'low'|'unknown'} [confidence_level]
 * @property {{reason:string,suggestions:string[],agri_station_tip:string}|null} [need_more_info]
 * @property {Array<{level:string,code:string,message:string,basis:string}>} [risk_warnings]
 * @property {AgentTrace} [agent_trace]
 * @property {SourceMeta} [source_meta]
 */

/**
 * @typedef {Object} MessageOut GET /chat/sessions/{id}/messages 的单条消息
 * @property {number} id
 * @property {'user'|'assistant'} role
 * @property {string} content
 * @property {string} [intent]
 * @property {string} created_at
 * @property {number} [api_version]
 * @property {Prescription|null} [prescription]
 * @property {Object} [reasoning_chain]
 * @property {SourceRef[]} [sources]
 * @property {GraphPath[]} [graph_paths]
 * @property {number} [confidence]
 * @property {string} [confidence_level]
 * @property {boolean|null} [need_more_info] 注意：这里是**布尔**，不是引导对象
 * @property {Array<Object>} [risk_warnings]
 * @property {AgentTrace} [agent_trace]
 * @property {SourceMeta} [source_meta]
 */

/**
 * 同步聊天（小程序使用同步接口，与网页端的流式接口不同）
 * @param {string} query 用户提问
 * @param {number|null} [sessionId] 会话 id，空则后端新建
 * @returns {Promise<ChatSyncResult>} request.js 已解包，直接拿到 data 对象
 */
export function chatSync(query, sessionId) {
  const data = { query }
  if (sessionId) data.session_id = sessionId
  return post('/chat/sync', data)
}

/**
 * 获取会话列表
 * @param {number} [limit]
 * @param {number} [offset]
 */
export function fetchSessions(limit = 50, offset = 0) {
  return get('/chat/sessions', { limit, offset })
}

/**
 * 更新会话
 * @param {number} sessionId
 * @param {{title?:string,is_deleted?:boolean}} data
 */
export function updateSession(sessionId, data) {
  return httpPut(`/chat/sessions/${sessionId}`, data)
}

/**
 * 删除会话
 * @param {number} sessionId
 */
export function deleteSession(sessionId) {
  return del(`/chat/sessions/${sessionId}`)
}

/**
 * 获取会话消息（含 AI 升级新增的处方/推理链/来源/置信度等字段，历史回放用）
 * @param {number} sessionId
 * @returns {Promise<MessageOut[]>}
 */
export function fetchSessionMessages(sessionId) {
  return get(`/chat/sessions/${sessionId}/messages`)
}
