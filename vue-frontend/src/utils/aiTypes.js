/**
 * AI 能力升级（阶段 1~5）的字段归一化层。
 *
 * 为什么要独立一层：
 * 1. 后端契约允许所有增量字段缺失或为 null（老会话、降级路径、模型未产出机器可读块），
 *    组件里若直接取嵌套属性就会白屏，统一在这里兜底后组件只做展示。
 * 2. `response` 之外的结构在不同来源（sync / stream 末行 payload / 多模态 results / 历史消息）
 *    形状一致但包装层级不同，归一化后组件只需要认一种形状。
 * 3. 归一化函数全部是纯函数，不做副作用，可安全用在 computed 里。
 */

// --------------------------------------------------------------------------- //
// 常量
// --------------------------------------------------------------------------- //

/**
 * 置信度分级配色 + 短标签。
 * label 是**短标签**（高/中/低/未知），只给徽章用——徽章按需求渲染成
 * 「置信度 75.6% · 中」这种紧凑一行，长文案会把胶囊撑成一条。
 * 需要长文案（诊断摘要等非徽章场景）请用 confidenceLabelOf()。
 * 配色沿用项目绿/橙/红/灰口径：中档即需求要求的「浅橙底 + 橙字」。
 */
export const CONFIDENCE_LEVELS = {
  high: { label: '高', color: '#0E7A44', bg: '#E8F5E9' },
  medium: { label: '中', color: '#B45309', bg: '#FEF3C7' },
  low: { label: '低', color: '#B91C1C', bg: '#FEE2E2' },
  unknown: { label: '未知', color: '#6B7280', bg: '#F3F4F6' },
}

/** 置信度中文长标签（非徽章场景，如「整批图片整体置信度：中置信度」） */
const CONFIDENCE_LONG_LABELS = {
  high: '高置信度',
  medium: '中置信度',
  low: '低置信度',
  unknown: '置信度未知',
}

/** 严重程度：后端 DTM 归一化为 轻度/中度/重度，图片诊断沿用 轻微/中等/严重，两边都要认 */
export const SEVERITY_LEVELS = {
  mild: { label: '轻度', bg: '#D1FAE5', color: '#059669' },
  medium: { label: '中度', bg: '#FEF3C7', color: '#D97706' },
  severe: { label: '重度', bg: '#FEE2E2', color: '#DC2626' },
}

/** 溯源类型中文标签 */
export const SOURCE_TYPE_LABELS = {
  kb: '知识库',
  kg: '知识图谱',
  policy: '政策',
  weather: '天气',
  web: '网络',
}

/** 图谱关系中文映射（与后端 knowledge_graph 的关系名保持一致） */
export const RELATION_LABELS = {
  HARMS: '危害/易感',
  MANIFESTS: '表现为',
  TREATED_BY: '防治用',
  HAS_INGREDIENT: '成分为',
  AVAILABLE_AT: '可购买于',
  RECOMMEND_OP: '推荐操作',
  INDUCED_BY: '诱发条件',
  COMORBID: '并发',
}

/** 图谱节点类型配色：作物绿 / 病害红 / 虫害橙 / 症状黄褐 / 药剂蓝 / 操作紫 / 条件青 / 渠道灰 / 成分灰蓝 */
export const NODE_TYPE_STYLES = {
  Crop: { label: '作物', color: '#0E7A44', bg: '#E8F5E9' },
  Disease: { label: '病害', color: '#B91C1C', bg: '#FEE2E2' },
  Pest: { label: '虫害', color: '#C2410C', bg: '#FFEDD5' },
  Symptom: { label: '症状', color: '#92400E', bg: '#FEF3C7' },
  Drug: { label: '药剂', color: '#1D4ED8', bg: '#DBEAFE' },
  Operation: { label: '农事操作', color: '#6D28D9', bg: '#EDE9FE' },
  Condition: { label: '环境条件', color: '#0E7490', bg: '#CFFAFE' },
  Channel: { label: '购买渠道', color: '#4B5563', bg: '#F3F4F6' },
  Ingredient: { label: '药物成分', color: '#475569', bg: '#E2E8F0' },
}

/** 处方来源中文映射 */
export const GENERATED_BY_LABELS = {
  inline: '模型直出',
  llm_extract: '模型翻译',
  rule_from_graph: '图谱规则',
}

