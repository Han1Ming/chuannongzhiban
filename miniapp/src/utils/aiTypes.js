/**
 * AI 能力升级增量载荷的类型归一化与展示常量（小程序端）。
 *
 * 为什么需要这一层：
 * 后端（backend/schemas/ai.py）的所有增量字段都是「可选的、宽容的」，
 * 模型可能漏字段、给 null、给字符串数字；如果页面直接读 result.prescription.immediate_actions，
 * 就会在字段缺失时抛错白屏。这里统一做一次归一化，页面只面对稳定形状。
 *
 * 与网页端（vue-frontend）保持同构：字段名、置信度阈值、图谱关系/节点中文映射
 * 均与后端 backend/schemas/ai.py、backend/services/confidence_service.py 对齐，
 * 便于后续把两端的渲染逻辑统一。
 */

/* ------------------------------------------------------------------ *
 * 置信度分级
 * ------------------------------------------------------------------ */

/**
 * 四个等级的展示配置。
 * 颜色沿用项目色板：绿 #2D7A4A / 橙 #E6A23C / 红 #DC2626 / 棕灰 #8B7355。
 */
export const CONFIDENCE_LEVELS = {
  high: { key: 'high', label: '高', color: '#2D7A4A', bg: '#E8F5E9', border: '#B7DFC2' },
  medium: { key: 'medium', label: '中', color: '#E6A23C', bg: '#FDF3E3', border: '#F3D9AE' },
  low: { key: 'low', label: '低', color: '#DC2626', bg: '#FDECEC', border: '#F5C2C2' },
  unknown: { key: 'unknown', label: '未知', color: '#8B7355', bg: '#F5F1EA', border: '#E8E0D4' }
}

// 与后端 confidence_service 的默认阈值一致：> 0.85 高，>= 0.70 中，其余低
export const CONFIDENCE_THRESHOLDS = { high: 0.85, medium: 0.70 }

/**
 * 把各种写法的置信度归一化到 0~1，无法解析返回 null。
 * 与后端 ConfidenceService.normalize_confidence 行为保持一致（>1 视为百分数）。
 * @param {any} value
 * @returns {number|null}
 */
export function normalizeConfidence(value) {
  if (value === null || value === undefined || value === '') return null
  let num = value
  if (typeof num === 'string') {
    num = parseFloat(num.trim().replace('%', ''))
  }
  num = Number(num)
  if (!isFinite(num)) return null
  if (num > 1) num = num / 100
  if (num < 0) num = 0
  if (num > 1) num = 1
  return Math.round(num * 10000) / 10000
}

/**
 * 由置信度数值推导等级；已带 confidence_level 时优先信任后端结果。
 * @param {number|string|null} confidence
 * @param {string} [level] 后端给出的 confidence_level
 * @returns {'high'|'medium'|'low'|'unknown'}
 */
export function confidenceLevelOf(confidence, level) {
  if (level && CONFIDENCE_LEVELS[level]) return level
  const value = normalizeConfidence(confidence)
  if (value === null) return 'unknown'
  if (value > CONFIDENCE_THRESHOLDS.high) return 'high'
  if (value >= CONFIDENCE_THRESHOLDS.medium) return 'medium'
  return 'low'
}

/** 取等级的展示配置（永不返回 undefined） */
export function confidenceMeta(level) {
  return CONFIDENCE_LEVELS[level] || CONFIDENCE_LEVELS.unknown
}

/* ------------------------------------------------------------------ *
 * 图谱中文映射
 * ------------------------------------------------------------------ */

/** 关系中文映射：与 backend/knowledge_graph/store.py 的 RELATION_LABELS 一致 */
export const RELATION_LABELS = {
  HARMS: '危害/易感',
  MANIFESTS: '表现为',
  TREATED_BY: '防治用',
  HAS_INGREDIENT: '成分为',
  AVAILABLE_AT: '可购买于',
  RECOMMEND_OP: '推荐操作',
  INDUCED_BY: '诱发条件',
  COMORBID: '并发'
}

/** 节点类型中文：与 backend NODE_LABELS 对齐 */
export const NODE_LABELS = {
  Crop: '作物/畜种',
  Disease: '病害',
  Pest: '虫害',
  Symptom: '症状',
  Drug: '农药/兽药',
  Operation: '农事操作',
  Condition: '环境条件',
  Channel: '购买渠道',
  Ingredient: '药物成分'
}

