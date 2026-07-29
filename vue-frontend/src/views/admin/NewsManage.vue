<template>
  <div>
    <div class="flex items-center justify-between mb-5">
      <h2 class="font-['Noto_Serif_SC'] text-xl font-bold" style="color:var(--brown)">新闻管理</h2>
      <el-button type="primary" :icon="Plus" @click="handleSync" :loading="syncing">同步新闻</el-button>
    </div>
    <div class="bg-white rounded-2xl border border-[#e8e0d4] overflow-hidden">
      <el-table :data="list" stripe v-loading="loading" empty-text="暂无新闻">
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="title" label="标题" min-width="240" show-overflow-tooltip />
        <el-table-column prop="source" label="来源" width="110" />
        <el-table-column label="时间" width="160"><template #default="{row}">{{ row.ctime }}</template></el-table-column>
        <el-table-column label="置顶" width="70" align="center">
          <template #default="{row}">
            <el-tag :type="row.is_top?'warning':'info'" size="small" @click.stop="handleToggleTop(row)" style="cursor:pointer">{{ row.is_top?'是':'否' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="70" align="center">
          <template #default="{row}"><el-tag :type="row.is_active?'success':'danger'" size="small">{{ row.is_active?'正常':'已删' }}</el-tag></template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{row}">
            <el-button size="small" type="danger" @click="handleDel(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="flex justify-center py-4" v-if="total > pageSize">
        <el-pagination
          v-model:current-page="page"
          :page-size="pageSize"
          :total="total"
          layout="prev, pager, next, total"
          @current-change="load"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getAdminNewsList } from '@/api/admin'
import { syncNews, deleteNews, toggleNewsTop } from '@/api/news'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'

const list = ref([]), loading = ref(false), syncing = ref(false)
const page = ref(1), pageSize = ref(50), total = ref(0)

async function load() {
  loading.value = true
  try {
    const r = await getAdminNewsList(page.value, pageSize.value)
    list.value = r?.items || []
    total.value = r?.total || 0
  } catch { list.value = [] }
  finally { loading.value = false }
}
async function handleSync() {
  syncing.value = true
  try {
    const r = await syncNews(49, 1)
    ElMessage.success(`获取 ${r.fetched} 条，新增 ${r.saved} 条`)
    load()
  } catch { ElMessage.error('同步失败') }
  finally { syncing.value = false }
}
async function handleDel(id) {
  try {
    await ElMessageBox.confirm('确定删除该新闻？','提示',{type:'warning'})
    await deleteNews(id)
    ElMessage.success('已删除'); load()
  } catch {}
}
async function handleToggleTop(row) {
  try {
    await toggleNewsTop(row.id)
    ElMessage.success(row.is_top ? '已取消置顶' : '已置顶')
    load()
  } catch { ElMessage.error('操作失败') }
}
onMounted(load)
</script>