/** 风险等级配色 */
export const RISK_LEVELS = {
  high: { label: '高风险', color: '#B91C1C', bg: '#FEE2E2', border: '#FCA5A5' },
  medium: { label: '中风险', color: '#B45309', bg: '#FEF3C7', border: '#FCD34D' },
  low: { label: '低风险', color: '#0E7A44', bg: '#E8F5E9', border: '#A7D7B4' },
}

/** 智能体名称中文映射（后端 agent 名 → 中文） */
export const AGENT_LABELS = {
  knowledge: '知识检索',
  diagnose: '诊断推理',
  decision: '决策生成',
  graph: '图谱检索',
  policy: '政策检索',
  weather: '天气校验',
  supervisor: '调度器',
  unknown: '未知环节',
}

/** 意图中文映射 */
export const INTENT_LABELS = {
  prescription: '处方建议',
  diagnose: '病害诊断',
  fact: '知识问答',
  report: '分析报告',
}

/** 成本区必须提示的价格口径 */
export const COST_PRICE_NOTE = '价格为示例参考价，以当地农资店实际报价为准'

// --------------------------------------------------------------------------- //
// 基础取值工具
// --------------------------------------------------------------------------- //

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v)

/** 转数组：非数组一律给空数组，避免 v-for 报错 */
export function toArray(v) {
  return Array.isArray(v) ? v : []
}

/** 转数字：无效值给 null（而不是 NaN，NaN 参与运算会污染整个展示） */
export function toNumber(v) {
  if (v === null || v === undefined || v === '') return null
  const n = typeof v === 'number' ? v : parseFloat(v)
  return Number.isFinite(n) ? n : null
}

/** 转字符串：空值给空串，便于模板里统一判断 */
export function toText(v) {
  if (v === null || v === undefined) return ''
  if (typeof v === 'object') return ''
  return String(v).trim()
}

/** 转字符串数组并过滤空项 */
function toTextArray(v) {
  return toArray(v).map(toText).filter(Boolean)
}

// --------------------------------------------------------------------------- //
// 置信度 / 严重程度
// --------------------------------------------------------------------------- //

const LEVEL_ALIASES = {
  high: 'high', 高: 'high', 高置信度: 'high',
  medium: 'medium', 中: 'medium', 中置信度: 'medium', mid: 'medium',
  low: 'low', 低: 'low', 低置信度: 'low',
  unknown: 'unknown', 未知: 'unknown', 置信度未知: 'unknown',
}

/** 未知取值一律兜底到 unknown，组件不必再判空 */
export function confidenceLevelOf(level) {
  const key = toText(level).toLowerCase()
  return LEVEL_ALIASES[key] || LEVEL_ALIASES[toText(level)] || 'unknown'
}

/** 取置信度配色对象，保证返回结构固定 */
export function confidenceStyleOf(level) {
  return CONFIDENCE_LEVELS[confidenceLevelOf(level)]
}

/** 取置信度中文长标签（徽章之外的文本场景使用） */
export function confidenceLabelOf(level) {
  return CONFIDENCE_LONG_LABELS[confidenceLevelOf(level)]
}

/** 置信度数值 → 百分比文本 */
export function formatConfidence(v) {
  const n = toNumber(v)
  if (n === null) return ''
  // 后端个别路径会给 0~1 之外的值（如 87 表示 87%），这里统一按比例处理
  const ratio = n > 1 ? n / 100 : n
  return `${(Math.min(Math.max(ratio, 0), 1) * 100).toFixed(1)}%`
}

const SEVERITY_ALIASES = {
  轻微: 'mild', 轻度: 'mild', mild: 'mild', light: 'mild',
  中等: 'medium', 中度: 'medium', medium: 'medium', moderate: 'medium',
  严重: 'severe', 重度: 'severe', severe: 'severe', high: 'severe',
}

/** 复用「轻微/中等/严重」既有判定口径，同时兼容 DTM 的 轻/中/重度命名 */
export function severityClass(severity) {
  const key = toText(severity)
  return SEVERITY_ALIASES[key] || SEVERITY_ALIASES[key.toLowerCase()] || ''
}

/** 取严重程度配色对象，未知返回 null（模板里据此隐藏徽标） */
export function severityStyleOf(severity) {
  const cls = severityClass(severity)
  return cls ? SEVERITY_LEVELS[cls] : null
}

// --------------------------------------------------------------------------- //
// 归一化：处方
// --------------------------------------------------------------------------- //

function normalizeChemical(c) {
  if (!isObj(c)) return null
  const name = toText(c.name)
  if (!name) return null
  return {
    name,
    spec: toText(c.spec),
    dosage: toText(c.dosage),
    method: toText(c.method),
  }
}