/** 节点配色：沿用网页端 knowledgeGraph.js 色板，补充新增类型 */
export const NODE_COLORS = {
  Crop: '#27AE60',
  Disease: '#E74C3C',
  Pest: '#E67E22',
  Symptom: '#F39C12',
  Drug: '#3498DB',
  Operation: '#16A085',
  Condition: '#8E44AD',
  Channel: '#95A5A6',
  Ingredient: '#9B59B6'
}

/** 来源类型中文（SourceRef.source_type） */
export const SOURCE_TYPE_LABELS = {
  kb: '知识库',
  kg: '知识图谱',
  policy: '政策文件',
  weather: '天气',
  web: '网络'
}

/** 风险等级展示配置（RiskWarning.level） */
export const RISK_LEVELS = {
  high: { label: '高风险', color: '#DC2626', bg: '#FDECEC', icon: '⛔' },
  medium: { label: '中风险', color: '#E6A23C', bg: '#FDF3E3', icon: '⚠️' },
  low: { label: '低风险', color: '#8B7355', bg: '#F5F1EA', icon: 'ℹ️' }
}

/** 意图中文（intent）：与后端 supervisor.INTENT_* 一致 */
export const INTENT_LABELS = {
  prescription: '防治处方',
  diagnose: '病虫害诊断',
  fact: '知识问答',
  report: '报告生成'
}

/**
 * 多智能体步骤中文（agent_trace.steps[].agent）。
 * 取值来自后端 agent/multi_agent/supervisor.py 的 ROUTES：
 * fact→[knowledge]，prescription→[knowledge,decision]，diagnose→[diagnose,knowledge,decision]，
 * report→[diagnose,knowledge,decision,report]；entry/finalize 是图内部的入口与汇总节点。
 */
export const AGENT_LABELS = {
  knowledge: '知识检索',
  diagnose: '诊断推理',
  decision: '决策处方',
  report: '报告汇总',
  entry: '任务开始',
  finalize: '结果汇总',
  supervisor: '调度器',
  unknown: '未知环节'
}

/** 处方生成方式中文（Prescription.generated_by） */
export const GENERATED_BY_LABELS = {
  inline: '模型直接给出',
  llm_extract: '从模型回答中抽取',
  rule_from_graph: '由知识图谱规则生成'
}

/** 成本区必须显式提示的价格口径（与网页端同一句文案） */
export const COST_PRICE_NOTE = '价格为示例参考价，以当地农资店实际报价为准'

/** 关系中文，未知关系原样返回，避免出现空白 */
export function relationLabel(rel) {
  if (!rel) return ''
  return RELATION_LABELS[rel] || rel
}

/** 节点类型中文，未知类型原样返回 */
export function nodeLabel(type) {
  if (!type) return ''
  return NODE_LABELS[type] || type
}

/** 节点颜色，未知类型给中性灰 */
export function nodeColor(type) {
  return NODE_COLORS[type] || '#8B7355'
}

/** 来源类型中文 */
export function sourceTypeLabel(type) {
  return SOURCE_TYPE_LABELS[type] || type || '未知来源'
}

/** Agent 中文 */
export function agentLabel(agent) {
  if (!agent) return ''
  return AGENT_LABELS[agent] || agent
}

/* ------------------------------------------------------------------ *
 * 归一化：单块
 * ------------------------------------------------------------------ */

function asArray(value) {
  if (Array.isArray(value)) return value.filter(v => v !== null && v !== undefined)
  return []
}

function asStringArray(value) {
  return asArray(value).map(v => (typeof v === 'string' ? v : String(v))).filter(s => s.length > 0)
}

/** 归一化药物条目 */
function normalizeChemical(raw) {
  if (!raw || typeof raw !== 'object') return null
  return {
    name: raw.name || '',
    spec: raw.spec || '',
    dosage: raw.dosage || '',
    method: raw.method || ''
  }
}

/** 归一化一条处方措施（immediate_actions / follow_up 共用） */
function normalizeAction(raw, index) {
  if (!raw || typeof raw !== 'object') return null
  return {
    step: typeof raw.step === 'number' ? raw.step : index + 1,
    action: raw.action || '',
    detail: raw.detail || '',
    timing: raw.timing || '',
    method: raw.method || '',
    chemicals: asArray(raw.chemicals).map(normalizeChemical).filter(Boolean)
  }
}

