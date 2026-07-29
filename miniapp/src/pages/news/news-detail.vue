<template>
  <view class="news-detail-page">
    <NavBar :title="title" :show-back="true" />

    <!-- 错误状态 -->
    <view class="error-state" v-if="isError && !loading">
      <text class="error-icon">⚠️</text>
      <text class="error-text">{{ errorMsg }}</text>
    </view>

    <!-- 加载完成 -->
    <scroll-view class="detail-scroll" scroll-y v-if="news">
      <view class="detail-header">
        <text class="detail-title">{{ news.title }}</text>
        <view class="detail-meta">
          <text class="detail-source">{{ news.source || '农业资讯' }}</text>
          <text class="detail-time">{{ news.ctime }}</text>
        </view>
      </view>

      <image class="detail-image" src="/static/images/default-news.jpg" mode="widthFix" />

      <view class="detail-content">
        <MarkdownRender v-if="news.description" :content="news.description" />
        <view v-else class="no-content">
          <text class="no-content-text">当前新闻暂无摘要内容</text>
        </view>
        <!-- 始终显示原文链接 -->
        <view class="origin-link" @tap="openUrl(news.url)" v-if="news.url">
          <text class="origin-icon">🔗</text>
          <text class="origin-text">查看原文</text>
          <text class="origin-arrow">›</text>
        </view>
      </view>

      <view class="bottom-safe" />
    </scroll-view>

    <LoadingSkeleton v-if="loading" :count="3" type="card" />

    <!-- 详情样式 -->
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import NavBar from '@/components/NavBar.vue'
import LoadingSkeleton from '@/components/LoadingSkeleton.vue'
import MarkdownRender from '@/components/MarkdownRender.vue'
import { getNewsDetail } from '@/api/news'
import { handleError } from '@/utils/error'

const news = ref(null)
const title = ref('新闻详情')
const loading = ref(true)
const isError = ref(false)
const errorMsg = ref('')
let newsId = null

onLoad((options) => {
  newsId = options?.id
  if (!newsId) {
    isError.value = true
    errorMsg.value = '缺少新闻ID参数'
    loading.value = false
    return
  }
  loadDetail()
})

async function loadDetail() {
  loading.value = true
  isError.value = false
  try {
    const result = await getNewsDetail(newsId)
    if (!result) {
      isError.value = true
      errorMsg.value = '新闻不存在或已删除'
      return
    }
    news.value = result
    title.value = (result.title || '新闻详情').slice(0, 20)
    uni.setNavigationBarTitle({ title: title.value })
  } catch (err) {
    isError.value = true
    errorMsg.value = err.message || '加载失败'
    handleError(err, { fallbackMsg: '加载失败' })
  } finally {
    loading.value = false
  }
}

function openUrl(url) {
  if (!url) return
  uni.showActionSheet({
    itemList: ['复制链接', '在浏览器中打开'],
    success: (res) => {
      if (res.tapIndex === 0) {
        uni.setClipboardData({ data: url, success: () => uni.showToast({ title: '链接已复制', icon: 'success' }) })
      } else if (res.tapIndex === 1) {
        uni.setClipboardData({ data: url, success: () => {
          uni.showToast({ title: '链接已复制，请粘贴到浏览器打开', icon: 'none' })
        }})
      }
    }
  })
}
</script>

<style scoped>
.news-detail-page {
  min-height: 100vh;
  background: #fff;
}
.detail-scroll {
  padding: 0 16px;
  height: calc(100vh - 44px);
}
.detail-header {
  padding: 20px 0 16px;
  border-bottom: 1px solid #F0ECE4;
}
.detail-title {
  font-size: 20px;
  font-weight: 700;
  color: #1A4A2E;
  line-height: 1.4;
  margin-bottom: 12px;
  display: block;
}
.detail-meta {
  display: flex;
  gap: 12px;
  align-items: center;
}
.detail-source {
  font-size: 12px;
  color: #2D7A4A;
  background: #E8F5E9;
  padding: 2px 10px;
  border-radius: 10px;
}
.detail-time {
  font-size: 12px;
  color: #C4A882;
}
.detail-image {
  width: 100%;
  border-radius: 12px;
  margin: 16px 0;
  background: #F5EDE0;
}
.detail-content {
  padding-bottom: 30px;
}
.bottom-safe {
  height: 30px;
}
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60px 20px;
}
.error-icon {
  font-size: 40px;
  margin-bottom: 12px;
}
.error-text {
  font-size: 14px;
  color: #8B7355;
  text-align: center;
}
.no-content { display: flex; flex-direction: column; align-items: center; padding: 30px 0; gap: 12px; }
.no-content-text { font-size: 14px; color: #C4A882; }
.read-origin { font-size: 15px; color: #2D7A4A; font-weight: 500; padding: 8px 20px; border: 1px solid #2D7A4A; border-radius: 20px; }
.origin-link {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-top: 24px;
  padding: 14px;
  background: #F8F6F2;
  border-radius: 12px;
  cursor: pointer;
}
.origin-link:active { background: #F0ECE4; }
.origin-icon { font-size: 16px; }
.origin-text { font-size: 14px; color: #2D7A4A; font-weight: 500; }
.origin-arrow { font-size: 18px; color: #2D7A4A; }
</style>