function normalizeAction(a, index) {
  if (!isObj(a)) return null
  const action = toText(a.action)
  const detail = toText(a.detail)
  if (!action && !detail) return null
  return {
    step: toNumber(a.step) ?? index + 1,
    action: action || '未命名措施',
    detail,
    timing: toText(a.timing),
    method: toText(a.method),
    chemicals: toArray(a.chemicals).map(normalizeChemical).filter(Boolean),
  }
}

function normalizeCostItem(it) {
  if (!isObj(it)) return null
  const name = toText(it.name)
  if (!name) return null
  return {
    name,
    spec: toText(it.spec),
    unit: toText(it.unit),
    unit_price: toNumber(it.unit_price),
    quantity: toNumber(it.quantity),
    subtotal: toNumber(it.subtotal),
    pricing_source: toText(it.pricing_source),
  }
}

function normalizeCost(c) {
  if (!isObj(c)) return null
  const items = toArray(c.items).map(normalizeCostItem).filter(Boolean)
  const laborRaw = isObj(c.labor) ? c.labor : null
  const labor = laborRaw
    ? {
        hours: toNumber(laborRaw.hours),
        rate: toNumber(laborRaw.rate),
        subtotal: toNumber(laborRaw.subtotal),
        operations: toTextArray(laborRaw.operations),
      }
    : null
  const cost = {
    currency: toText(c.currency) || 'CNY',
    area_mu: toNumber(c.area_mu),
    items,
    labor,
    total: toNumber(c.total),
    note: toText(c.note),
    data_source: toText(c.data_source),
  }
  // 整个成本区都没数据时返回 null，模板不必判空数组
  const empty =
    !items.length && !labor && cost.total === null && !cost.data_source && !cost.note
  return empty ? null : cost
}

/** 风险项归一化：level 未知时按 medium 处理，避免样式落空 */
export function normalizeRiskWarning(w) {
  if (!isObj(w)) {
    const msg = toText(w)
    if (!msg) return null
    return { level: 'medium', code: '', message: msg, basis: '' }
  }
  const level = ['high', 'medium', 'low'].includes(toText(w.level).toLowerCase())
    ? toText(w.level).toLowerCase()
    : 'medium'
  const message = toText(w.message) || toText(w.detail)
  if (!message) return null
  return { level, code: toText(w.code), message, basis: toText(w.basis) }
}

export function normalizeRiskWarnings(list) {
  return toArray(list).map(normalizeRiskWarning).filter(Boolean)
}

function normalizeFitness(f) {
  if (!isObj(f)) return null
  const item = toText(f.item)
  if (!item) return null
  // passed 缺省视为通过：后端默认 True，缺失不代表未通过
  return { item, passed: f.passed === undefined || f.passed === null ? true : !!f.passed, detail: toText(f.detail) }
}

/** 处方归一化；无有效内容时返回 null，调用方据此回退纯文本展示 */
export function normalizePrescription(px) {
  if (!isObj(px)) return null
  const immediate_actions = toArray(px.immediate_actions).map(normalizeAction).filter(Boolean)
  const follow_up = toArray(px.follow_up).map(normalizeAction).filter(Boolean)
  const cost_estimate = normalizeCost(px.cost_estimate)
  const diagnosis = toText(px.diagnosis)
  const risk_warnings = normalizeRiskWarnings(px.risk_warnings)
  const fitness_check = toArray(px.fitness_check).map(normalizeFitness).filter(Boolean)
  const validation_errors = toTextArray(px.validation_errors)
  // 主题类型：operation（农事操作咨询，如"夏季茶叶如何修剪"）｜disease（病虫害问诊）
  const topic = toText(px.topic)

  const out = {
    diagnosis,
    topic,
    is_operation: topic === 'operation',
    severity: toText(px.severity),
    confidence: toNumber(px.confidence),
    confidence_level: confidenceLevelOf(px.confidence_level),
    crop: toText(px.crop),
    region: toText(px.region),
    season: toText(px.season),
    immediate_actions,
    follow_up,
    cost_estimate,
    risk_warnings,
    fitness_check,
    sources: normalizeSources(px.sources),
    validated: !!px.validated,
    validation_errors,
    generated_by: toText(px.generated_by),
  }
  return hasPrescription(out) ? out : null
}