/** 归一化成本条目 */
function normalizeCostItem(raw) {
  if (!raw || typeof raw !== 'object') return null
  return {
    name: raw.name || '',
    spec: raw.spec || '',
    unit: raw.unit || '',
    unit_price: typeof raw.unit_price === 'number' ? raw.unit_price : null,
    quantity: typeof raw.quantity === 'number' ? raw.quantity : null,
    subtotal: typeof raw.subtotal === 'number' ? raw.subtotal : null,
    pricing_source: raw.pricing_source || ''
  }
}

/** 归一化成本估算（移动端按纵向卡片渲染，保留字段供页面自行排版） */
export function normalizeCostEstimate(raw) {
  if (!raw || typeof raw !== 'object') return null
  const labor = raw.labor && typeof raw.labor === 'object' ? raw.labor : null
  return {
    currency: raw.currency || 'CNY',
    area_mu: typeof raw.area_mu === 'number' ? raw.area_mu : null,
    items: asArray(raw.items).map(normalizeCostItem).filter(Boolean),
    labor: labor
      ? {
          hours: typeof labor.hours === 'number' ? labor.hours : null,
          rate: typeof labor.rate === 'number' ? labor.rate : null,
          subtotal: typeof labor.subtotal === 'number' ? labor.subtotal : null,
          operations: asStringArray(labor.operations)
        }
      : null,
    total: typeof raw.total === 'number' ? raw.total : null,
    note: raw.note || '',
    data_source: raw.data_source || ''
  }
}

/** 归一化风险提示 */
export function normalizeRiskWarning(raw) {
  if (!raw || typeof raw !== 'object') return null
  const level = RISK_LEVELS[raw.level] ? raw.level : 'medium'
  return {
    level,
    code: raw.code || '',
    message: raw.message || '',
    basis: raw.basis || ''
  }
}

/** 归一化适配性校验项 */
function normalizeFitnessCheck(raw) {
  if (!raw || typeof raw !== 'object') return null
  return {
    item: raw.item || '',
    passed: raw.passed !== false,
    detail: raw.detail || ''
  }
}

/**
 * 归一化结构化处方（DTM）。
 * @returns {object|null} 无有效内容时返回 null，页面据此隐藏处方卡片
 */
export function normalizePrescription(raw) {
  if (!raw || typeof raw !== 'object') return null
  // 只有后端真给了内容才算有处方：低置信度时后端会显式给 null
  const hasAnyContent =
    raw.diagnosis || asArray(raw.immediate_actions).length ||
    asArray(raw.follow_up).length || raw.cost_estimate
  if (!hasAnyContent) return null
  return {
    diagnosis: raw.diagnosis || '',
    severity: raw.severity || '',
    confidence: normalizeConfidence(raw.confidence),
    confidence_level: confidenceLevelOf(raw.confidence, raw.confidence_level),
    crop: raw.crop || '',
    region: raw.region || '',
    season: raw.season || '',
    immediate_actions: asArray(raw.immediate_actions).map(normalizeAction).filter(Boolean),
    follow_up: asArray(raw.follow_up).map(normalizeAction).filter(Boolean),
    cost_estimate: normalizeCostEstimate(raw.cost_estimate),
    risk_warnings: asArray(raw.risk_warnings).map(normalizeRiskWarning).filter(Boolean),
    fitness_check: asArray(raw.fitness_check).map(normalizeFitnessCheck).filter(Boolean),
    sources: normalizeSources(raw.sources),
    validated: raw.validated === true,
    validation_errors: asStringArray(raw.validation_errors),
    generated_by: raw.generated_by || ''
  }
}

/** 归一化推理链 */
export function normalizeReasoningChain(raw) {
  if (!raw || typeof raw !== 'object') return null
  const chain = {
    symptoms: asStringArray(raw.symptoms),
    environment: asStringArray(raw.environment),
    knowledge_match: asStringArray(raw.knowledge_match),
    excluded: asStringArray(raw.excluded),
    conclusion: raw.conclusion || ''
  }
  // 兼容模型可能用到 observation / steps 的写法
  if (!chain.symptoms.length && raw.observation) chain.symptoms = [String(raw.observation)]
  if (!chain.knowledge_match.length && asArray(raw.steps).length) {
    chain.knowledge_match = asStringArray(raw.steps)
  }
  const meaningful =
    chain.symptoms.length || chain.environment.length ||
    chain.knowledge_match.length || chain.excluded.length || chain.conclusion
  return meaningful ? chain : null
}

