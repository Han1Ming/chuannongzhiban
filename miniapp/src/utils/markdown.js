/**
 * Markdown 简易转 HTML
 * 用于微信小程序 rich-text / mp-html 组件渲染
 * 注意：小程序没有 DOM API，无法使用 markdown-it + DOMPurify
 */
export function mdToHtml(text) {
  if (!text) return ''

  let html = text
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
 */
export function mdToPlainText(text) {
  if (!text) return ''
  return text
    .replace(/```[\s\S]*?```/g, '')
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\[(.+?)\]\(.*?\)/g, '$1')
    .replace(/[#*`>|~-]/g, '')
    .replace(/\n+/g, ' ')
    .trim()
}
