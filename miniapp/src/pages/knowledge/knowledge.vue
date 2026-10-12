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
          <!-- 检索通道如实标注：关键词降级时不能让人误以为是向量检索结果 -->
          <text class="result-mode" :class="{ 'result-mode-warn': searchChannel !== 'vector' }">
            {{ searchChannel === 'vector' ? '向量检索' : '关键词检索（已降级）' }}
          </text>
        </view>
        <view class="result-item" v-for="(r, i) in searchResults" :key="i">
          <text class="result-content">{{ r.content }}</text>
          <text class="result-source" v-if="r.source || r.similarity != null">
            <text v-if="r.source">来源: {{ String(r.source).split(/[\\/]/).pop() }}</text>
            <text v-if="r.similarity != null"> 匹配度 {{ (r.similarity * 100).toFixed(0) }}%</text>
          </text>
        </view>
      </view>

      <!-- 搜过但无结果：明确提示，而不是静默显示成"没有知识" -->
      <view class="search-empty" v-else-if="searched && !loading">
        <text class="search-empty-title">没有检索到匹配片段</text>
        <text class="search-empty-desc">换用更具体的关键词（病害名、作物名）再试</text>
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
// searched：区分「还没搜过」与「搜过但没命中」，避免无结果时静默显示成知识库为空
const searched = ref(false)
// 检索通道：vector 正常 / keyword 表示嵌入服务不可用已降级
const searchChannel = ref('vector')
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
  searched.value = true
  try {
    // 接口返回 { items, total, source_meta }；items[].retrieval 标明本条的检索通道
    const r = await searchKnowledge(searchQuery.value, 5)
    searchResults.value = r?.items || []
    searchChannel.value = r?.source_meta?.retrieval_mode || 'vector'
  } catch (e) {
    searchResults.value = []
    searchChannel.value = 'unknown'
    uni.showToast({ title: '搜索失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

function clearSearch() {
  searchQuery.value = ''
  searchResults.value = []
  searched.value = false
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
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.result-title {
  font-size: 14px;
  font-weight: 600;
  color: #1A4A2E;
}
/* 检索通道标签：降级时用琥珀色提示，避免误认为是向量检索结果 */
.result-mode {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 999px;
  background: #E8F5E9;
  color: #2D7A4A;
}
.result-mode-warn {
  background: #FEF3C7;
  color: #B45309;
}
/* 搜过但无结果的提示 */
.search-empty {
  padding: 28px 16px;
  text-align: center;
  background: #FAF8F4;
  border-radius: 14px;
  margin-bottom: 16px;
}
.search-empty-title {
  display: block;
  font-size: 14px;
  color: #5C4033;
  margin-bottom: 6px;
}
.search-empty-desc {
  display: block;
  font-size: 12px;
  color: #C4A882;
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