/** 归一化单条来源 */
export function normalizeSource(raw) {
  if (!raw || typeof raw !== 'object') return null
  return {
    source_type: raw.source_type || 'kb',
    source_id: raw.source_id || '',
    title: raw.title || '',
    score: typeof raw.score === 'number' ? raw.score : null,
    similarity: normalizeConfidence(raw.similarity),
    excerpt: raw.excerpt || '',
    category: raw.category || '',
    url: raw.url || '',
    graph_path: raw.graph_path && typeof raw.graph_path === 'object' ? raw.graph_path : null
  }
}

/** 归一化来源列表 */
export function normalizeSources(raw) {
  return asArray(raw).map(normalizeSource).filter(Boolean)
}

/**
 * 匹配度口径说明：
 * similarity 是后端统一到 0~1 的「越大越相关」指标，优先用它；
 * score 是原始检索分数，向量检索下通常是「距离」（越小越相关），
 * 缺失 similarity 时必须注明口径，避免把距离当成匹配度误读。
 */
export function matchRateText(item) {
  if (!item) return ''
  if (typeof item.similarity === 'number') {
    return { text: `${(item.similarity * 100).toFixed(0)}%`, note: '' }
  }
  if (typeof item.score === 'number') {
    return { text: item.score.toFixed(3), note: '原始检索距离（越小越相关）' }
  }
  return { text: '', note: '' }
}

/** 归一化一条图谱路径 */
export function normalizeGraphPath(raw) {
  if (!raw || typeof raw !== 'object') return null
  const path = asStringArray(raw.path)
  const nodes = asArray(raw.nodes).map(n => {
    if (typeof n === 'string') return { name: n, type: '' }
    return { name: n?.name || '', type: n?.type || '', description: n?.description || '' }
  }).filter(n => n.name)
  const rels = asStringArray(raw.rels)
  if (!path.length && !nodes.length) return null
  return {
    query: raw.query || '',
    path: path.length ? path : nodes.map(n => n.name),
    nodes,
    rels,
    links: asArray(raw.links),
    source: raw.source || 'kg'
  }
}

/** 归一化图谱路径列表 */
export function normalizeGraphPaths(raw) {
  return asArray(raw).map(normalizeGraphPath).filter(Boolean)
}

/** 归一化多智能体链路 */
export function normalizeAgentTrace(raw) {
  if (!raw || typeof raw !== 'object') return null
  const steps = asArray(raw.steps).map(s => ({
    agent: s?.agent || '',
    status: s?.status || 'done',
    elapsed_ms: typeof s?.elapsed_ms === 'number' ? s.elapsed_ms : null,
    summary: s?.summary || ''
  })).filter(s => s.agent)
  return {
    intent: raw.intent || '',
    route: asStringArray(raw.route),
    current: raw.current || '',
    final_agent: raw.final_agent || '',
    steps,
    elapsed_ms: typeof raw.elapsed_ms === 'number' ? raw.elapsed_ms : null,
    degraded: raw.degraded === true,
    error: raw.error || null
  }
}

/** 归一化「信息不足」引导对象（注意：与 MessageOut 里的布尔 need_more_info 不同） */
export function normalizeNeedMoreInfo(raw) {  if (!raw || typeof raw !== 'object') return null
  const reason = raw.reason || ''
  const suggestions = asStringArray(raw.suggestions)
  const tip = raw.agri_station_tip || ''
  if (!reason && !suggestions.length && !tip) return null
  return { reason, suggestions, agri_station_tip: tip }
}

/** 三路检索通道的界面元信息（与后端 services/retrieval_service.py 的 CHANNEL_META 对齐） */
export const RETRIEVAL_CHANNEL_META = {
  kb: { label: '本地知识库', icon: '📚', color: '#2D7A4A', bg: '#E8F5E9' },
  kg: { label: '知识图谱', icon: '🕸️', color: '#6D28D9', bg: '#EDE9FE' },
  web: { label: '联网搜索', icon: '🌐', color: '#4B5563', bg: '#F3F4F6' }
}

/** 通道状态文案：空结果与调用失败必须区分，否则农户以为系统坏了 */
export const RETRIEVAL_STATUS_LABELS = {
  ok: '有结果',
  empty: '无结果',
  disabled: '本次未启用',
  error: '调用失败'
}

