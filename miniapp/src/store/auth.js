import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getToken, setToken, removeToken, getUser, setUser, removeUser, decodeJwt } from '@/utils/auth'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(getToken())
  const userInfo = ref(getUser())

  const isLoggedIn = computed(() => !!token.value)

  const role = computed(() => {
    if (userInfo.value?.role) return userInfo.value.role
    const decoded = decodeJwt(token.value)
    return decoded?.role || null
  })

  const isWechatUser = computed(() => {
    return userInfo.value && !userInfo.value.phone && !userInfo.value.password_hash
  })

  function loginSuccess(data) {
    token.value = data.token
    userInfo.value = data.user
    setToken(data.token)
    setUser(data.user)
  }

  function logout() {
    token.value = ''
    userInfo.value = null
    removeToken()
    removeUser()
    // 清空所有本地存储的聊天记录
    try {
      const keys = uni.getStorageInfoSync().keys
      keys.forEach(key => {
        if (key.startsWith('cnzb_chats_')) {
          uni.removeStorageSync(key)
        }
      })
    } catch (e) {
      console.error('清除聊天记录失败', e)
    }
  }

  return {
    token,
    userInfo,
    isLoggedIn,
    role,
    isWechatUser,
    loginSuccess,
    logout
  }
})