/** 有诊断名、有措施、有成本或有风险，才算「有处方」值得渲染卡片 */
export function hasPrescription(px) {
  if (!px || !isObj(px)) return false
  return !!(
    toText(px.diagnosis) ||
    toArray(px.immediate_actions).length ||
    toArray(px.follow_up).length ||
    px.cost_estimate ||
    toArray(px.risk_warnings).length
  )
}

// --------------------------------------------------------------------------- //
// 归一化：溯源 / 图谱
// --------------------------------------------------------------------------- //

/**
 * 溯源条目归一化。
 * score 是检索距离（越小越近），similarity 才是越大约相关；
 * 这里同时算出展示用 matchPercent 与口径标记 matchBasis，由组件如实标注。
 */
export function normalizeSource(s) {
  if (!isObj(s)) {
    const title = toText(s)
    if (!title) return null
    return {
      source_type: 'kb', source_type_label: SOURCE_TYPE_LABELS.kb, source_id: '', title,
      score: null, similarity: null, matchPercent: null, matchBasis: '', excerpt: '',
      category: '', url: '', graph_path: null,
    }
  }
  const source_type = toText(s.source_type) || 'kb'
  const score = toNumber(s.score)
  const similarity = toNumber(s.similarity)
  let matchPercent = null
  let matchBasis = ''
  if (similarity !== null) {
    const ratio = similarity > 1 ? similarity / 100 : similarity
    matchPercent = Math.min(Math.max(ratio, 0), 1) * 100
    matchBasis = 'similarity'
  } else if (score !== null) {
    // 距离口径：仅作相对参考，组件会注明
    const ratio = score > 1 ? score / 100 : score
    matchPercent = Math.min(Math.max(ratio, 0), 1) * 100
    matchBasis = 'score'
  }
  return {
    source_type,
    source_type_label: SOURCE_TYPE_LABELS[source_type] || source_type,
    source_id: toText(s.source_id),
    title: toText(s.title) || toText(s.source_id) || '未命名来源',
    score,
    similarity,
    matchPercent,
    matchBasis,
    excerpt: toText(s.excerpt),
    category: toText(s.category),
    url: toText(s.url),
    graph_path: normalizeGraphPath(s.graph_path),
  }
}

export function normalizeSources(list) {
  return toArray(list).map(normalizeSource).filter(Boolean)
}

/** 图谱节点归一化：类型未知归到 unknown 样式，不阻塞渲染 */
export function normalizeGraphNode(n) {
  if (!isObj(n)) {
    const name = toText(n)
    return name ? { name, type: 'unknown' } : null
  }
  const name = toText(n.name) || toText(n.id)
  if (!name) return null
  const type = toText(n.type) || 'unknown'
  return {
    name,
    type,
    style: NODE_TYPE_STYLES[type] || NODE_TYPE_STYLES.Channel,
  }
}

export function normalizeGraphPath(p) {
  if (!isObj(p)) return null
  const path = toTextArray(p.path)
  let nodes = toArray(p.nodes).map(normalizeGraphNode).filter(Boolean)
  // nodes 缺失时用 path 兜底，保证横向链路仍可渲染
  if (!nodes.length && path.length) nodes = path.map((name) => normalizeGraphNode({ name })).filter(Boolean)
  const rels = toTextArray(p.rels)
  if (!nodes.length && !rels.length) return null
  return {
    query: toText(p.query),
    path,
    nodes,
    rels,
    links: toArray(p.links).filter(isObj),
    source: toText(p.source) || 'kg',
  }
}

export function normalizeGraphPaths(list) {
  return toArray(list).map(normalizeGraphPath).filter(Boolean)
}

// --------------------------------------------------------------------------- //
// 归一化：推理链 / 需要补充信息 / 智能体链路 / 元信息
// --------------------------------------------------------------------------- //

export function normalizeReasoningChain(rc) {
  if (!isObj(rc)) return null
  const out = {
    symptoms: toTextArray(rc.symptoms),
    environment: toTextArray(rc.environment),
    knowledge_match: toTextArray(rc.knowledge_match),
    excluded: toTextArray(rc.excluded),
    conclusion: toText(rc.conclusion) || toText(rc.observation),
  }
  // 兼容模型可能把观察写成 steps
  if (!out.symptoms.length && !out.environment.length && !out.knowledge_match.length && !out.excluded.length && !out.conclusion && toArray(rc.steps).length) {
    out.symptoms = toTextArray(rc.steps)
  }
  const empty =
    !out.symptoms.length && !out.environment.length && !out.knowledge_match.length && !out.excluded.length && !out.conclusion
  return empty ? null : out
}

