<template>
  <view class="news-list-page">
    <NavBar title="农业新闻" :show-back="true">
      <template #right>
        <view class="nav-search" @tap="showSearch = true">
          <text class="search-btn-icon">🔍</text>
        </view>
      </template>
    </NavBar>

    <!-- 搜索栏 -->
    <view class="search-bar" v-if="showSearch">
      <view class="search-inner">
        <input class="search-input" v-model="keyword" placeholder="搜索新闻..." confirm-type="search" @confirm="doSearch" />
        <text class="search-cancel" @tap="cancelSearch">取消</text>
      </view>
    </view>

    <scroll-view class="news-scroll" scroll-y refresher-enabled :refresher-triggered="refreshing" @refresherrefresh="onRefresh" @scrolltolower="loadMore">
      <!-- 搜索模式 -->
      <template v-if="isSearching">
        <view class="search-results-count">共找到 {{ newsList.length }} 条结果</view>
        <NewsCard v-for="item in newsList" :key="item.id" :item="item" :show-image="true" @tap="goToDetail(item)" />
        <EmptyState v-if="!newsList.length && !loading" icon="🔍" title="未找到相关新闻" desc="换个关键词试试" />
      </template>

      <!-- 列表模式 -->
      <template v-else>
        <NewsCard v-for="item in newsList" :key="item.id" :item="item" :show-image="true" @tap="goToDetail(item)" />
        <LoadingSkeleton v-if="loading" :count="4" type="card" />
        <!-- 未登录提示 -->
        <EmptyState v-if="isRequireLogin && !loading" icon="🔐" title="登录后可查看新闻" desc="登录后获取最新农业资讯" action-text="去登录" @action="goToLogin" />
        <view class="load-more" v-if="hasMore && !loading">
          <text class="load-more-text">上拉加载更多</text>
        </view>
        <view class="load-more" v-if="!hasMore && newsList.length">
          <text class="load-more-text load-end">— 已经到底了 —</text>
        </view>
      </template>

      <view class="bottom-safe" />
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import NavBar from '@/components/NavBar.vue'
import NewsCard from '@/components/NewsCard.vue'
import LoadingSkeleton from '@/components/LoadingSkeleton.vue'
import EmptyState from '@/components/EmptyState.vue'
import { useAuthStore } from '@/store/auth'
import { getNewsList, searchNews, getNewsListOptional } from '@/api/news'
import { handleError } from '@/utils/error'

const authStore = useAuthStore()
const newsList = ref([])
const loading = ref(true)
const refreshing = ref(false)
const page = ref(1)
const hasMore = ref(true)
const keyword = ref('')
const showSearch = ref(false)
const isSearching = ref(false)
const isRequireLogin = ref(false)

onMounted(async () => {
  await loadNews(true)
})

async function loadNews(reset = false) {
  if (reset) { page.value = 1; newsList.value = [] }
  loading.value = true
  isRequireLogin.value = false
  try {
    const result = authStore.isLoggedIn
      ? await getNewsList(page.value, 15)
      : await getNewsListOptional(page.value, 15)
    if (result === null) { isRequireLogin.value = true; return }
    const items = result?.items || []
    if (reset) { newsList.value = items }
    else { newsList.value = [...newsList.value, ...items] }
    hasMore.value = items.length >= 15
  } catch (e) {
    handleError(e, { fallbackMsg: '加载新闻失败' })
  } finally { loading.value = false }
}

async function doSearch() {
  if (!keyword.value.trim()) return
  isSearching.value = true; loading.value = true
  try {
    const results = await searchNews(keyword.value, 20)
    newsList.value = Array.isArray(results) ? results : []
  } catch (e) { handleError(e, { fallbackMsg: '搜索失败' }) }
  finally { loading.value = false }
}

function cancelSearch() {
  showSearch.value = false; keyword.value = ''
  isSearching.value = false; loadNews(true)
}

function onRefresh() {
  refreshing.value = true
  ;(isSearching.value ? doSearch() : loadNews(true))
    .then(() => { refreshing.value = false })
}

function loadMore() {
  if (!hasMore.value || loading.value || isSearching.value) return
  page.value++; loadNews()
}

function goToDetail(item) {
  uni.navigateTo({ url: `/pages/news/news-detail?id=${item.id}` })
}

function goToLogin() {
  getApp().globalData.redirectPage = '/pages/news/news-list'
  uni.navigateTo({ url: '/pages/login/login' })
}
</script>

<style scoped>
.news-list-page {
  min-height: 100vh;
  background: #FDF8F3;
}
.nav-search {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.search-btn-icon {
  font-size: 18px;
}

.search-bar {
  padding: 8px 16px;
  background: #fff;
  border-bottom: 1px solid #E8E0D4;
}
.search-inner {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #F8F6F2;
  border-radius: 10px;
  padding: 8px 12px;
}
.search-input {
  flex: 1;
  font-size: 14px;
  color: #2C1810;
  height: 22px;
}
.search-input::placeholder {
  color: #C4A882;
}
.search-cancel {
  font-size: 14px;
  color: #2D7A4A;
}

.news-scroll {
  height: calc(100vh - 44px);
  padding: 12px 16px;
}
.search-results-count {
  font-size: 13px;
  color: #8B7355;
  margin-bottom: 12px;
}
.load-more {
  text-align: center;
  padding: 20px 0;
}
.load-more-text {
  font-size: 12px;
  color: #C4A882;
}
.load-end {
  color: #E8E0D4;
}
.bottom-safe {
  height: 20px;
}
</style>
