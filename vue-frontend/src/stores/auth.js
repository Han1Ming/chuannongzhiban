import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getToken, setToken, removeToken, getUser, setUser, removeUser, decodeJwt } from '@/utils/auth'
import { useChatStore } from '@/stores/chat'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(getToken() || '')
  const userInfo = ref(getUser() || null)

  const isLoggedIn = computed(() => !!token.value)
  const role = computed(() => decodeJwt(token.value)?.role || userInfo.value?.role || null)
  const isAdmin = computed(() => role.value === 'ADMIN')
  const canGov = computed(() => role.value === 'ADMIN' || role.value === 'GOV')

  /**
   * 登录/退出都必须重置会话 store。
   * 聊天记录的 localStorage 键是按用户 id 分的，但 Pinia store 是内存单例：
   * 不重置的话，账号切换后上一个用户的会话会继续留在内存里并被渲染出来。
   * 放在这里而不是各个页面的退出按钮里，是为了覆盖所有退出路径
   * （顶栏、个人中心、管理端…），避免漏掉某个入口又出现串号。
   */
  function resetChatStore() {
    try {
      useChatStore().resetForUser()
    } catch {
      /* store 尚未初始化时忽略：下次进入问答页会自己加载 */
    }
  }

  function loginSuccess(data) {
    token.value = data.token
    userInfo.value = data.user
    setToken(data.token); setUser(data.user)
    resetChatStore()
  }
  function logout() {
    token.value = ''; userInfo.value = null
    removeToken(); removeUser()
    resetChatStore()
  }
  return { token, userInfo, isLoggedIn, role, isAdmin, canGov, loginSuccess, logout }
})
