<template>
  <view class="knowledge-page">
    <!-- 导航栏 -->
    <view class="knowledge-header">
      <text class="header-title">📚 农技知识库</text>
    </view>

    <!-- 搜索框 -->
    <view class="search-box">
      <text class="search-icon">🔍</text>
      <input class="search-input" v-model="searchQuery" placeholder="搜索病虫害、种植技术..." @confirm="doSearch" confirm-type="search" />
      <text class="search-clear" v-if="searchQuery" @tap="clearSearch">✕</text>
    </view>

    <scroll-view class="knowledge-scroll" scroll-y refresher-enabled :refresher-triggered="refreshing" @refresherrefresh="onRefresh" @scrolltolower="loadMore">
      <!-- 分类标签 -->
      <scroll-view class="category-scroll" scroll-x show-scrollbar="false">
        <view
          class="category-tag"
          v-for="cat in categories"
          :key="cat.value"
          :class="{ active: activeCategory === cat.value }"
          @tap="switchCategory(cat.value)"
        >
          <text>{{ cat.label }}</text>
        </view>
      </scroll-view>

      <!-- 搜索结果 -->
      <view class="search-results" v-if="searchResults.length">
        <view class="result-header">
          <text class="result-title">🔍 搜索结果</text>
        </view>
        <view class="result-item" v-for="(r, i) in searchResults" :key="i">
          <text class="result-content">{{ r.content }}</text>
          <text class="result-source" v-if="r.metadata?.source">来源: {{ r.metadata.source }}</text>
        </view>
      </view>

      <!-- 知识列表 -->
      <view class="knowledge-list" v-else>
        <KnowledgeCard
          v-for="item in knowledgeList"
          :key="item.id"
          :item="item"
          @tap="showDetail(item)"
        />
        <LoadingSkeleton v-if="loading" :count="4" type="card" />
        <EmptyState v-if="!loading && !knowledgeList.length" title="暂无知识内容" desc="选择其他分类试试" />
      </view>

      <view class="bottom-safe" />
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import KnowledgeCard from '@/components/KnowledgeCard.vue'
import LoadingSkeleton from '@/components/LoadingSkeleton.vue'
import EmptyState from '@/components/EmptyState.vue'
import { KNOWLEDGE_CATEGORIES } from '@/utils/constants'
import { getKnowledgeList, searchKnowledge } from '@/api/knowledge'
import { handleError } from '@/utils/error'

const categories = KNOWLEDGE_CATEGORIES
const activeCategory = ref('')
const knowledgeList = ref([])
const searchQuery = ref('')
const searchResults = ref([])
const loading = ref(true)
const refreshing = ref(false)

onMounted(async () => {
  await loadData()
})

async function loadData() {
  loading.value = true
  try {
    knowledgeList.value = await getKnowledgeList(activeCategory.value)
  } catch (e) {
    console.error('加载知识库失败', e)
  } finally {
    loading.value = false
  }
}

async function switchCategory(value) {
  activeCategory.value = value
  searchQuery.value = ''
  searchResults.value = []
  await loadData()
}

async function doSearch() {
  if (!searchQuery.value.trim()) return
  searchResults.value = []
  loading.value = true
  try {
    const results = await searchKnowledge(searchQuery.value, 5)
    searchResults.value = Array.isArray(results) ? results : []
  } catch (e) {
    uni.showToast({ title: '搜索失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

function clearSearch() {
  searchQuery.value = ''
  searchResults.value = []
}

async function onRefresh() {
  refreshing.value = true
  await loadData()
  refreshing.value = false
}

function loadMore() {}

function showDetail(item) {
  uni.showModal({
    title: item.title,
    content: item.content?.slice(0, 500) || '暂无详情',
    showCancel: false
  })
}
</script>

<style scoped>
.knowledge-page {
  background: #FDF8F3;
  min-height: 100vh;
}
.knowledge-header {
  padding: 56px 16px 12px;
  text-align: center;
}
.header-title {
  font-size: 20px;
  font-weight: 700;
  color: #1A4A2E;
}

/* 搜索框 */
.search-box {
  display: flex;
  align-items: center;
  margin: 0 16px 12px;
  background: #fff;
  border-radius: 12px;
  padding: 10px 14px;
  border: 1px solid #E8E0D4;
  gap: 8px;
}
.search-icon {
  font-size: 16px;
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
.search-clear {
  font-size: 14px;
  color: #C4A882;
  padding: 4px;
}

.knowledge-scroll {
  height: calc(100vh - 120px);
  padding: 0 16px;
}

/* 分类标签 */
.category-scroll {
  white-space: nowrap;
  padding-bottom: 12px;
}
.category-tag {
  display: inline-flex;
  padding: 8px 18px;
  margin-right: 8px;
  border-radius: 20px;
  font-size: 13px;
  background: #f5f0eb;
  color: #8B7355;
  transition: all 0.2s;
}
.category-tag.active {
  background: #E8F5E9;
  color: #2D7A4A;
  font-weight: 600;
}

/* 搜索结果 */
.search-results {
  margin-bottom: 16px;
}
.result-header {
  margin-bottom: 8px;
}
.result-title {
  font-size: 14px;
  font-weight: 600;
  color: #1A4A2E;
}
.result-item {
  background: #fff;
  border-radius: 12px;
  padding: 14px;
  margin-bottom: 8px;
  border-left: 3px solid #2D7A4A;
}
.result-content {
  font-size: 13px;
  color: #2C1810;
  line-height: 1.6;
}
.result-source {
  font-size: 11px;
  color: #C4A882;
  margin-top: 6px;
  display: block;
}

.bottom-safe {
  height: 20px;
}
</style>