export function normalizeNeedMoreInfo(n) {
  if (!isObj(n)) return null
  const out = {
    reason: toText(n.reason),
    suggestions: toTextArray(n.suggestions),
    agri_station_tip: toText(n.agri_station_tip),
  }
  if (!out.reason && !out.suggestions.length && !out.agri_station_tip) return null
  return out
}

export function normalizeAgentStep(s) {
  if (!isObj(s)) return null
  const agent = toText(s.agent)
  if (!agent) return null
  const status = toText(s.status) || 'done'
  return {
    agent,
    agent_label: AGENT_LABELS[agent] || agent,
    status,
    status_label: { done: '已完成', running: '进行中', failed: '失败', skipped: '已跳过' }[status] || status,
    elapsed_ms: toNumber(s.elapsed_ms),
    summary: toText(s.summary),
  }
}

export function normalizeAgentTrace(t) {
  if (!isObj(t)) return null
  const steps = toArray(t.steps).map(normalizeAgentStep).filter(Boolean)
  const route = toTextArray(t.route)
  const out = {
    intent: toText(t.intent),
    route,
    route_labels: route.map((a) => AGENT_LABELS[a] || a),
    current: toText(t.current),
    current_label: AGENT_LABELS[toText(t.current)] || toText(t.current),
    final_agent: toText(t.final_agent),
    final_agent_label: AGENT_LABELS[toText(t.final_agent)] || toText(t.final_agent),
    steps,
    elapsed_ms: toNumber(t.elapsed_ms),
    degraded: !!t.degraded,
    error: toText(t.error),
  }
  // 完全无内容时返回 null，ChatView 据此整块不渲染
  if (!steps.length && !route.length && !out.degraded && !out.error && !out.current) return null
  return out
}

/** 三路检索通道的界面元信息（与后端 services/retrieval_service.py 的 CHANNEL_META 对齐） */
export const RETRIEVAL_CHANNEL_META = {
  kb: { label: '本地知识库', icon: '📚', color: '#0E7A44', bg: '#E8F5E9' },
  kg: { label: '知识图谱', icon: '🕸️', color: '#6D28D9', bg: '#EDE9FE' },
  web: { label: '联网搜索', icon: '🌐', color: '#4B5563', bg: '#F3F4F6' },
}

/** 通道状态的界面文案：空结果与调用失败必须区分，否则农户以为系统坏了 */
export const RETRIEVAL_STATUS_LABELS = {
  ok: '有结果',
  empty: '无结果',
  disabled: '本次未启用',
  error: '调用失败',
}

/**
 * 归一化「三路检索」的分组结果（后端 source_meta.retrieval_channels）。
 *
 * 这是「检索来源」可收缩容器的数据源：每路通道各自带 items，
 * 每个 item 的 source_text 就是需求里的**源文字**
 * （知识库=洗净的片段正文、图谱=关系链、联网=标题+摘要+链接）。
 */
export function normalizeRetrievalChannels(raw) {
  const list = toArray(raw).filter(isObj)
  return list.map((c) => {
    const key = toText(c.key) || 'kb'
    const meta = RETRIEVAL_CHANNEL_META[key] || RETRIEVAL_CHANNEL_META.kb
    const items = toArray(c.items)
      .filter(isObj)
      .map((it) => ({
        title: toText(it.title) || '未命名来源',
        // 源文字：优先后端给的 source_text，退回摘要/正文
        source_text: toText(it.source_text) || toText(it.excerpt) || toText(it.content) || '',
        url: toText(it.url),
        source_type: toText(it.source_type) || key,
        source_type_label: SOURCE_TYPE_LABELS[toText(it.source_type) || key] || meta.label,
        doc_id: toText(it.doc_id),
        category: toText(it.category),
        score: toNumber(it.score),
        similarity: toNumber(it.similarity),
        matchPercent: (() => {
          const sim = toNumber(it.similarity)
          return sim === null ? null : Math.min(Math.max(sim, 0), 1) * 100
        })(),
        provider: toText(it.provider),
        path: toArray(it.path),
        rels: toArray(it.rels),
        graph_path: isObj(it.graph_path) ? normalizeGraphPath(it.graph_path) : null,
      }))
    const status = toText(c.status) || (items.length ? 'ok' : 'empty')
    return {
      key,
      label: toText(c.label) || meta.label,
      icon: toText(c.icon) || meta.icon,
      desc: toText(c.desc),
      style: meta,
      status,
      status_label: RETRIEVAL_STATUS_LABELS[status] || status,
      error: toText(c.error),
      detail: toText(c.detail),
      provider: toText(c.provider),
      items,
      count: items.length,
      // 该通道是否有可展示内容（有源文字，或至少有一句失败/未启用的说明）
      has_content: items.length > 0 || !!toText(c.error) || !!toText(c.detail),
    }
  })
}

