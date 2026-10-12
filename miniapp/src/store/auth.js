import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getToken, setToken, removeToken, getUser, setUser, removeUser, decodeJwt } from '@/utils/auth'
import { useChatStore } from '@/store/chat'

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

  /**
   * 登录/退出都必须重置会话 store。
   *
   * 旧实现是在 logout 时把**所有** `cnzb_chats_*` 键删掉：既毁掉了用户自己的历史，
   * 又没有清掉 Pinia 里已经加载到内存的会话，切换账号后仍会渲染上一个用户的记录。
   * 现在改为按当前用户重新读取存储：退出即清空视图且不落盘，登录即加载本人数据。
   * 放在这里而不是各个页面的退出按钮里，是为了覆盖所有退出路径。
   */
  function resetChatStore() {
    try {
      useChatStore().resetForUser()
    } catch (e) {
      console.error('重置聊天会话失败', e)
    }
  }

  function loginSuccess(data) {
    token.value = data.token
    userInfo.value = data.user
    setToken(data.token)
    setUser(data.user)
    resetChatStore()
  }

  function logout() {
    token.value = ''
    userInfo.value = null
    removeToken()
    removeUser()
    resetChatStore()
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
