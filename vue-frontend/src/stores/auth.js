import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getToken, setToken, removeToken, getUser, setUser, removeUser, decodeJwt } from '@/utils/auth'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(getToken() || '')
  const userInfo = ref(getUser() || null)

  const isLoggedIn = computed(() => !!token.value)
  const role = computed(() => decodeJwt(token.value)?.role || userInfo.value?.role || null)
  const isAdmin = computed(() => role.value === 'ADMIN')
  const canGov = computed(() => role.value === 'ADMIN' || role.value === 'GOV')

  function loginSuccess(data) {
    token.value = data.token
    userInfo.value = data.user
    setToken(data.token); setUser(data.user)
  }
  function logout() {
    token.value = ''; userInfo.value = null
    removeToken(); removeUser()
  }
  return { token, userInfo, isLoggedIn, role, isAdmin, canGov, loginSuccess, logout }
})
