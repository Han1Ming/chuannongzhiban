import { getToken, removeToken, removeUser } from '@/utils/auth'
import { API_BASE } from '@/utils/constants'

const BASE_URL = API_BASE

function request(config) {
  const token = getToken()
  const header = { 'Content-Type': 'application/json' }
  // 如果配置了 skipAuth=true，不添加 token
  if (!config.skipAuth && token) header['Authorization'] = `Bearer ${token}`

  return new Promise((resolve, reject) => {
    uni.request({
      url: BASE_URL + config.url,
      method: config.method || 'GET',
      data: config.data,
      header: { ...header, ...config.header },
      timeout: config.timeout || 30000,
      success: (res) => {
        // 401 未授权
        if (res.statusCode === 401) {
          if (config.skipAuthRedirect) {
            // 可选认证模式：不跳登录，返回 null 让页面自行处理
            resolve(null)
            return
          }
          // 强制认证模式：清除 token 并跳转登录
          removeToken()
          removeUser()
          uni.reLaunch({ url: '/pages/login/login' })
          reject(new Error('登录已过期'))
          return
        }
        // 业务状态码 200 为成功
        const d = res.data
        if (d && d.code === 200) {
          resolve(d.data !== undefined ? d.data : d)
        } else if (d && d.msg) {
          reject(new Error(d.msg))
        } else {
          reject(new Error('请求失败'))
        }
      },
      fail: (err) => {
        const msg = err.errMsg || ''
        // 超时特殊处理
        if (msg.includes('timeout')) {
          reject(new Error('连接超时，请检查网络或后端服务是否启动'))
        } else {
          reject(new Error(msg || '网络错误'))
        }
      }
    })
  })
}

// 可选认证的 GET：有 token 就带，没有也不强制，401 时返回 null
export function optionalGet(url, params) {
  return request({ url, data: params, skipAuthRedirect: true })
}

export function get(url, params) {
  return request({ url, data: params })
}

export function post(url, data) {
  return request({ url, method: 'POST', data })
}

export function put(url, data) {
  return request({ url, method: 'PUT', data })
}

export function del(url) {
  return request({ url, method: 'DELETE' })
}

/**
 * 文件上传
 * @param {string} url - 上传地址
 * @param {string} filePath - 文件本地路径
 * @param {string} name - 表单字段名
 * @param {object} formData - 附加表单数据
 */
export function uploadFile(url, filePath, name = 'file', formData = {}) {
  const token = getToken()
  return new Promise((resolve, reject) => {
    uni.uploadFile({
      url: BASE_URL + url,
      filePath,
      name,
      formData,
      header: token ? { Authorization: `Bearer ${token}` } : {},
      success: (res) => {
        try {
          const d = JSON.parse(res.data)
          if (d && d.code === 200) {
            resolve(d.data !== undefined ? d.data : d)
          } else {
            reject(new Error(d?.msg || '上传失败'))
          }
        } catch (e) {
          reject(new Error('解析响应失败'))
        }
      },
      fail: (err) => {
        reject(new Error(err.errMsg || '上传失败'))
      }
    })
  })
}

export default { get, post, put, del, uploadFile, optionalGet }