export function normalizeSourceMeta(m) {
  if (!isObj(m)) return null
  const answerMode = toText(m.answer_mode)
  return {
    api_version: toNumber(m.api_version),
    kg_mode: toText(m.kg_mode),
    kg_mode_label: { embedded: '内置图谱', neo4j: 'Neo4j 图谱', unavailable: '图谱不可用' }[toText(m.kg_mode)] || toText(m.kg_mode),
    kg_hits: toNumber(m.kg_hits) ?? 0,
    kb_hits: toNumber(m.kb_hits) ?? 0,
    policy_hits: toNumber(m.policy_hits) ?? 0,
    retrieval_mode: toText(m.retrieval_mode),
    // 三路检索的分组结果：本地知识库 / 知识图谱 / 联网搜索
    retrieval_channels: normalizeRetrievalChannels(m.retrieval_channels),
    degraded: !!m.degraded,
    degraded_reason: toText(m.degraded_reason),
    dtm_source: toText(m.dtm_source),
    parse_warnings: toTextArray(m.parse_warnings),
    confidence_source: toText(m.confidence_source),
    confidence_reasons: toTextArray(m.confidence_reasons),
    // 表达层实际走的路径：回答是"按 farmer_answer_prompt.txt 由模型生成"，
    // 还是"模型不可用、按同一套规范由模板生成"。失败原因一并带出来，
    // 便于一眼看出提示词到底有没有生效。
    answer_mode: answerMode,
    answer_mode_label:
      {
        llm: '模型生成（按话术提示词）',
        template: '模板生成（按同一套话术规范）',
        llm_failed: '模型生成失败',
        report: '报告原文',
        weather: '天气数据直答',
      }[answerMode] || answerMode,
    answer_error: toText(m.answer_error),
    // 折叠面板里只显示一句人话；完整原因（含请求 ID、上游原文）放到 tooltip，
    // 否则农户/运维在界面上看到的是几百字符的英文报错。
    answer_error_label: friendlyAnswerError(m.answer_error),
  }
}

/**
 * 把模型失败原因压成一句可读的中文。
 *
 * 后端给出的原因可能很长（DashScope 会把整段英文配额说明塞进 message），
 * 直接铺在界面上既难看也看不懂，因此按特征归一到几种常见原因。
 */
export function friendlyAnswerError(raw) {
  const text = toText(raw)
  if (!text) return ''
  const lower = text.toLowerCase()
  if (text.includes('AllocationQuota') || (text.includes('403') && lower.includes('quota'))) {
    return '模型额度已用尽（HTTP 403）'
  }
  if (text.includes('401') || lower.includes('invalidapikey') || lower.includes('unauthorized')) {
    return '模型鉴权失败（HTTP 401）'
  }
  if (lower.includes('timeout') || text.includes('超时')) {
    return '模型调用超时'
  }
  if (text.includes('KeyError')) {
    return '模型调用失败（上游异常被掩盖）'
  }
  if (lower.includes('connection') || lower.includes('network')) {
    return '模型网络不可达'
  }
  return text.length > 40 ? `${text.slice(0, 40)}…` : text
}

// --------------------------------------------------------------------------- //
// 归一化：整包 payload / 多模态诊断
// --------------------------------------------------------------------------- //

/**
 * 归一化一次 AI 回答的完整增量载荷。
 * 输入可以是 sync 响应 data、stream 末行的 payload、历史消息组装的 payload。
 */