/**
 * 归一化「三路检索」的分组结果（后端 source_meta.retrieval_channels）。
 *
 * 这是「检索来源」可收缩容器的数据源。每项 item 的 source_text 就是需求里的
 * **源文字**：知识库=洗净的片段正文、图谱=关系链、联网=标题+摘要+链接。
 */
export function normalizeRetrievalChannels(raw) {
  return asArray(raw)
    .filter((c) => c && typeof c === 'object')
    .map((c) => {
      const key = c.key || 'kb'
      const meta = RETRIEVAL_CHANNEL_META[key] || RETRIEVAL_CHANNEL_META.kb
      const items = asArray(c.items)
        .filter((it) => it && typeof it === 'object')
        .map((it) => ({
          title: it.title || '未命名来源',
          source_text: it.source_text || it.excerpt || it.content || '',
          url: it.url || '',
          source_type: it.source_type || key,
          source_type_label: SOURCE_TYPE_LABELS[it.source_type || key] || meta.label,
          doc_id: it.doc_id || '',
          category: it.category || '',
          score: typeof it.score === 'number' ? it.score : null,
          similarity: normalizeConfidence(it.similarity),
          provider: it.provider || '',
          path: asStringArray(it.path),
          graph_path: it.graph_path && typeof it.graph_path === 'object' ? it.graph_path : null
        }))
      const status = c.status || (items.length ? 'ok' : 'empty')
      return {
        key,
        label: c.label || meta.label,
        icon: c.icon || meta.icon,
        desc: c.desc || '',
        color: meta.color,
        bg: meta.bg,
        status,
        status_label: RETRIEVAL_STATUS_LABELS[status] || status,
        error: c.error || '',
        detail: c.detail || '',
        provider: c.provider || '',
        items,
        count: items.length,
        // 有源文字，或至少有一句失败/未启用的说明 → 该通道要显示出来
        has_content: items.length > 0 || !!c.error || !!c.detail
      }
    })
}

/**
 * 从回答正文里摘掉后端附带的「检索来源」折叠容器。
 *
 * 后端为了「答案自带完整依据」（Markdown/HTML 客户端、复制导出都能看到），
 * 会把三路源文字写成 `<details>` 放在正文末尾；而界面里已经有可收缩组件
 * （SourceList）在读同一份 `retrieval_channels`。不摘就是同一屏展示两遍——
 * 小程序端还会把折叠块**展平**成一大段文字，重复更明显。
 *
 * 只删标题里带 marker 的那个块：开头的「推理摘要」原样保留。
 * 按深度配平扫描——容器是嵌套 `<details>`，正则的贪婪/非贪婪都会切错。
 */
export function stripRetrievalContainer(markdown, marker = '检索来源') {
  const text = markdown || ''
  if (!text.includes(marker)) return text

  const re = /<details\b[^>]*>|<\/details\s*>/gi
  const out = []
  let depth = 0
  let last = 0
  let blockStart = -1
  let m
  while ((m = re.exec(text)) !== null) {
    if (m[0][1] !== '/') {
      if (depth === 0) blockStart = m.index
      depth += 1
      continue
    }
    if (depth > 0) depth -= 1
    if (depth === 0 && blockStart >= 0) {
      const block = text.slice(blockStart, m.index + m[0].length)
      const summary = /<summary\b[^>]*>([\s\S]*?)<\/summary\s*>/i.exec(block)
      const target = !!summary && String(summary[1]).includes(marker)
      out.push(text.slice(last, blockStart))
      if (!target) out.push(block)
      last = m.index + m[0].length
      blockStart = -1
    }
  }
  out.push(text.slice(last))
  return out.join('')
}

/** 归一化检索元信息 */
export function normalizeSourceMeta(raw) {
  if (!raw || typeof raw !== 'object') return null
  return {
    api_version: typeof raw.api_version === 'number' ? raw.api_version : 2,
    kg_mode: raw.kg_mode || '',
    kg_hits: typeof raw.kg_hits === 'number' ? raw.kg_hits : 0,
    kb_hits: typeof raw.kb_hits === 'number' ? raw.kb_hits : 0,
    policy_hits: typeof raw.policy_hits === 'number' ? raw.policy_hits : 0,
    retrieval_mode: raw.retrieval_mode || '',
    // 三路检索的分组结果：本地知识库 / 知识图谱 / 联网搜索
    retrieval_channels: normalizeRetrievalChannels(raw.retrieval_channels),
    degraded: raw.degraded === true,
    degraded_reason: raw.degraded_reason || null,
    dtm_source: raw.dtm_source || 'none',
    parse_warnings: asStringArray(raw.parse_warnings)
  }
}

