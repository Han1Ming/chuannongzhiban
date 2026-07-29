<template>
  <div class="max-w-6xl mx-auto px-4 py-10">
    <!-- ====== 顶部横幅 ====== -->
    <div class="knowledge-banner w-full h-44 md:h-60 -mx-4 -mt-10 mb-10 rounded-none md:rounded-3xl overflow-hidden relative shrink-0">
      <img
        src="https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=1920&q=80"
        alt="雾中乡村"
        class="absolute inset-0 w-full h-full object-cover"
        style="filter:brightness(0.5);min-width:100%;min-height:100%"
        loading="lazy"
      />
      <div class="absolute inset-0" style="background:linear-gradient(135deg,rgba(26,74,46,0.55),rgba(45,122,74,0.3))"></div>
      <div class="absolute inset-0 flex items-center justify-center">
        <div class="text-center text-white">
          <h1 class="font-['Noto_Serif_SC'] text-4xl md:text-5xl font-bold mb-2">农技知识库</h1>
          <p class="text-white/70 text-sm md:text-base font-light tracking-wide">覆盖水稻、柑橘、茶叶、畜牧等领域的专业知识</p>
          <div class="w-16 h-px bg-[#E8B84B]/60 mx-auto mt-4"></div>
        </div>
      </div>
    </div>

    <!-- ====== 分类筛选（药丸标签） ====== -->
    <div class="flex flex-wrap justify-center gap-2.5 mb-10">
      <button
        v-for="c in cats"
        :key="c.value"
        class="cat-pill px-5 py-2.5 rounded-full text-sm font-medium border-2 transition-all duration-300 cursor-pointer"
        :class="c.value === cur ? 'cat-pill-active' : 'cat-pill-inactive'"
        @click="cur = c.value; load()"
      >
        <!-- 分类小圆点 -->
        <span class="cat-dot" :class="c.value === cur ? 'cat-dot-active' : ''"></span>
        {{ c.label }}
      </button>
    </div>

    <!-- ====== 搜索 ====== -->
    <div class="max-w-xl mx-auto mb-10">
      <div class="search-box-wrapper">
        <el-input
          v-model="kw"
          placeholder="搜索农业知识…"
          size="large"
          clearable
          :prefix-icon="Search"
          @keyup.enter="handleSearch"
          @clear="load"
          class="knowledge-search"
        >
          <template #append>
            <el-button :icon="Search" @click="handleSearch" class="search-btn">搜索</el-button>
          </template>
        </el-input>
      </div>
    </div>

    <!-- ====== RAG AI 检索结果 ====== -->
    <transition-group name="rag" tag="div">
      <div v-if="rag.length" key="rag-box" class="max-w-3xl mx-auto mb-10 p-6 rounded-2xl rag-box"
        style="background:linear-gradient(135deg,#FEF3C7,#FDF8F3,#FEF9E7)">
        <div class="flex items-center gap-2 mb-4">
          <span class="px-3 py-1 rounded-full text-xs font-bold" style="background:var(--gold);color:#7C5E00">🤖 AI 检索</span>
          <span class="text-xs" style="color:var(--brown-faint)">基于RAG技术的智能匹配结果</span>
        </div>
        <div
          v-for="(r, i) in rag"
          :key="i"
          class="rag-item py-3 border-b last:border-0"
          style="border-color:rgba(180,150,100,0.15)"
        >
          <div class="flex items-start gap-3">
            <div class="w-1 self-stretch rounded-full shrink-0" style="background:var(--green-light)"></div>
            <p class="text-sm leading-relaxed" style="color:#3E2C1C">{{ r.content }}</p>
          </div>
        </div>
      </div>
    </transition-group>

    <!-- ====== 骨架屏 ====== -->
    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 gap-5">
      <div v-for="i in 4" :key="i" class="rounded-2xl p-6 bg-white border border-[#e8e0d4] space-y-3">
        <div class="flex gap-2">
          <div class="h-6 skeleton rounded-full w-16"></div>
          <div class="h-6 skeleton rounded-full w-12"></div>
        </div>
        <div class="h-5 skeleton rounded w-3/4"></div>
        <div class="h-4 skeleton rounded w-full"></div>
        <div class="h-4 skeleton rounded w-2/3"></div>
      </div>
    </div>

    <!-- ====== 知识卡片 ====== -->
    <transition-group name="knowledge-list" tag="div" class="grid grid-cols-1 md:grid-cols-2 gap-5">
      <div
        v-for="item in list"
        :key="item.id"
        class="knowledge-card group bg-white rounded-2xl p-6 border border-[#e8e0d4] hover:shadow-lg transition-all duration-300 cursor-pointer relative overflow-hidden"
      >
        <!-- Hover 箭头 -->
        <div class="card-arrow absolute right-5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300"
          style="color:var(--green)">
          <span class="text-xl">→</span>
        </div>

        <!-- 分类标签 -->
        <div class="flex items-center gap-2 mb-3">
          <span class="px-3 py-1 rounded-full text-xs font-medium" style="background:var(--green-mist);color:var(--green)">
            <span class="cat-dot-inline" :style="{background:getCatColor(item.category)}"></span>
            {{ getLabel(item.category) }}
          </span>
          <span v-if="item.tags" class="text-xs px-2 py-0.5 rounded-full" style="background:#f5ede0;color:var(--brown-faint)">{{ item.tags }}</span>
        </div>

        <!-- 标题 -->
        <h3 class="font-['Noto_Serif_SC'] font-bold text-base mb-2 pr-8 group-hover:text-[var(--green)] transition-colors" style="color:var(--brown)">{{ item.title }}</h3>

        <!-- 内容摘要 -->
        <p class="text-sm leading-relaxed line-clamp-3 mb-4" style="color:var(--brown-faint)">{{ item.content }}</p>

        <!-- 底部 -->
        <div class="flex justify-between items-center text-xs" style="color:#ccc">
          <span v-if="item.source" class="flex items-center gap-1">
            <span class="w-1 h-1 rounded-full" style="background:var(--green-light)"></span>
            来源：{{ item.source }}
          </span>
          <span v-else></span>
          <span>{{ formatDate(item.created_at) }}</span>
        </div>
      </div>
    </transition-group>

    <!-- 空状态 -->
    <div v-if="!loading && !list.length && !rag.length" class="text-center py-24">
      <div class="text-6xl mb-4 opacity-15">📚</div>
      <p class="text-sm mb-2" style="color:#bbb">暂无知识条目</p>
      <p class="text-xs" style="color:#ddd">试试其他分类或搜索关键词</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getKnowledgeList, searchKnowledge } from '@/api/knowledge'
