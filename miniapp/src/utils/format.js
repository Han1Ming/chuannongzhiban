/**
 * 日期格式化
 * @param {string|Date} date - 日期
 * @param {string} fmt - 格式模板，如 'YYYY-MM-DD HH:mm'
 */
export function formatDate(date, fmt = 'YYYY-MM-DD') {
  if (!date) return ''
  const d = new Date(date)
  if (isNaN(d.getTime())) return String(date).slice(0, 10)

  const pad = (n) => String(n).padStart(2, '0')
  const map = {
    'YYYY': d.getFullYear(),
    'MM': pad(d.getMonth() + 1),
    'DD': pad(d.getDate()),
    'HH': pad(d.getHours()),
    'mm': pad(d.getMinutes()),
    'ss': pad(d.getSeconds())
  }
  let result = fmt
  for (const [key, val] of Object.entries(map)) {
    result = result.replace(key, val)
  }
  return result
}

/**
 * 相对时间
 */
export function relativeTime(date) {
  if (!date) return ''
  const now = Date.now()
  const diff = now - new Date(date).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}小时前`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}天前`
  return formatDate(date, 'MM-DD')
}

/**
 * 截断文本
 */
export function truncate(text, maxLen = 50) {
  if (!text) return ''
  return text.length > maxLen ? text.slice(0, maxLen) + '...' : text
}

/**
 * 数字格式化
 */
export function formatNumber(num) {
  if (num == null) return '0'
  const n = Number(num)
  if (isNaN(n)) return '0'
  return n.toLocaleString('zh-CN')
}

/**
 * 金额格式化（保留两位小数）
 */
export function formatMoney(num) {
  if (num == null) return '0.00'
  const n = Number(num)
  if (isNaN(n)) return '0.00'
  return n.toFixed(2)
}