export function normalizePayload(raw) {
  const p = isObj(raw) ? raw : {}
  const prescription = normalizePrescription(p.prescription)
  const confidence = toNumber(p.confidence) ?? prescription?.confidence ?? null
  // 顶层缺失时退回处方自带的等级，避免同一份数据两处等级不一致
  const level = confidenceLevelOf(p.confidence_level || prescription?.confidence_level)
  return {
    api_version: toNumber(p.api_version) ?? 2,
    intent: toText(p.intent) || null,
    intent_label: INTENT_LABELS[toText(p.intent)] || toText(p.intent),
    prescription,
    reasoning_chain: normalizeReasoningChain(p.reasoning_chain),
    sources: normalizeSources(p.sources),
    graph_paths: normalizeGraphPaths(p.graph_paths),
    confidence,
    confidence_level: level,
    confidence_label: confidenceLabelOf(level),
    need_more_info: normalizeNeedMoreInfo(p.need_more_info),
    risk_warnings: normalizeRiskWarnings(p.risk_warnings),
    agent_trace: normalizeAgentTrace(p.agent_trace),
    source_meta: normalizeSourceMeta(p.source_meta),
    // 三路检索分组结果提升到顶层，方便模板直接绑定（否则到处写 source_meta?.retrieval_channels）
    retrieval_channels: normalizeRetrievalChannels(p.source_meta?.retrieval_channels),
    // 语音播报专用纯文本（后端已去 Markdown 标记与元信息行）
    spoken_text: toText(p.spoken_text),
  }
}

/**
 * 从回答正文里摘掉后端附带的「检索来源」折叠容器。
 *
 * 为什么要摘：后端为了「答案自带完整依据」（Markdown/HTML 客户端、
 * 复制导出都能看到），会把三路源文字写成 `<details>` 放在正文末尾；
 * 而界面里已经有更丰富的可收缩组件（SourceList，带匹配度/链接/图谱路径）在读同一份
 * `retrieval_channels`。不摘的话农户会在气泡里看到一遍、组件里再看到一遍。
 *
 * 只删标题里带 marker 的那个块：开头的「推理摘要」要原样留给 Markdown 渲染。
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
      // 只认这个块自己的标题（第一个 summary），内层通道标题不参与判定
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

/** 供 store 判断是否需要落盘 payload：全空包不必存，省 localStorage 配额 */export function isEmptyPayload(payload) {
  if (!payload || !isObj(payload)) return true
  return !(
    payload.prescription ||
    toArray(payload.sources).length ||
    toArray(payload.graph_paths).length ||
    payload.reasoning_chain ||
    payload.need_more_info ||
    toArray(payload.risk_warnings).length ||
    payload.agent_trace ||
    payload.source_meta ||
    toNumber(payload.confidence) !== null
  )
}

/** 单张图片诊断结果归一化 */
export function normalizeDiagnoseResultItem(r) {
  const item = isObj(r) ? r : {}
  const prescription = normalizePrescription(item.prescription)
  const level = confidenceLevelOf(item.confidence_level)
  return {
    filename: toText(item.filename) || '未命名图片',
    is_relevant: item.is_relevant === undefined || item.is_relevant === null ? true : !!item.is_relevant,
    reason: toText(item.reason),
    diagnosis: toText(item.diagnosis),
    severity: toText(item.severity),
    confidence: toNumber(item.confidence),
    confidence_level: level,
    confidence_label: toText(item.confidence_label) || confidenceLabelOf(level),
    symptoms: toTextArray(item.symptoms),
    cause: toText(item.cause),
    advice: toText(item.advice),
    error: toText(item.error),
    prescription,
    reasoning_chain: normalizeReasoningChain(item.reasoning_chain),
    sources: normalizeSources(item.sources),
    graph_paths: normalizeGraphPaths(item.graph_paths),
    risk_warnings: normalizeRiskWarnings(item.risk_warnings),
    need_more_info: normalizeNeedMoreInfo(item.need_more_info),
  }
}

/** 多模态诊断整体返回归一化（results + overall 级字段） */
export function normalizeDiagnoseResult(raw) {
  const r = isObj(raw) ? raw : {}
  const results = toArray(r.results).map(normalizeDiagnoseResultItem)
  const overallLevel = confidenceLevelOf(r.overall_confidence_level)
  return {
    total: toNumber(r.total) ?? results.length,
    relevant_count: toNumber(r.relevant_count) ?? results.filter((x) => x.is_relevant).length,
    unrelated_images: toTextArray(r.unrelated_images),
    summary: toText(r.summary),
    api_version: toNumber(r.api_version) ?? 2,
    overall_confidence_level: overallLevel,
    overall_confidence: toNumber(r.overall_confidence),
    need_more_info: normalizeNeedMoreInfo(r.need_more_info),
    source_meta: normalizeSourceMeta(r.source_meta),
    results,
  }
}

