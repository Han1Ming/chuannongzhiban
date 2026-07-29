<template>
  <view class="session-list-page">
    <NavBar title="会话历史" :show-back="true" />

    <scroll-view class="list-scroll" scroll-y>
      <LoadingSkeleton v-if="loading" :count="5" type="card" />

      <view class="session-item" v-for="s in sessions" :key="s.id" @tap="goToChat(s.id)">
        <view class="session-icon">💬</view>
        <view class="session-info">
          <text class="session-title">{{ s.title || '新对话' }}</text>
          <text class="session-time">{{ formatTime(s.updated_at) }}</text>
        </view>
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
import { fetchSessions } from '@/api/chat'
import { relativeTime } from '@/utils/format'
import { handleError } from '@/utils/error'

const sessions = ref([])
const loading = ref(true)

onMounted(async () => {
  loading.value = true
  try {
    sessions.value = (await fetchSessions(50, 0)) || []
  } catch (err) {
    handleError(err, { fallbackMsg: '加载会话失败' })
  } finally {
    loading.value = false
  }
})

function formatTime(time) {
  return relativeTime(time)
}

function goToChat(id) {
  getApp().globalData.targetSessionId = id
  uni.switchTab({ url: '/pages/chat/chat' })
}
</script>

<style scoped>
.session-list-page { min-height: 100vh; background: #FDF8F3; }
.list-scroll { padding: 8px 16px; height: calc(100vh - 44px); }
.session-item {
  display: flex; align-items: center; gap: 12px; padding: 16px;
  background: #fff; border-radius: 14px; margin-bottom: 8px;
  box-shadow: 0 1px 4px rgba(26, 74, 46, 0.04);
}
.session-item:active { background: #F5EDE0; }
.session-icon { font-size: 24px; }
.session-info { flex: 1; min-width: 0; }
.session-title { font-size: 14px; font-weight: 600; color: #2C1810; display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; }
.session-time { font-size: 12px; color: #C4A882; margin-top: 2px; }
.session-arrow { font-size: 20px; color: #C4A882; }
</style>