import { KNOWLEDGE_CATEGORIES } from '@/utils/constants'
import { formatDate } from '@/utils/format'
import { Search } from '@element-plus/icons-vue'

const CAT_COLORS = ['#2D7A4A', '#D97706', '#3B82F6', '#EC4899', '#6366F1', '#059669', '#7C3AED', '#DC2626']

const cats = KNOWLEDGE_CATEGORIES; const cur = ref(''); const kw = ref('')
const list = ref([]); const rag = ref([]); const loading = ref(true)

function getLabel(v) { return cats.find(c => c.value === v)?.label?.replace(/^[^\s]+\s/, '') || v }
function getCatColor(v) {
  const idx = cats.findIndex(c => c.value === v)
  return CAT_COLORS[idx % CAT_COLORS.length]
}

async function load() {
  loading.value = true; rag.value = []
  try { list.value = (await getKnowledgeList(cur.value || undefined)) || [] } catch { list.value = [] }
  finally { loading.value = false }
}
async function handleSearch() {
  if (!kw.value.trim()) return load()
  loading.value = true; list.value = []
  try { rag.value = (await searchKnowledge(kw.value.trim(), 5)) || [] } catch { rag.value = [] }
  finally { loading.value = false }
}
onMounted(load)
</script>

<style scoped>
/* ===== 分类药丸 ===== */
.cat-pill {
  position: relative;
  background: #fff;
  min-width: 88px;
  justify-content: center;
  display: inline-flex;
  align-items: center;
}
.cat-pill-inactive {
  border-color: #e8e0d4;
  color: var(--brown-soft);
}
.cat-pill-inactive:hover {
  border-color: var(--green);
  color: var(--green);
}
.cat-pill-active {
  background: linear-gradient(135deg, var(--green), var(--green-deep));
  border-color: transparent;
  color: #fff;
  box-shadow: 0 4px 16px rgba(45, 122, 74, 0.25);
}
.cat-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #e8e0d4;
  margin-right: 4px;
  vertical-align: middle;
  transition: all 0.3s;
}
.cat-dot-active {
  background: #fff;
  box-shadow: 0 0 6px rgba(255,255,255,0.5);
}
.cat-dot-inline {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 4px;
  vertical-align: middle;
}

/* ===== 搜索 ===== */
.knowledge-search :deep(.el-input__wrapper) {
  border-radius: 16px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}
.knowledge-search :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 3px rgba(45, 122, 74, 0.1), 0 4px 20px rgba(0, 0, 0, 0.06);
}
.search-btn {
  background: var(--green) !important;
  border-color: var(--green) !important;
  color: #fff !important;
  border-radius: 0 14px 14px 0 !important;
}

/* ===== RAG 结果 ===== */
.rag-box {
  animation: ragFadeIn 0.5s ease;
}
.rag-item {
  animation: ragItemSlide 0.4s ease forwards;
}
.rag-item:nth-child(2) { animation-delay: 0.08s; }
.rag-item:nth-child(3) { animation-delay: 0.16s; }
.rag-item:nth-child(4) { animation-delay: 0.24s; }
.rag-item:nth-child(5) { animation-delay: 0.32s; }
.rag-item:nth-child(6) { animation-delay: 0.40s; }

@keyframes ragFadeIn {
  0% { opacity: 0; transform: translateY(-10px); }
  100% { opacity: 1; transform: translateY(0); }
}
@keyframes ragItemSlide {
  0% { opacity: 0; transform: translateX(-12px); }
  100% { opacity: 1; transform: translateX(0); }
}

/* RAG transition */
.rag-enter-active { transition: all 0.4s ease; }
.rag-leave-active { transition: all 0.2s ease; }
.rag-enter-from { opacity: 0; transform: translateY(-10px); }
.rag-leave-to { opacity: 0; }

/* ===== 知识卡片 ===== */
.knowledge-card:hover {
  transform: translateY(-2px);
  border-color: var(--green-mist) !important;
}

/* 列表切换动画 */
.knowledge-list-enter-active { transition: all 0.4s ease; }
.knowledge-list-leave-active { transition: all 0.2s ease; }
.knowledge-list-enter-from { opacity: 0; transform: translateY(16px); }
.knowledge-list-leave-to { opacity: 0; }
</style>