/* ------------------------------------------------------------------ *
 * 归一化：整包
 * ------------------------------------------------------------------ */

/**
 * 归一化后端返回的增量载荷（/chat/sync、/multimodal/diagnose、历史消息共用）。
 * 未识别字段原样保留，避免将来后端加字段时前端直接丢数据。
 * @param {object} raw
 * @returns {object} 形状稳定的 payload
 */
export function normalizePayload(raw) {
  const src = raw && typeof raw === 'object' ? raw : {}
  const confidence = normalizeConfidence(src.confidence)
  return {
    api_version: typeof src.api_version === 'number' ? src.api_version : 2,
    intent: src.intent || null,
    prescription: normalizePrescription(src.prescription),
    reasoning_chain: normalizeReasoningChain(src.reasoning_chain),
    sources: normalizeSources(src.sources),
    graph_paths: normalizeGraphPaths(src.graph_paths),
    confidence,
    confidence_level: confidenceLevelOf(confidence, src.confidence_level),
    risk_warnings: asArray(src.risk_warnings).map(normalizeRiskWarning).filter(Boolean),
    need_more_info: normalizeNeedMoreInfo(src.need_more_info),
    agent_trace: normalizeAgentTrace(src.agent_trace),
    source_meta: normalizeSourceMeta(src.source_meta),
    // 三路检索分组结果提到顶层，页面里直接绑 m.payload.retrieval_channels
    retrieval_channels: normalizeRetrievalChannels(src.source_meta && src.source_meta.retrieval_channels)
  }
}

/**
 * 归一化单图诊断结果（/api/multimodal/diagnose 的 results[i]）。
 * 原有字段（filename/diagnosis/severity/advice 等）一律保留，
 * 保证老 UI 与 markdown 拼装逻辑不被破坏。
 * 命名与网页端 aiTypes.js 保持一致：Item 结尾 = 单图，不带 Item = 整个响应。
 * @param {object} raw
 */
export function normalizeDiagnoseResultItem(raw) {
  const src = raw && typeof raw === 'object' ? raw : {}
  const confidence = normalizeConfidence(src.confidence)
  const payload = normalizePayload(src)
  return {
    // ---- 原有字段 ----
    filename: src.filename || '',
    is_relevant: src.is_relevant !== false,
    reason: src.reason || '',
    diagnosis: src.diagnosis || '',
    severity: src.severity || '',
    confidence,
    symptoms: src.symptoms || '',
    cause: src.cause || '',
    advice: src.advice || '',
    error: src.error || '',
    // ---- 新增字段 ----
    confidence_level: confidenceLevelOf(confidence, src.confidence_level),
    confidence_label: src.confidence_label || CONFIDENCE_LEVELS[confidenceLevelOf(confidence, src.confidence_level)].label,
    prescription: payload.prescription,
    reasoning_chain: payload.reasoning_chain,
    sources: payload.sources,
    graph_paths: payload.graph_paths,
    risk_warnings: payload.risk_warnings,
    need_more_info: payload.need_more_info
  }
}

/**
 * 归一化整个诊断响应（含顶层整体置信度）。
 * 命名与网页端一致：不带 Item 的即整个响应。
 * @param {object} raw
 */
export function normalizeDiagnoseResult(raw) {
  const src = raw && typeof raw === 'object' ? raw : {}
  const overallConfidence = normalizeConfidence(src.overall_confidence)
  return {
    total: typeof src.total === 'number' ? src.total : 0,
    relevant_count: typeof src.relevant_count === 'number' ? src.relevant_count : 0,
    unrelated_images: asStringArray(src.unrelated_images),
    results: asArray(src.results).map(normalizeDiagnoseResultItem),
    summary: src.summary || '',
    api_version: typeof src.api_version === 'number' ? src.api_version : 2,
    overall_confidence: overallConfidence,
    overall_confidence_level: confidenceLevelOf(overallConfidence, src.overall_confidence_level),
    need_more_info: normalizeNeedMoreInfo(src.need_more_info),
    source_meta: normalizeSourceMeta(src.source_meta)
  }
}

