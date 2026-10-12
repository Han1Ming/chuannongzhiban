<template>
  <div
    class="kg-search-bar shrink-0 border-b"
    style="background: rgba(255,255,255,0.92); border-color: #e8e0d4;"
  >
    <div class="max-w-7xl mx-auto px-4 sm:px-6 py-4">
      <div class="flex items-center gap-3">
        <el-autocomplete
          v-model="keyword"
          class="flex-1 kg-search-input"
          :fetch-suggestions="querySearch"
          :trigger-on-focus="false"
          placeholder="搜索作物、病害、症状、药物、购买渠道..."
          clearable
          size="large"
          @select="handleSelect"
          @keyup.enter="submit"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
          <template #append>
            <el-button type="primary" :icon="Search" @click="submit">搜索</el-button>
          </template>
        </el-autocomplete>
        <el-tooltip content="回到完整图谱" placement="bottom">
          <el-button size="large" :icon="RefreshLeft" @click="$emit('reset')">全图</el-button>
        </el-tooltip>
      </div>
      <div class="flex items-center flex-wrap gap-2 mt-3">
        <span class="text-xs font-medium" style="color: var(--brown-faint)">推荐：</span>
        <el-tag
          v-for="r in recommendations"
          :key="r.name"
          class="kg-recommend-tag cursor-pointer"
          effect="plain"
          size="large"
          @click="$emit('search', r.name)"
        >{{ r.name }}</el-tag>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
// 必须显式 import：全局注册只解决**标签形式**（<Search />），
// 而 :icon="Search" / :icon="RefreshLeft" 是**值绑定**，会把 Search 当成实例上的属性去读，
// 没有 import 时读到 undefined —— 结果是按钮图标空白，并在渲染期刷
// 「Property "Search" was accessed during render but is not defined on instance」警告。
import { RefreshLeft, Search } from '@element-plus/icons-vue'
import { searchGraphNodes } from '@/api/knowledgeGraph'

defineProps({
  recommendations: { type: Array, default: () => [] }
})

const emit = defineEmits(['search', 'reset'])
const keyword = ref('')
let timer = null

function querySearch(queryString, cb) {
  clearTimeout(timer)
  const q = (queryString || '').trim()
  if (!q) return cb([])
  timer = setTimeout(async () => {
    try {
      const list = await searchGraphNodes(q)
      cb(list.map(n => ({ value: n.name, ...n })))
    } catch {
      cb([])
    }
  }, 200)
}

function handleSelect(item) {
  if (item?.name) emit('search', item.name)
}

function submit() {
  if (keyword.value?.trim()) emit('search', keyword.value.trim())
}
</script>

<style scoped>
.kg-search-input :deep(.el-input-group__append) {
  background: var(--green);
  border-color: var(--green);
}
.kg-search-input :deep(.el-input-group__append .el-button) {
  color: #fff;
}
.kg-search-input :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px var(--green) inset;
}
.kg-recommend-tag {
  border-radius: 999px;
  font-weight: 500;
  transition: all 0.2s ease;
}
.kg-recommend-tag:hover {
  color: var(--green-deep);
  border-color: var(--green);
  background: var(--green-mist);
}
</style>
