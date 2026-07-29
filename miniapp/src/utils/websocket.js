/**
 * WebSocket 聊天连接管理
 * 用于流式 AI 问答
 */
class ChatWebSocket {
  constructor() {
    this.socketTask = null
    this.isConnected = false
    this.onChunk = null
    this.onDone = null
    this.onError = null
    this.reconnectTimer = null
    this.reconnectAttempts = 0
    this.maxReconnect = 5
  }

  /**
   * 连接 WebSocket
   * @param {string} token - JWT token
   * @param {string} url - WebSocket 地址
   */
  connect(token, url) {
    const wsUrl = url || `wss://api.chuannong.com/chat/ws`

    this.socketTask = uni.connectSocket({
      url: wsUrl,
      success: () => {
        console.log('🌐 WebSocket 连接已建立')
      },
      fail: (err) => {
        console.error('❌ WebSocket 连接失败', err)
        this.onError && this.onError('连接失败')
      }
    })

    this.socketTask.onOpen(() => {
      this.isConnected = true
      this.reconnectAttempts = 0
      // 发送认证
      this.send({ token: `Bearer ${token}` })
    })

    this.socketTask.onMessage((res) => {
      try {
        const data = JSON.parse(res.data)

        if (data.type === 'auth_ok') {
          console.log('🔐 WebSocket 认证成功')
          return
        }

        if (data.type === 'chunk') {
          this.onChunk && this.onChunk(data.content)
          return
        }

        if (data.type === 'done') {
          this.onDone && this.onDone(data.session_id)
          return
        }

        if (data.type === 'error') {
          this.onError && this.onError(data.content)
        }
      } catch (e) {
        console.error('❌ WS 消息解析失败', e)
      }
    })

    this.socketTask.onClose(() => {
      this.isConnected = false
      console.log('🔌 WebSocket 已关闭')
      this.autoReconnect(token, wsUrl)
    })

    this.socketTask.onError((err) => {
      console.error('❌ WebSocket 错误', err)
      this.isConnected = false
      this.onError && this.onError('连接异常')
    })
  }

  /**
   * 自动重连
   */
  autoReconnect(token, url) {
    if (this.reconnectAttempts >= this.maxReconnect) return
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000)
    this.reconnectAttempts++
    console.log(`🔄 ${delay}ms 后重连 (第${this.reconnectAttempts}次)...`)

    this.reconnectTimer = setTimeout(() => {
      this.connect(token, url)
    }, delay)
  }

  /**
   * 发送查询
   */
  sendQuery(query, sessionId) {
    if (!this.isConnected) {
      this.onError && this.onError('未连接')
      return
    }
    this.send({
      type: 'query',
      query,
      session_id: sessionId || null
    })
  }

  /**
   * 发送数据
   */
  send(data) {
    if (!this.socketTask) return
    this.socketTask.send({
      data: JSON.stringify(data),
      fail: (err) => {
        console.error('❌ WS 发送失败', err)
      }
    })
  }

  /**
   * 关闭连接
   */
  close() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    this.reconnectAttempts = this.maxReconnect // 阻止自动重连
    if (this.socketTask) {
      this.socketTask.close()
      this.socketTask = null
    }
    this.isConnected = false
  }
}

export default ChatWebSocket
