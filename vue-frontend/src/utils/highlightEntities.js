import { toArray, toText } from '@/utils/aiTypes'

/**
 * 回答正文里的关键实体高亮。
 *
 * 为什么从 payload 反推实体，而不是内置一份农业词典：
 * 内置词典会命中与本次回答无关的词（用户问水稻，回答里出现"柑橘"也会被点亮），
 * 而且维护成本高。payload 里的实体（图谱节点、药剂名、症状、作物）**天然与本次回答相关**，
 * 命中即高亮、没命中就不高亮，天然不会误伤。
 *
 * 老消息没有 payload → 实体列表为空 → 整条链路短路返回原 HTML，行为与改造前一致。
 */

/** 低于 2 字的词一律不参与高亮（"病/虫/叶"这类单字会把整段刷绿） */
const MIN_LEN = 2
/** 超过 12 字的"实体"其实是整句话（reasoning_chain 里常见），高亮它等于高亮半段正文 */
const MAX_LEN = 12
/** 单条回答最多高亮这么多个词，避免长回答里满屏绿底反而看不清重点 */
const MAX_TERMS = 30

/** 这些标签内部是"代码/链接/表格/折叠块"，高亮进去会破坏语义与可读性 */
const SKIP_TAGS = new Set(['code', 'pre', 'a', 'table', 'details', 'summary', 'svg', 'style'])

/**
 * 从已归一化的 payload 中收集候选实体词。
 * @param {object|null} payload normalizePayload 的产物
 * @returns {string[]} 去重、去噪后的候选词
 */
export function collectEntities(payload) {
  if (!payload || typeof payload !== 'object') return []

  const raw = []
  const px = payload.prescription
  if (px) {
    raw.push(px.crop, px.diagnosis)
    toArray(px.immediate_actions).forEach((a) => {
      toArray(a?.chemicals).forEach((c) => raw.push(c?.name))
    })
  }
  const chain = payload.reasoning_chain
  if (chain) {
    raw.push(...toArray(chain.symptoms), ...toArray(chain.knowledge_match))
  }
  toArray(payload.graph_paths).forEach((p) => {
    toArray(p?.nodes).forEach((n) => raw.push(n?.name))
  })

  return normalizeTerms(raw)
}

/** 清洗候选词：取文本、按长度卡掉噪声、去重、长词优先、封顶数量 */
export function normalizeTerms(terms) {
  const seen = new Set()
  const out = []
  toArray(terms).forEach((t) => {
    const s = toText(t)
    if (!s || s.length < MIN_LEN || s.length > MAX_LEN) return
    if (seen.has(s)) return
    seen.add(s)
    out.push(s)
  })
  // 长词优先：正则按顺序匹配，先命中"稻瘟病"就不会把它拆成"稻瘟"+"病"
  out.sort((a, b) => b.length - a.length)
  return out.slice(0, MAX_TERMS)
}

/** 把词表编译成一个正则；全部是普通文本，必须转义，否则"（"这类字符会让正则语法错 */
function buildPattern(terms) {
  if (!terms.length) return null
  const escaped = terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  try {
    return new RegExp(`(${escaped.join('|')})`, 'gi')
  } catch {
    // 词表里有让正则编译失败的内容时，宁可不高亮也不能让回答白屏
    return null
  }
}

function wrap(text, pattern) {
  pattern.lastIndex = 0
  return text.replace(pattern, '<mark class="entity">$1</mark>')
}

/**
 * 在 HTML 字符串上做实体高亮。
 *
 * 核心约束：**绝不能对整段 HTML 直接 String.replace**。
 * `<a href="水稻种植">` 这种属性里也含关键词，直接替换会把标签属性打出 `<mark>`，
 * 轻则样式错乱、重则 DOM 结构损坏。这里按标签边界切成「标签片段」与「文本片段」，
 * 只对文本片段替换，并用一个标签栈跳过 code/pre/a/table/details 内部。
 *
 * @param {string} html  markdown-it 渲染后的 HTML
 * @param {string[]} terms 候选实体词
 * @returns {string} 高亮后的 HTML（任何异常都返回原 HTML）
 */
export function highlightEntities(html, terms) {
  if (!html) return html
  const list = normalizeTerms(terms)
  if (!list.length) return html
  const pattern = buildPattern(list)
  if (!pattern) return html

  try {
    const parts = []
    const skipStack = []
    const tagRe = /<(\/?)([a-zA-Z][a-zA-Z0-9-]*)([^>]*)>/g
    let cursor = 0
    let m

    while ((m = tagRe.exec(html))) {
      const textChunk = html.slice(cursor, m.index)
      parts.push(skipStack.length ? textChunk : wrap(textChunk, pattern))

      const [full, slash, name] = m
      parts.push(full)

      const tag = name.toLowerCase()
      if (SKIP_TAGS.has(tag)) {
        if (slash) {
          const idx = skipStack.lastIndexOf(tag)
          if (idx >= 0) skipStack.splice(idx, 1)
        } else if (!/\/\s*>$/.test(full)) {
          // 自闭合（<br/>）不入栈，否则栈永远不空、后面全都不高亮
          skipStack.push(tag)
        }
      }
      cursor = m.index + full.length
    }

    const tail = html.slice(cursor)
    parts.push(skipStack.length ? tail : wrap(tail, pattern))
    return parts.join('')
  } catch {
    return html
  }
}

/**
 * 一次性完成「渲染结果 → 高亮」的容错包装，供组件直接调用。
 * @param {string} html markdown-it 渲染结果
 * @param {object|null} payload 已归一化 payload（可为 null）
 */
export function applyEntityHighlight(html, payload) {
  if (!html) return html
  try {
    return highlightEntities(html, collectEntities(payload))
  } catch {
    return html
  }
}
