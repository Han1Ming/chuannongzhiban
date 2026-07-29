const TOKEN_KEY = 'cnzb_token'
const USER_KEY = 'cnzb_user'

export function getToken() {
  try {
    return uni.getStorageSync(TOKEN_KEY) || ''
  } catch {
    return ''
  }
}

export function setToken(token) {
  uni.setStorageSync(TOKEN_KEY, token)
}

export function removeToken() {
  uni.removeStorageSync(TOKEN_KEY)
}

export function getUser() {
  try {
    const raw = uni.getStorageSync(USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function setUser(user) {
  uni.setStorageSync(USER_KEY, JSON.stringify(user))
}

export function removeUser() {
  uni.removeStorageSync(USER_KEY)
}

export function decodeJwt(token) {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const payload = parts[1]
    // base64url -> base64
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    const decoded = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(decoded)
  } catch {
    return null
  }
}

export function logout() {
  removeToken()
  removeUser()
  uni.reLaunch({ url: '/pages/login/login' })
}
