<template>
  <view class="session-list-page">
    <NavBar title="会话历史" :show-back="true" />

    <scroll-view class="list-scroll" scroll-y>
      <LoadingSkeleton v-if="loading" :count="5" type="card" />

      <view
        class="session-item"
        v-for="s in sessions"
        :key="s.id"
        :class="{ 'session-error': s.loadError }"
        @tap="goToChat(s.id)"
      >
        <view class="session-icon">💬</view>
        <view class="session-info">
          <text class="session-title">{{ s.title || '新对话' }}</text>
          <!-- 发起时间用服务端 created_at；最近对话时间单独展示，两者语义不同 -->
          <text class="session-time">发起 {{ formatDateTime(s.createdAt) }}</text>
          <text class="session-sub" v-if="s.updatedAt">最近 {{ relativeTime(s.updatedAt) }}</text>
        </view>
        <text class="session-act" @tap.stop="startRename(s)">✏️</text>
        <text class="session-del" @tap.stop="confirmDelete(s)">🗑️</text>
        <text class="session-arrow">›</text>
      </view>

      <EmptyState v-if="!sessions.length && !loading" icon="💬" title="暂无对话记录" desc="去首页开始一段新对话吧" />
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import NavBar from '@/components/NavBar.vue'
import LoadingSkeleton from '@/components/LoadingSkeleton.vue'
import EmptyState from '@/components/EmptyState.vue'
import { useChatStore } from '@/store/chat'
import { relativeTime, formatDate } from '@/utils/format'
import { handleError } from '@/utils/error'

const chat = useChatStore()
const sessions = ref([])
const loading = ref(true)

function formatDateTime(time) {
  return time ? formatDate(time, 'MM-DD HH:mm') : '—'
}

/**
 * 会话列表直接复用 chat store：
 * 列表已由 store 保证「只含当前登录用户、以服务端为准」，
 * 这里再单独发一次请求会拿到第二份真相源，重命名/删除后两边还会不一致。
 */
async function load() {
  loading.value = true
  try {
    await chat.loadSessionList(50)
    sessions.value = chat.conversations.filter((c) => c.session_id)
  } catch (err) {
    handleError(err, { fallbackMsg: '加载会话失败' })
    sessions.value = chat.conversations.filter((c) => c.session_id)
  } finally {
    loading.value = false
  }
}

onMounted(load)

function goToChat(id) {
  // 问答页是 tabBar 页面，switchTab 不会重新 mounted，用 globalData 传递目标会话
  getApp().globalData.targetSessionId = id
  uni.switchTab({ url: '/pages/chat/chat' })
}

function startRename(conv) {
  uni.showModal({
    title: '修改会话标题',
    editable: true,
    placeholderText: '请输入新的会话标题',
    content: conv.title || '',
    success: async (res) => {
      if (!res.confirm) return
      const title = (res.content || '').trim()
      if (!title) {
        uni.showToast({ title: '标题不能为空', icon: 'none' })
        return
      }
      try {
        await chat.renameConversation(conv.id, title)
        uni.showToast({ title: '标题已更新', icon: 'success' })
      } catch (err) {
        handleError(err, { fallbackMsg: '标题保存失败，已还原' })
      }
    }
  })
}

function confirmDelete(conv) {
  uni.showModal({
    title: '确认删除',
    content: `删除会话「${conv.title}」后不再出现在列表中`,
    success: async (res) => {
      if (!res.confirm) return
      try {
        await chat.deleteConversation(conv.id)
        sessions.value = chat.conversations.filter((c) => c.session_id)
        uni.showToast({ title: '已删除', icon: 'success' })
      } catch (err) {
        handleError(err, { fallbackMsg: '删除失败' })
      }
    }
  })
}
</script>

<style scoped>
.session-list-page { min-height: 100vh; background: #FDF8F3; }
.list-scroll { padding: 8px 16px; height: calc(100vh - 44px); }
.session-item {
  display: flex; align-items: center; gap: 10px; padding: 16px;
  background: #fff; border-radius: 14px; margin-bottom: 8px;
  box-shadow: 0 1px 4px rgba(26, 74, 46, 0.04);
}
.session-item:active { background: #F5EDE0; }
/* 会话消息拉取失败：给出视觉提示，避免用户以为会话是空的 */
.session-item.session-error { background: #FEF2F2; }
.session-icon { font-size: 24px; }
.session-info { flex: 1; min-width: 0; }
.session-title { font-size: 14px; font-weight: 600; color: #2C1810; display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; }
.session-time { font-size: 12px; color: #C4A882; margin-top: 2px; display: block; }
.session-sub { font-size: 11px; color: #D8C7B0; margin-top: 2px; display: block; }
.session-act { font-size: 15px; padding: 6px; }
.session-del { font-size: 15px; padding: 6px; }
.session-arrow { font-size: 20px; color: #C4A882; }
</style>
