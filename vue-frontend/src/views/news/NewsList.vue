<template>
  <div class="max-w-6xl mx-auto px-4 py-10">
    <!-- ====== 顶部横幅 ====== -->
    <div class="news-banner h-48 md:h-64 -mx-4 -mt-10 mb-10 rounded-none md:rounded-3xl overflow-hidden relative">
      <img
        src="https://images.unsplash.com/photo-1472396961693-142e6e269027?w=1920&q=80"
        alt="农业"
        class="absolute inset-0 w-full h-full object-cover"
        style="filter:brightness(0.5) saturate(0.9)"
        loading="lazy"
      />
      <div class="absolute inset-0" style="background:linear-gradient(135deg,rgba(26,74,46,0.5),rgba(26,74,46,0.3))"></div>
      <div class="absolute inset-0 flex items-center justify-center">
        <div class="text-center text-white">
          <!-- 装饰线 -->
          <div class="flex items-center justify-center gap-4 mb-3">
            <div class="h-px w-12 gold-line-left"></div>
            <span class="text-xs tracking-[0.3em] opacity-60">AGRICULTURE NEWS</span>
            <div class="h-px w-12 gold-line-right"></div>
          </div>
          <h1 class="font-['Noto_Serif_SC'] text-4xl md:text-5xl font-bold mb-2" style="text-shadow:0 4px 20px rgba(0,0,0,0.3)">农业新闻</h1>
          <p class="text-white/75 text-sm md:text-base font-light tracking-wide">最新农业政策、市场动态与行业资讯</p>
        </div>
      </div>
    </div>

    <!-- ====== 搜索框 ====== -->
    <div class="max-w-xl mx-auto mb-12">
      <div class="search-box-wrapper">
        <el-input
          v-model="kw"
          placeholder="搜索农业新闻…"
          size="large"
          clearable
          :prefix-icon="Search"
          @keyup.enter="search"
          @clear="load"
          class="news-search"
        >
          <template #append>
            <el-button :icon="Search" @click="search" class="search-btn">搜索</el-button>
          </template>
        </el-input>
      </div>
    </div>

    <!-- ====== 骨架屏 ====== -->
    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="i in 6" :key="i" class="rounded-2xl overflow-hidden bg-white border border-[#e8e0d4]">
        <div class="h-44 skeleton"></div>
        <div class="p-5 space-y-3">
          <div class="h-5 skeleton rounded w-3/4"></div>
          <div class="h-4 skeleton rounded w-full"></div>
          <div class="h-4 skeleton rounded w-2/3"></div>
        </div>
      </div>
    </div>

    <!-- ====== 新闻列表：头条 + 网格混合布局 ====== -->
    <template v-if="!loading && list.length">
      <!-- 头条大卡 -->
      <div
        class="featured-card group mb-6 rounded-3xl overflow-hidden cursor-pointer bg-white border border-[#e8e0d4] hover:shadow-2xl transition-all duration-500"
        @click="$router.push('/news/' + list[0].id)"
      >
        <div class="flex flex-col md:flex-row">
          <div class="md:w-3/5 h-60 md:h-80 overflow-hidden relative">
            <img src="/images/默认新闻.jpg" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
            <div class="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
            <span v-if="list[0].is_top" class="featured-badge absolute top-4 left-4 px-3 py-1 rounded-lg text-xs font-bold text-white"
              style="background:linear-gradient(135deg,var(--gold),#D4A531)">🔥 置顶</span>
          </div>
          <div class="md:w-2/5 p-8 flex flex-col justify-center">
            <div class="flex items-center gap-2 mb-3">
              <span class="text-xs px-2 py-0.5 rounded-full" style="background:var(--green-mist);color:var(--green)">头条</span>
            </div>
            <h2 class="font-['Noto_Serif_SC'] text-xl md:text-2xl font-bold mb-3 leading-snug" style="color:var(--brown)">{{ list[0].title }}</h2>
            <p class="text-sm leading-relaxed mb-4 line-clamp-3" style="color:var(--brown-faint)">{{ list[0].description || '暂无简介' }}</p>
            <div class="flex items-center gap-4 text-xs" style="color:#bbb">
              <span>{{ list[0].source }}</span>
              <span>{{ list[0].ctime }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 其余卡片网格（剔除第一项） -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="item in list.slice(1)"
          :key="item.id"
          class="news-card group bg-white rounded-2xl overflow-hidden cursor-pointer border border-[#e8e0d4] hover:shadow-xl transition-all duration-400"
          @click="$router.push('/news/' + item.id)"
        >
          <div class="h-48 bg-[#f5ede0] relative overflow-hidden">
            <img
              src="/images/默认新闻.jpg"
              class="w-full h-full object-cover transition-transform duration-600 group-hover:scale-110"
              loading="lazy"
            />
            <span v-if="item.is_top" class="absolute top-3 left-3 px-2.5 py-0.5 rounded-md text-xs font-bold text-white top-badge"
              style="background:var(--gold)">置顶</span>
          </div>
          <div class="p-5">
            <h3 class="font-['Noto_Serif_SC'] font-bold mb-2 line-clamp-2 leading-snug group-hover:text-[var(--green)] transition-colors" style="color:var(--brown)">{{ item.title }}</h3>
            <p class="text-sm line-clamp-2 mb-4 leading-relaxed" style="color:var(--brown-faint)">{{ item.description || '暂无简介' }}</p>
            <div class="flex justify-between items-center text-xs" style="color:#bbb">
              <span class="flex items-center gap-1.5">
                <span class="w-1.5 h-1.5 rounded-full" style="background:var(--green-light)"></span>
                {{ item.source }}
              </span>
              <span>{{ item.ctime }}</span>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- 空状态 -->
    <div v-if="!loading && !list.length" class="text-center py-24">
      <div class="text-6xl mb-4 opacity-20">📰</div>
      <p class="text-sm" style="color:#ccc">暂无新闻</p>
    </div>

    <!-- ====== 分页 ====== -->
    <div class="flex justify-center mt-10" v-if="total > pageSize">
      <el-pagination
        v-model:current-page="page"
        :page-size="pageSize"
        :total="total"
        layout="prev, pager, next, total, jumper"
        @current-change="load"
        class="news-pagination"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getNewsList } from '@/api/news'