/**
 * 低置信度引导的兜底文案。
 * 与后端 backend/services/confidence_service.py 的 _DEFAULT_LOW_GUIDE 保持一致：
 * 历史消息接口（MessageOut）只回传布尔 need_more_info，回放时需要本地补出引导对象。
 */
export const DEFAULT_LOW_CONFIDENCE_GUIDE = {
  reason: '图像证据不足，无法给出可靠诊断，为避免误诊暂不提供处方。',
  suggestions: [
    '拍摄病害部位特写，让病斑占画面比例更大',
    '在自然光下拍摄，避免逆光与阴影遮挡',
    '补充拍摄叶片背面与整株长势各一张',
    '同时描述发病时间、面积扩展速度和近期天气'
  ],
  agri_station_tip: '如症状持续扩展，建议携带病样咨询当地农技站或植保站。'
}

/* ------------------------------------------------------------------ *
 * 判定辅助
 * ------------------------------------------------------------------ */

/** 是否存在可渲染的处方 */
export function hasPrescription(payload) {
  return !!(payload && payload.prescription)
}

/** 是否应该展示低置信度引导（低置信度、且后端已拦截处方） */
export function shouldGuideLowConfidence(level, payload) {
  if (level !== 'low') return false
  return !!(payload && payload.need_more_info)
}

/** 增量载荷是否完全为空（空则保持纯 Markdown 展示，不渲染任何新组件） */
export function isEmptyPayload(payload) {
  if (!payload) return true
  return !(
    payload.prescription ||
    payload.reasoning_chain ||
    payload.agent_trace ||
    payload.need_more_info ||
    (payload.sources && payload.sources.length) ||
    (payload.graph_paths && payload.graph_paths.length) ||
    (payload.risk_warnings && payload.risk_warnings.length)
  )
}

/* ------------------------------------------------------------------ *
 * 持久化裁剪
 * ------------------------------------------------------------------ */

const EXCERPT_LIMIT = 200          // 依据节选最长 200 字
const GRAPH_PATH_LIMIT = 3         // 图谱路径最多保留 3 条
const STORED_WARNING_LIMIT = 5     // 风险提示最多保留 5 条
const STORED_SOURCE_LIMIT = 8      // 来源最多保留 8 条
const PARSE_WARNING_LIMIT = 3      // 解析告警最多保留 3 条

function clampText(text, limit) {
  if (typeof text !== 'string') return ''
  return text.length > limit ? text.slice(0, limit) + '…' : text
}

/**
 * 裁剪载荷用于 uni.setStorageSync 落盘。
 *
 * 为什么必须做：小程序单个 storage key 上限 1MB，历史会话累积几十条处方+图谱路径
 * 很容易超限，写失败会导致整个聊天记录丢失（store 里的 save 会直接抛错）。
 * 这里先深拷贝再裁剪，绝不改动内存中的原始对象——否则界面上已经渲染的
 * 依据节选会被截断。
 *
 * @param {object} payload 归一化后的增量载荷
 * @returns {object|null} 裁剪后的可落盘副本
 */
