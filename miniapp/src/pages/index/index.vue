<template>
  <view class="home-page">
    <!-- 自定义导航栏 -->
    <NavBar title="川农智伴">
      <template #right>
        <view class="nav-msg" @tap="goToChat">
          <text class="msg-icon">💬</text>
        </view>
      </template>
    </NavBar>

    <scroll-view
      class="home-scroll"
      scroll-y
      refresher-enabled
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
      @scrolltolower="loadMore"
    >
      <!-- 天气卡片 -->
      <view class="weather-card">
        <view class="weather-left">
          <text class="weather-temp">26°</text>
          <text class="weather-desc">晴 · 宜宾</text>
        </view>
        <view class="weather-right">
          <text class="weather-emoji">☀️</text>
          <text class="weather-tip">今日适宜农事作业</text>
        </view>
      </view>

      <!-- 快捷提问 -->
      <view class="section">
        <view class="section-header">
          <text class="section-title">💬 快捷问一问</text>
        </view>
        <scroll-view class="quick-scroll" scroll-x show-scrollbar="false">
          <view class="quick-tag" v-for="(q, i) in quickQuestions" :key="i" @tap="askQuestion(q)">
            <text>{{ q }}</text>
          </view>
        </scroll-view>
      </view>

      <!-- 功能入口 -->
      <view class="section">
        <FunctionGrid :items="functions" @tap="onFuncTap" />
      </view>

      <!-- Banner -->
      <view class="banner-section">
        <swiper class="banner-swiper" circular autoplay interval="3000" indicator-dots indicator-color="rgba(255,255,255,0.4)" indicator-active-color="#2D7A4A">
          <swiper-item v-for="(b, i) in banners" :key="i">
            <view class="banner-item" :style="{ background: b.bg }">
              <text class="banner-icon">{{ b.icon }}</text>
              <view class="banner-text">
                <text class="banner-title">{{ b.title }}</text>
                <text class="banner-desc">{{ b.desc }}</text>
              </view>
            </view>
          </swiper-item>
        </swiper>
      </view>

      <!-- 最新资讯 -->
      <view class="section">
        <view class="section-header" @tap="goToNews">
          <text class="section-title">📰 最新资讯</text>
          <text class="section-more">查看更多 ›</text>
        </view>
        <!-- 未登录提示 -->
        <view class="login-prompt-card" v-if="newsList === null && !newsLoading" @tap="goToNews">
          <text class="prompt-icon">🔐</text>
          <text class="prompt-text">登录后查看最新农业资讯</text>
          <text class="prompt-arrow">去登录 ›</text>
        </view>
        <NewsCard v-for="item in newsList || []" :key="item.id" :item="item" :show-image="true" @tap="goToNewsDetail(item)" />
        <LoadingSkeleton v-if="newsLoading" :count="2" type="card" />
      </view>

      <!-- 底部安全区 -->
      <view class="bottom-safe" />
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import NavBar from '@/components/NavBar.vue'
import FunctionGrid from '@/components/FunctionGrid.vue'
import NewsCard from '@/components/NewsCard.vue'
import LoadingSkeleton from '@/components/LoadingSkeleton.vue'
import EmptyState from '@/components/EmptyState.vue'
import { HOME_FUNCTIONS, QUICK_QUESTIONS } from '@/utils/constants'
import { getLatestNews, getLatestNewsOptional } from '@/api/news'
import { useAuthStore } from '@/store/auth'
import { handleError } from '@/utils/error'

const authStore = useAuthStore()
const functions = HOME_FUNCTIONS
const quickQuestions = QUICK_QUESTIONS
const refreshing = ref(false)
const newsList = ref(null)
const newsLoading = ref(true)

const banners = [
  { icon: '🌾', title: 'AI智能问答', desc: '农业问题随时问', bg: 'linear-gradient(135deg, #E8F5E9, #C8E6C9)' },
  { icon: '📷', title: '拍照识病虫', desc: '一拍即知，精准防治', bg: 'linear-gradient(135deg, #FFF3E0, #FFE0B2)' },
  { icon: '📊', title: '收益计算器', desc: '算算今年赚多少', bg: 'linear-gradient(135deg, #E3F2FD, #BBDEFB)' }
]

onMounted(async () => { await loadNews() })