/** 千分位/两位小数金额展示（成本区专用） */
export function formatMoney(v, currency = 'CNY') {
  const n = toNumber(v)
  if (n === null) return ''
  const symbol = currency === 'CNY' || !currency ? '¥' : ''
  return `${symbol}${n.toFixed(2)}`
}

/** 毫秒 → 秒/毫秒可读文本 */
export function formatElapsed(ms) {
  const n = toNumber(ms)
  if (n === null) return ''
  return n >= 1000 ? `${(n / 1000).toFixed(2)}s` : `${Math.round(n)}ms`
}

// --------------------------------------------------------------------------- //
// 复制导出
// --------------------------------------------------------------------------- //

/**
 * 组装「复制回答」用的纯文本（Markdown 风格）。
 *
 * 为什么单独一层：回答的结构化部分（处方/风险/依据）不在 content 里，
 * 只复制 content 会得到一个缺了用法用量和成本的半截答案，粘到微信里没法用。
 * 这里把 payload 里真正有决策价值的部分按「诊断—措施—成本—风险—依据」追加到正文之后。
 * 无 payload 的历史消息直接返回原文，行为与旧版一致。
 */
export function formatAnswerForCopy(content, payload) {
  const body = toText(content)
  const p = payload
  if (!p) return body

  const lines = [body]

  const px = p.prescription
  if (px) {
    if (px.diagnosis) {
      lines.push('', `【诊断】${px.diagnosis}${px.severity ? `（${px.severity}）` : ''}`)
    }
    if (toArray(px.immediate_actions).length) {
      lines.push('', '【立即措施】')
      toArray(px.immediate_actions).forEach((a, i) => {
        const head = [toText(a.action), toText(a.detail)].filter(Boolean).join(' — ')
        const tail = []
        if (toText(a.timing)) tail.push(`时机：${toText(a.timing)}`)
        if (toText(a.method)) tail.push(`方式：${toText(a.method)}`)
        const chems = toArray(a.chemicals)
          .map((c) => [toText(c.name), toText(c.spec), toText(c.dosage)].filter(Boolean).join(' '))
          .filter(Boolean)
        if (chems.length) tail.push(`用药：${chems.join('；')}`)
        lines.push(`${i + 1}. ${head}${tail.length ? `（${tail.join('，')}）` : ''}`)
      })
    }
    if (toArray(px.follow_up).length) {
      lines.push('', '【后续管理】')
      toArray(px.follow_up).forEach((a, i) => {
        lines.push(`${i + 1}. ${[toText(a.action), toText(a.detail)].filter(Boolean).join(' — ')}`)
      })
    }
    const cost = px.cost_estimate
    if (cost) {
      lines.push('', '【成本估算】')
      toArray(cost.items).forEach((it) => {
        const parts = [
          toText(it.name),
          toText(it.spec),
          toNumber(it.quantity) !== null ? `×${toText(it.quantity)}` : '',
          formatMoney(it.subtotal),
        ].filter(Boolean)
        lines.push(`- ${parts.join(' ')}`)
      })
      if (cost.labor && (cost.labor.subtotal !== null || cost.labor.hours !== null)) {
        lines.push(`- 人工 ${toText(cost.labor.hours) || '—'} 小时 ${formatMoney(cost.labor.subtotal)}`.trim())
      }
      if (cost.total !== null && cost.total !== undefined) lines.push(`合计：${formatMoney(cost.total)}`)
      lines.push(`（${COST_PRICE_NOTE}）`)
    }
  }

  const risks = toArray(p.risk_warnings)
  if (risks.length) {
    lines.push('', '【风险提示】')
    risks.forEach((w) => {
      const lv = RISK_LEVELS[toText(w.level)] || RISK_LEVELS.medium
      lines.push(`- [${lv.label}] ${toText(w.message)}`)
    })
  }

  const sources = toArray(p.sources)
  if (sources.length) {
    lines.push('', '【依据来源】')
    sources.forEach((s, i) => {
      const percent = toNumber(s.matchPercent) !== null ? `（匹配度 ${Math.round(s.matchPercent)}%）` : ''
      lines.push(`${i + 1}. [${toText(s.source_type_label) || '来源'}] ${toText(s.title)}${percent}`)
    })
  }

  if (p.confidence_level) {
    lines.push('', `【置信度】${formatConfidence(p.confidence) || '—'} · ${confidenceLabelOf(p.confidence_level)}`)
  }

  lines.push('', '—— 以上内容由「川农智伴」AI 生成，仅供参考，用药请以当地农技员意见为准。')
  return lines.join('\n')
}
