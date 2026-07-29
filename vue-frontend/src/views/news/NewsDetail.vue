<template>
  <div class="max-w-3xl mx-auto px-4 py-10">
    <!-- 加载 -->
    <div v-if="loading" class="text-center py-24 space-y-6">
      <div class="h-8 skeleton rounded w-2/3 mx-auto"></div>
      <div class="h-4 skeleton rounded w-1/3 mx-auto"></div>
      <div class="h-64 skeleton rounded-2xl"></div>
      <div class="space-y-3">
        <div class="h-4 skeleton rounded w-full"></div>
        <div class="h-4 skeleton rounded w-5/6"></div>
        <div class="h-4 skeleton rounded w-4/6"></div>
      </div>
    </div>

    <!-- 内容 -->
    <template v-else-if="item">
      <!-- 文章头部 -->
      <header class="mb-10">
        <h1 class="font-['Noto_Serif_SC'] text-3xl md:text-4xl font-bold mb-5 leading-tight" style="color:var(--brown)">{{ item.title }}</h1>

        <!-- 元数据 -->
        <div class="flex flex-wrap items-center gap-4 text-sm mb-6" style="color:#999">
          <span class="flex items-center gap-1.5">
            <span class="w-1.5 h-1.5 rounded-full" style="background:var(--green-light)"></span>
            {{ item.source }}
          </span>
          <span class="w-1 h-1 rounded-full bg-[#ddd]"></span>
          <span>{{ item.ctime }}</span>
          <span class="w-1 h-1 rounded-full bg-[#ddd]"></span>
          <span v-if="item.pub_date" class="text-xs">发布于 {{ item.pub_date }}</span>
        </div>

        <!-- 分隔线 -->
        <div class="h-px" style="background:linear-gradient(90deg,var(--green-mist),transparent)"></div>

        <!-- 置顶标签 -->
        <span v-if="item.is_top" class="inline-flex items-center gap-1 mt-4 px-3 py-1 rounded-full text-xs font-bold"
          style="background:linear-gradient(135deg,var(--gold),#D4A531);color:#fff">
          📌 置顶文章
        </span>
      </header>

      <!-- 封面图 -->
      <img
        src="/images/默认新闻.jpg"
        class="w-full rounded-2xl mb-10"
        style="box-shadow:0 8px 32px rgba(0,0,0,0.08)"
        alt="新闻配图"
        loading="lazy"
      />

      <!-- 正文 -->
      <article class="prose-wrapper text-base leading-[1.85] mb-12" style="color:var(--brown-soft)">
        <p>{{ item.description || '暂无详细内容' }}</p>

        <!-- 原文链接 -->
        <a
          v-if="item.url"
          :href="item.url"
          target="_blank"
          rel="noopener"
          class="inline-flex items-center gap-2 mt-8 px-6 py-3 rounded-xl text-sm font-medium no-underline transition-all duration-300 hover:-translate-y-0.5"
          style="background:var(--green-mist);color:var(--green)"
        >
          查看原文 <span class="text-lg">↗</span>
        </a>
      </article>

      <!-- 底部导航 -->
      <div class="border-t border-[#f0ece4] pt-8">
        <div class="flex items-center justify-between">
          <button @click="$router.back()" class="back-nav-btn flex items-center gap-2 text-sm font-medium transition-all duration-300 cursor-pointer"
            style="color:var(--brown-faint);background:none;border:none">
            <span class="text-lg transition-transform duration-300 back-arrow">←</span> 返回列表
          </button>
          <router-link to="/news" class="text-sm no-underline transition-colors" style="color:var(--brown-faint)">
            更多新闻
          </router-link>
        </div>
      </div>
    </template>

    <!-- 不存在 -->
    <div v-else class="text-center py-28">
      <div class="text-6xl mb-5 opacity-20">📄</div>
      <p class="text-sm" style="color:#ccc">新闻不存在或已下架</p>
      <router-link to="/news" class="inline-block mt-4 text-sm font-medium" style="color:var(--green)">← 返回新闻列表</router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getNewsDetail } from '@/api/news'

const route = useRoute()
const item = ref(null); const loading = ref(true)

onMounted(async () => {
  try { item.value = await getNewsDetail(route.params.id) } catch { item.value = null }
  finally { loading.value = false }
})
</script>

<style scoped>
/* 正文排版 */
.prose-wrapper {
  max-width: 720px;
  word-break: break-word;
}

/* 返回按钮箭头动画 */
.back-nav-btn:hover .back-arrow {
  transform: translateX(-4px);
}
.back-nav-btn:hover {
  color: var(--green) !important;
}
</style>