async function loadNews() {
  newsLoading.value = true
  try {
    const result = authStore.isLoggedIn
      ? await getLatestNews(5)
      : await getLatestNewsOptional(5)
    newsList.value = result
  } catch (e) {
    handleError(e, { fallbackMsg: '加载新闻失败' })
  } finally {
    newsLoading.value = false
  }
}

async function onRefresh() {
  refreshing.value = true
  await loadNews()
  refreshing.value = false
}

function loadMore() {}

function onFuncTap(item) {
  if (!item.page) { uni.showToast({ title: '功能开发中', icon: 'none' }); return }
  if (item.key === 'voice') { uni.switchTab({ url: '/pages/chat/chat' }); return }
  if (['chat', 'diagnose', 'farm-calc', 'farm-match'].includes(item.key)) {
    if (!authStore.isLoggedIn) {
      getApp().globalData.redirectPage = item.page
      uni.navigateTo({ url: '/pages/login/login' })
      return
    }
  }
  uni.navigateTo({ url: item.page })
}

function askQuestion(q) {
  if (!authStore.isLoggedIn) {
    getApp().globalData.redirectPage = '/pages/chat/chat'
    uni.navigateTo({ url: '/pages/login/login' })
    return
  }
  uni.switchTab({ url: '/pages/chat/chat' })
  uni.$emit('quick-question', q)
}

function goToChat() {
  if (!authStore.isLoggedIn) {
    uni.navigateTo({ url: '/pages/login/login' })
    return
  }
  uni.switchTab({ url: '/pages/chat/chat' })
}

function goToNews() {
  uni.navigateTo({ url: '/pages/news/news-list' })
}

function goToNewsDetail(item) {
  uni.navigateTo({ url: `/pages/news/news-detail?id=${item.id}` })
}
</script>

<style scoped>
.home-page { background: #FDF8F3; min-height: 100vh; }
.home-scroll { height: calc(100vh - 50px); padding: 0 16px; }

.weather-card {
  display: flex; align-items: center; justify-content: space-between;
  background: linear-gradient(135deg, #E8F5E9, #C8E6C9);
  border-radius: 16px; padding: 16px 20px; margin-bottom: 16px; margin-top: 8px;
}
.weather-left { display: flex; flex-direction: column; }
.weather-temp { font-size: 32px; font-weight: 700; color: #1A4A2E; line-height: 1.2; }
.weather-desc { font-size: 13px; color: #5C4033; margin-top: 2px; }
.weather-right { display: flex; flex-direction: column; align-items: center; }
.weather-emoji { font-size: 32px; }
.weather-tip { font-size: 11px; color: #5C4033; margin-top: 4px; }

.section { margin-bottom: 20px; }
.section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.section-title { font-size: 16px; font-weight: 700; color: #1A4A2E; }
.section-more { font-size: 13px; color: #8B7355; }

.quick-scroll { white-space: nowrap; padding-bottom: 4px; }
.quick-tag {
  display: inline-flex; padding: 8px 16px; background: #fff; border-radius: 20px;
  margin-right: 8px; font-size: 13px; color: #5C4033;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04); border: 1px solid #E8E0D4;
}
.quick-tag:active { background: #E8F5E9; border-color: #2D7A4A; }

.banner-section { margin-bottom: 20px; }
.banner-swiper { height: 120px; border-radius: 14px; overflow: hidden; }
.banner-item { display: flex; align-items: center; padding: 0 24px; height: 100%; gap: 16px; }
.banner-icon { font-size: 42px; }
.banner-text { display: flex; flex-direction: column; }
.banner-title { font-size: 16px; font-weight: 700; color: #1A4A2E; }
.banner-desc { font-size: 13px; color: #5C4033; margin-top: 2px; }

.login-prompt-card {
  display: flex; align-items: center; gap: 8px; padding: 14px 16px;
  background: #F8F6F2; border-radius: 12px; border: 1px solid #E8E0D4; margin-bottom: 8px;
}
.prompt-icon { font-size: 18px; }
.prompt-text { flex: 1; font-size: 14px; color: #8B7355; }
.prompt-arrow { font-size: 14px; color: #2D7A4A; font-weight: 500; }

.nav-msg { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; }
.msg-icon { font-size: 22px; }
.bottom-safe { height: 20px; }
</style>
