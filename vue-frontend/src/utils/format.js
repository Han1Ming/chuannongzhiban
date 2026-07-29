export function formatDate(d, fmt = 'YYYY-MM-DD HH:mm') {
  if (!d) return ''
  const date = new Date(d)
  const o = {
    'YYYY': date.getFullYear(),
    'MM': String(date.getMonth()+1).padStart(2,'0'),
    'DD': String(date.getDate()).padStart(2,'0'),
    'HH': String(date.getHours()).padStart(2,'0'),
    'mm': String(date.getMinutes()).padStart(2,'0')
  }
  return fmt.replace(/YYYY|MM|DD|HH|mm/g, k => o[k])
}
export function truncate(t, n=80) { return t?.length > n ? t.slice(0,n)+'…' : t || '' }