export function trimPayloadForStorage(payload) {
  if (!payload || typeof payload !== 'object') return null
  let copy
  try {
    copy = JSON.parse(JSON.stringify(payload))
  } catch (e) {
    return null   // 含循环引用等异常结构：宁可不落盘，也不要写坏 storage
  }

  if (Array.isArray(copy.sources)) {
    copy.sources = copy.sources.slice(0, STORED_SOURCE_LIMIT).map(s => ({
      source_type: s.source_type,
      source_id: s.source_id,
      title: clampText(s.title, 80),
      score: s.score,
      similarity: s.similarity,
      excerpt: clampText(s.excerpt, EXCERPT_LIMIT),
      category: s.category,
      url: s.url,
      graph_path: null    // 与 sources 内的图谱路径重复，落盘时丢弃
    }))
  }

  if (Array.isArray(copy.graph_paths)) {
    copy.graph_paths = copy.graph_paths.slice(0, GRAPH_PATH_LIMIT).map(p => ({
      query: clampText(p.query, 60),
      path: Array.isArray(p.path) ? p.path.slice(0, 8) : [],
      nodes: Array.isArray(p.nodes) ? p.nodes.slice(0, 8) : [],
      rels: Array.isArray(p.rels) ? p.rels.slice(0, 8) : [],
      links: [],          // links 与 nodes/rels 信息重复且体积大
      source: p.source
    }))
  }

  if (Array.isArray(copy.risk_warnings)) {
    copy.risk_warnings = copy.risk_warnings.slice(0, STORED_WARNING_LIMIT)
  }

  if (copy.prescription) {
    const p = copy.prescription
    if (Array.isArray(p.validation_errors)) p.validation_errors = p.validation_errors.slice(0, 3)
    if (Array.isArray(p.sources)) p.sources = []   // 顶层 sources 已覆盖，避免双份
    const shrinkActions = (list) => Array.isArray(list)
      ? list.map(a => ({
          step: a.step,
          action: clampText(a.action, 60),
          detail: clampText(a.detail, EXCERPT_LIMIT),
          timing: a.timing,
          method: a.method,
          chemicals: Array.isArray(a.chemicals) ? a.chemicals.slice(0, 5) : []
        }))
      : []
    p.immediate_actions = shrinkActions(p.immediate_actions)
    p.follow_up = shrinkActions(p.follow_up)
  }

  if (copy.reasoning_chain) {
    const c = copy.reasoning_chain
    const capList = (list) => Array.isArray(list) ? list.slice(0, 6).map(s => clampText(s, 120)) : []
    c.symptoms = capList(c.symptoms)
    c.environment = capList(c.environment)
    c.knowledge_match = capList(c.knowledge_match)
    c.excluded = capList(c.excluded)
    c.conclusion = clampText(c.conclusion, 200)
  }

  if (copy.agent_trace && Array.isArray(copy.agent_trace.steps)) {
    copy.agent_trace.steps = copy.agent_trace.steps.slice(0, 8).map(s => ({
      ...s,
      summary: clampText(s.summary, 80)
    }))
  }

  // source_meta 只保留检索统计这类小字段，parse_warnings 截断后保留
  if (copy.source_meta) {
    const m = copy.source_meta
    copy.source_meta = {
      api_version: m.api_version,
      kg_mode: m.kg_mode,
      kg_hits: m.kg_hits,
      kb_hits: m.kb_hits,
      policy_hits: m.policy_hits,
      retrieval_mode: m.retrieval_mode,
      degraded: m.degraded,
      degraded_reason: clampText(m.degraded_reason, 120),
      dtm_source: m.dtm_source,
      parse_warnings: Array.isArray(m.parse_warnings)
        ? m.parse_warnings.slice(0, PARSE_WARNING_LIMIT).map(w => clampText(w, 120))
        : []
    }
  }

  return copy
}

/**
 * 把处方要点拼成纯文本摘要，供聊天气泡的「复制」使用。
 * 结构化组件不是 HTML 字符串，copyText 拿不到它们，所以显式拼接。
 * @param {object} payload
 * @returns {string}
 */
export function prescriptionToText(payload) {
  const p = payload && payload.prescription
  if (!p) return ''
  const lines = []
  if (p.diagnosis) lines.push(`诊断：${p.diagnosis}${p.severity ? `（${p.severity}）` : ''}`)
  if (p.crop || p.region) lines.push(`作物/地区：${[p.crop, p.region].filter(Boolean).join(' · ')}`)
  if (p.immediate_actions.length) {
    lines.push('立即措施：')
    p.immediate_actions.forEach((a, i) => {
      lines.push(`${a.step || i + 1}. ${a.action}${a.timing ? `（${a.timing}）` : ''}${a.detail ? `：${a.detail}` : ''}`)
      a.chemicals.forEach(c => lines.push(`   - 用药：${c.name} ${c.spec} ${c.dosage}`))
    })
  }
  if (p.follow_up.length) {
    lines.push('后续管理：')
    p.follow_up.forEach((a, i) => lines.push(`${a.step || i + 1}. ${a.action}${a.timing ? `（${a.timing}）` : ''}`))
  }
  if (p.cost_estimate && typeof p.cost_estimate.total === 'number') {
    lines.push(`成本预估：约 ${p.cost_estimate.total} 元/亩（示例参考价）`)
  }
  if (p.risk_warnings.length) {
    lines.push('风险提示：')
    p.risk_warnings.forEach(w => lines.push(`- ${w.message}`))
  }
  return lines.join('\n')
}