import { Search } from '@element-plus/icons-vue'

const list = ref([]); const kw = ref(''); const loading = ref(true)
const page = ref(1); const pageSize = ref(15); const total = ref(0)

async function load() {
  loading.value = true
  try {
    const r = await getNewsList(page.value, pageSize.value, kw.value)
    list.value = r?.items || []
    total.value = r?.total || 0
  } catch { list.value = [] }
  finally { loading.value = false }
}
async function search() {
  page.value = 1
  load()
}
onMounted(load)
</script>

<style scoped>
/* ===== 横幅 ===== */
.news-banner img {
  animation: ken-burns 25s ease-in-out infinite alternate;
}
@keyframes ken-burns {
  0% { transform: scale(1); }
  100% { transform: scale(1.12); }
}
.gold-line-left {
  background: linear-gradient(90deg, transparent, var(--gold));
  animation: lineExtendLeft 0.8s ease forwards;
}
.gold-line-right {
  background: linear-gradient(90deg, var(--gold), transparent);
  animation: lineExtendRight 0.8s ease forwards;
}
@keyframes lineExtendLeft {
  0% { width: 0; }
  100% { width: 48px; }
}
@keyframes lineExtendRight {
  0% { width: 0; }
  100% { width: 48px; }
}

/* ===== 搜索框 ===== */
.news-search :deep(.el-input__wrapper) {
  border-radius: 16px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}
.news-search :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 3px rgba(45, 122, 74, 0.1), 0 4px 20px rgba(0, 0, 0, 0.06);
}
.search-btn {
  background: var(--green) !important;
  border-color: var(--green) !important;
  color: #fff !important;
  border-radius: 0 14px 14px 0 !important;
}

/* ===== 头条卡 ===== */
.featured-badge {
  animation: badgePulse 2s ease-in-out infinite;
}
@keyframes badgePulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(232, 184, 75, 0.4); }
  50% { box-shadow: 0 0 0 8px rgba(232, 184, 75, 0); }
}

/* ===== 新闻卡片 ===== */
.news-card {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
.news-card:hover {
  transform: translateY(-4px);
  border-color: var(--green-mist) !important;
}
.top-badge {
  transition: all 0.3s ease;
}
.news-card:hover .top-badge {
  box-shadow: 0 0 12px rgba(232, 184, 75, 0.5);
}

/* ===== 分页 ===== */
.news-pagination :deep(.el-pager li.is-active) {
  background: var(--green) !important;
  border-radius: 10px;
}
.news-pagination :deep(.el-pager li) {
  border-radius: 10px;
  transition: all 0.2s;
}
</style>
