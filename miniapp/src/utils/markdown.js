/**
 * 把 <details> 折叠块展平成「粗体标题 + 内容」（去掉标签、保留信息）。
 *
 * 小程序 rich-text 不支持 <details>，不处理的话农户会看到
 * "&lt;details&gt;" 这种乱码标签（转义后原样显示）。
 *
 * 为什么用递归下降而不是正则：
 * 答案末尾的「检索来源」容器是 `<details>` 套三路 `<details>`
 * （本地知识库/知识图谱/联网搜索，见后端 services/retrieval_service.build_details_html），
 * 而且一次回答里通常有**两个**顶层折叠块（开头的推理摘要 + 结尾的检索来源）。
 * 正则在这里两头不讨好：非贪婪会在第一个内层闭合标签处收尾（漏标签、丢其余两路），
 * 贪婪又会把两个顶层块之间的正文整段吞掉。递归下降按层配平，两种结构都对。
 *
 * 展平后折叠块变成普通文本，因此小程序端的「可收缩」由
 * components/ai/SourceList.vue 组件承担（它读结构化的 retrieval_channels）。
 */
function flattenDetails(text) {
  const OPEN = /<details\b[^>]*>/i
  const CLOSE = /<\/details\s*>/i
  // 只认**紧跟开标签**的 summary（允许中间有空白），避免误吞正文里的同名标签
  const SUMMARY = /^\s*<summary\b[^>]*>([\s\S]*?)<\/summary\s*>/i

  /** 从 from 起找最近的一个 details 开/闭标签（**返回绝对下标**，调用方按绝对下标切片） */
  function nextTag(from) {
    const rest = text.slice(from)
    const open = OPEN.exec(rest)
    const close = CLOSE.exec(rest)
    const found = []
    if (open) found.push({ kind: 'open', index: from + open.index, len: open[0].length })
    if (close) found.push({ kind: 'close', index: from + close.index, len: close[0].length })
    found.sort((a, b) => a.index - b.index)
    return found[0] || null
  }

  /** 解析 from 起的一段；遇到与本段配对的 </details> 就收尾 */
  function parse(from) {
    const parts = []
    let cursor = from
    for (;;) {
      const tag = nextTag(cursor)
      if (!tag) {
        parts.push(text.slice(cursor))
        return { text: parts.join(''), next: text.length }
      }
      parts.push(text.slice(cursor, tag.index))
      if (tag.kind === 'close') {
        // 这一段结束（外层由调用者的 parse 继续）
        return { text: parts.join(''), next: tag.index + tag.len }
      }

      const afterOpen = tag.index + tag.len
      const summary = SUMMARY.exec(text.slice(afterOpen))
      let title = '详情'
      let bodyStart = afterOpen
      if (summary) {
        title = String(summary[1] || '').trim() || title
        bodyStart = afterOpen + summary[0].length
      }
      const inner = parse(bodyStart)
      parts.push(`\n\n**${title}**\n${inner.text.trim()}\n\n`)
      cursor = inner.next
    }
  }

  return parse(0).text
}

/**
 * Markdown 简易转 HTML
 * 用于微信小程序 rich-text / mp-html 组件渲染
 * 注意：小程序没有 DOM API，无法使用 markdown-it + DOMPurify
 */
export function mdToHtml(text) {
  if (!text) return ''

  // 折叠块先展平（全文一次扫描，支持多个顶层块与嵌套块）
  let html = flattenDetails(text)

    // 转义HTML特殊字符（防止XSS）
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

    // 代码块 (先处理，避免内部被其他规则匹配)
    .replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
      const cls = lang ? ` class="language-${lang}"` : ''
      return `<pre><code${cls}>${code.trim()}</code></pre>`
    })

    // 行内代码
    .replace(/`([^`]+)`/g, '<code>$1</code>')

    // 标题
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')

    // 粗体
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')

    // 斜体
    .replace(/\*(.+?)\*/g, '<em>$1</em>')

    // 链接
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>')

    // 图片
    .replace(/!\[(.+?)\]\((.+?)\)/g, '<img src="$2" alt="$1" />')

    // 无序列表
    .replace(/^- (.+)$/gm, '<li>$1</li>')

    // 有序列表
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')

    // 段落
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br/>')

  return `<p>${html}</p>`
}

/**
 * 纯文本提取（用于语音播报等场景）
 *
 * 先展平折叠块再清标记：答案里的「检索来源」容器是嵌套 `<details>`，
 * 直接照原样念会把标题与源文字全读出来（源文字动辄几百字），
 * 而且残留的尖括号会被逐字念成"小于号 details 大于号"。
 * 注意后端另有更完整的 `spoken_text` 字段（TTS 首选），本函数只是兜底。
 */
export function mdToPlainText(text) {
  if (!text) return ''
  return flattenDetails(text)
    .replace(/```[\s\S]*?```/g, '')
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\[(.+?)\]\(.*?\)/g, '$1')
    // 兜底：展平后仍可能残留孤立标签
    .replace(/<[^>]*>/g, '')
    .replace(/[#*`>|~-]/g, '')
    .replace(/\n+/g, ' ')
    .trim()
}
