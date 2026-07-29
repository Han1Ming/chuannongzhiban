import axios from 'axios'
import { getToken, removeToken, removeUser } from '@/utils/auth'
import { ElMessage } from 'element-plus'

const req = axios.create({ baseURL: '', timeout: 30000 })

req.interceptors.request.use(c => {
  const t = getToken()
  if (t) c.headers.Authorization = `Bearer ${t}`
  return c
})

req.interceptors.response.use(
  r => {
    if (r.config.responseType === 'blob') return r
    const d = r.data
    if (d.code === 200) return d.data ?? d
    ElMessage.error(d.msg || '请求失败')
    return Promise.reject(new Error(d.msg))
  },
  e => {
    if (e.response?.status === 401) {
      removeToken(); removeUser()
      ElMessage.error('登录已过期')
      window.location.href = '/login'
    } else if (e.response?.status === 403) {
      ElMessage.error('没有操作权限')
    } else {
      ElMessage.error(e.response?.data?.msg || `请求错误 (${e.response?.status})`)
    }
    return Promise.reject(e)
  }
)

export default req
