/**
 * 统一错误处理工具
 * 所有页面共用，替换零散的 console.error/showToast 模式
 */

export function handleError(err, options = {}) {
  const { fallbackMsg = '操作失败，请重试', showToast = true } = options

  const message = err?.message || fallbackMsg
  const isAuthError = message.includes('登录') || message.includes('token') || message.includes('Token')

  console.error('[AppError]', message, err)

  if (showToast) {
    uni.showToast({ title: message, icon: 'none', duration: 2000 })
  }

  return { message, isAuthError }
}
