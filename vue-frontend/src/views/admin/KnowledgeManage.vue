<template>
  <div>
    <!-- ===== 上半部分：知识库条目管理 ===== -->
    <div class="flex items-center justify-between mb-5">
      <h2 class="font-['Noto_Serif_SC'] text-xl font-bold" style="color:var(--brown)">知识库管理</h2>
      <el-button type="primary" :icon="Plus" @click="openCreate">新建知识</el-button>
    </div>

    <div class="bg-white rounded-2xl border border-[#e8e0d4] p-5 mb-6">
      <h3 class="font-['Noto_Serif_SC'] font-bold text-sm mb-4" style="color:var(--brown)">📤 文件上传 — RAG 增强检索</h3>
      <el-upload
        class="upload-area"
        drag
        accept=".txt,.pdf,.docx,.xlsx,.csv"
        :auto-upload="false"
        :limit="1"
        :on-change="onFileChange"
        :on-remove="() => uploadFile = null"
      >
        <el-icon class="el-icon--upload" :size="40"><UploadFilled /></el-icon>
        <div class="text-sm mb-1">拖拽文件到此处，或 <em>点击选择</em></div>
        <template #tip>
          <div class="text-xs mt-1" style="color:#bbb">支持 txt / pdf / docx / xlsx / csv 格式</div>
        </template>
      </el-upload>
      <div class="flex gap-3 mt-4">
        <el-button type="primary" :disabled="!uploadFile" :loading="uploading" @click="handleUpload">上传并向量化</el-button>
        <el-tag v-if="uploadResult" :type="uploadResult.ok ? 'success' : 'danger'" size="small">{{ uploadResult.msg }}</el-tag>
      </div>
    </div>

    <!-- RAG 搜索测试 -->
    <div class="bg-white rounded-2xl border border-[#e8e0d4] p-5 mb-6">
      <div class="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h3 class="font-['Noto_Serif_SC'] font-bold text-sm" style="color:var(--brown)">🔍 知识库检索测试</h3>
        <!-- 通道状态：嵌入不可用时如实告知，避免管理员以为"检索坏了" -->
        <div class="flex items-center gap-2 flex-wrap">
          <el-tag v-if="stats" size="small" type="info" round>已索引 {{ stats.document_count ?? '-' }} 条切片</el-tag>
          <el-tag v-if="stats" size="small" round
            :type="stats.embedding_available ? 'success' : 'warning'">
            {{ stats.embedding_available ? '向量检索通道正常' : '向量通道不可用，已回退关键词检索' }}
          </el-tag>
        </div>
      </div>
      <div class="flex gap-3 flex-wrap">
        <el-input v-model="searchQuery" placeholder="输入搜索文本，测试RAG检索效果…" clearable style="flex:1;min-width:240px" @keyup.enter="handleSearchTest" />
        <el-select v-model="searchMode" style="width:170px">
          <el-option label="自动（向量优先）" value="auto" />
          <el-option label="仅向量检索" value="vector" />
          <el-option label="仅关键词检索" value="keyword" />
        </el-select>
        <el-button type="primary" :icon="Search" @click="handleSearchTest" :loading="searching">搜索</el-button>
      </div>
      <p v-if="stats && !stats.embedding_available" class="text-xs mt-2" style="color:#B45309">
        ⚠ {{ stats.embedding_error || '嵌入服务不可用' }}
      </p>

      <div v-if="searchError" class="mt-3 text-xs p-3 rounded-xl" style="background:#FEF2F2;color:#DC2626">
        {{ searchError }}
      </div>

      <div v-if="searchResults.length" class="mt-4 space-y-3">
        <div class="text-xs" style="color:var(--brown-faint)">
          共 {{ searchTotal }} 条匹配 ·
          本次通道：{{ searchChannel === 'vector' ? '向量检索' : '关键词检索' }}
        </div>
        <div v-for="(r,i) in searchResults" :key="i" class="p-3 rounded-xl" style="background:#F9F6F0">
          <div class="text-sm leading-relaxed" style="color:var(--brown-soft)">{{ r.content }}</div>
          <div class="text-xs mt-1" style="color:#bbb">
            <span v-if="r.similarity != null">匹配度 {{ (r.similarity * 100).toFixed(1) }}%</span>
            <span v-if="r.score != null"> · 距离分 {{ Number(r.score).toFixed(4) }}</span>
            <span v-if="r.source"> · 来源 {{ String(r.source).split(/[\\/]/).pop() }}</span>
            <span v-if="r.retrieval"> · {{ r.retrieval === 'vector' ? '向量' : '关键词' }}</span>
          </div>
        </div>
      </div>

      <!-- 无结果时明确提示，而不是静默空白 -->
      <div v-else-if="searched && !searching" class="mt-4 p-4 rounded-xl text-center" style="background:#FAF8F4">
        <p class="text-sm" style="color:var(--brown-soft)">没有检索到匹配片段</p>
        <p class="text-xs mt-1" style="color:var(--brown-faint)">
          {{ stats && !stats.embedding_available
            ? '当前为关键词检索通道，建议换用更具体的关键词；补齐嵌入服务额度后向量检索会自动恢复'
            : '建议换用更具体的关键词（病害名、作物名、政策关键词）' }}
        </p>
      </div>
    </div>

    <!-- ===== 下半部分：三个数据表 Tab ===== -->
    <div class="bg-white rounded-2xl border border-[#e8e0d4] overflow-hidden">
      <el-tabs v-model="activeTab" class="!px-5 !pt-3">
        <el-tab-pane label="🍃 农业知识库 (knowledge_items)" name="knowledge">
          <el-table :data="tabData.knowledge" stripe v-loading="tabLoading.knowledge" empty-text="暂无数据" max-height="400">
            <el-table-column prop="id" label="ID" width="60" />
            <el-table-column prop="title" label="标题" min-width="180" show-overflow-tooltip />
            <el-table-column prop="category" label="分类" width="80" />
            <el-table-column prop="content" label="内容" min-width="300" show-overflow-tooltip />
            <el-table-column label="创建时间" width="150"><template #default="{row}">{{ row.created_at }}</template></el-table-column>
          </el-table>
          <div class="flex justify-center py-3" v-if="tabTotal.knowledge > tabPageSize.knowledge">
            <el-pagination small v-model:current-page="tabPage.knowledge" :page-size="tabPageSize.knowledge" :total="tabTotal.knowledge" layout="prev, pager, next" @current-change="loadTab" />
          </div>
        </el-tab-pane>
        <el-tab-pane label="🌾 病虫害诊断记录 (farm_records)" name="farm">
          <el-table :data="tabData.farm" stripe v-loading="tabLoading.farm" empty-text="暂无数据" max-height="400">
            <el-table-column prop="id" label="ID" width="60" />
            <el-table-column prop="user_id" label="用户ID" width="70" />
            <el-table-column prop="diagnosis_result" label="诊断结果" min-width="220" show-overflow-tooltip />
            <el-table-column prop="advice" label="建议" min-width="220" show-overflow-tooltip />
            <el-table-column label="时间" width="150"><template #default="{row}">{{ row.created_at }}</template></el-table-column>
          </el-table>
          <div class="flex justify-center py-3" v-if="tabTotal.farm > tabPageSize.farm">
            <el-pagination small v-model:current-page="tabPage.farm" :page-size="tabPageSize.farm" :total="tabTotal.farm" layout="prev, pager, next" @current-change="loadTab" />
          </div>
        </el-tab-pane>
        <el-tab-pane label="📋 农业推荐方案 (recommendations)" name="rec">
          <el-table :data="tabData.rec" stripe v-loading="tabLoading.rec" empty-text="暂无数据" max-height="400">
            <el-table-column prop="id" label="ID" width="60" />
            <el-table-column prop="crop_name" label="作物" width="120" />
            <el-table-column prop="region" label="地区" width="90" />
            <el-table-column prop="farming_type" label="类型" width="80" />
            <el-table-column prop="season" label="季节" width="70" />
            <el-table-column prop="plan" label="方案" min-width="300" show-overflow-tooltip />
            <el-table-column label="时间" width="150"><template #default="{row}">{{ row.created_at }}</template></el-table-column>
          </el-table>
          <div class="flex justify-center py-3" v-if="tabTotal.rec > tabPageSize.rec">
            <el-pagination small v-model:current-page="tabPage.rec" :page-size="tabPageSize.rec" :total="tabTotal.rec" layout="prev, pager, next" @current-change="loadTab" />
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 新建知识弹窗 -->
    <el-dialog v-model="dialog" title="新建知识条目" width="540px">
      <el-form :model="form" label-width="70px">
        <el-form-item label="标题"><el-input v-model="form.title" /></el-form-item>
        <el-form-item label="分类"><el-select v-model="form.category" class="!w-full"><el-option v-for="c in cats" :key="c.value" :label="c.label.replace(/^.\.?\s/,'')" :value="c.value" /></el-select></el-form-item>
        <el-form-item label="内容"><el-input v-model="form.content" type="textarea" :rows="5" /></el-form-item>
        <el-form-item label="标签"><el-input v-model="form.tags" placeholder="逗号分隔" /></el-form-item>
        <el-form-item label="来源"><el-input v-model="form.source" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="dialog=0">取消</el-button><el-button type="primary" @click="handleCreate" :loading="saving">创建</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { getKnowledgeList, createKnowledge, deleteKnowledge } from '@/api/knowledge'
import { uploadKnowledgeFile, searchKnowledgeAdmin, getKnowledgeStats, getFarmRecords, getAdminKnowledgeItems, getRecommendations } from '@/api/admin'
import { KNOWLEDGE_CATEGORIES } from '@/utils/constants'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, UploadFilled } from '@element-plus/icons-vue'
import { formatDate } from '@/utils/format'

const cats = KNOWLEDGE_CATEGORIES.filter(c=>c.value)

// 知识条目管理
const list = ref([]), loading = ref(false), dialog = ref(false), saving = ref(false)
const form = ref({ title:'', category:'rice', content:'', tags:'', source:'' })

// 文件上传RAG
const uploadFile = ref(null), uploading = ref(false), uploadResult = ref(null)
// 检索测试：区分「没搜过」「搜过但无结果」「请求失败」三种状态，
// 否则管理员只能看到一片空白，无法判断问题出在哪
const searchQuery = ref(''), searchResults = ref([]), searching = ref(false)
const searchMode = ref('auto'), searchError = ref(''), searched = ref(false)
const searchTotal = ref(0), searchChannel = ref('vector')
const stats = ref(null)

// 三个数据表 Tab
const activeTab = ref('knowledge')
const tabData = reactive({ knowledge: [], farm: [], rec: [] })
const tabLoading = reactive({ knowledge: false, farm: false, rec: false })
const tabPage = reactive({ knowledge: 1, farm: 1, rec: 1 })
const tabPageSize = { knowledge: 15, farm: 15, rec: 15 }
const tabTotal = reactive({ knowledge: 0, farm: 0, rec: 0 })

async function load() {
  loading.value = true
  try { list.value = (await getKnowledgeList()) || [] } catch { list.value = [] }
  finally { loading.value = false }
}
function openCreate() { form.value = { title:'', category:'rice', content:'', tags:'', source:'' }; dialog.value = true }
async function handleCreate() {
  if (!form.value.title||!form.value.content) return ElMessage.warning('请填写标题和内容')
  saving.value = true
  try { await createKnowledge({...form.value}); ElMessage.success('创建成功'); dialog.value = false; load() } catch {}
  finally { saving.value = false }
}
async function handleDel(id) {
  try { await ElMessageBox.confirm('确定删除？','提示',{type:'warning'}); await deleteKnowledge(id); ElMessage.success('已删除'); load() } catch {}
}

// 文件上传
function onFileChange(uploadFileItem) {
  uploadFile.value = uploadFileItem.raw
  uploadResult.value = null
}
async function handleUpload() {
  if (!uploadFile.value) return
  uploading.value = true
  try {
    const r = await uploadKnowledgeFile(uploadFile.value)
    uploadResult.value = { ok: true, msg: `上传成功！分片数: ${r.chunks || '完成'}` }
    uploadFile.value = null
  } catch {
    uploadResult.value = { ok: false, msg: '上传失败' }
  }
  finally { uploading.value = false }
}
// RAG搜索测试
async function handleSearchTest() {
  if (!searchQuery.value.trim()) { searchResults.value = []; return }
  searching.value = true
  searchError.value = ''
  try {
    const r = await searchKnowledgeAdmin(searchQuery.value.trim(), 5, searchMode.value)
    searchResults.value = r?.items || []
    searchTotal.value = r?.total ?? searchResults.value.length
    searchChannel.value = r?.source_meta?.retrieval_mode || 'vector'
    if (r?.source_meta) stats.value = { ...(stats.value || {}), ...r.source_meta }
  } catch (e) {
    // 之前这里静默清空结果，管理员只看到"搜不到"，无法判断是没数据还是接口报错
    searchResults.value = []
    searchError.value = e?.message || '检索请求失败'
  } finally {
    searching.value = false
    searched.value = true
  }
}

async function loadStats() {
  try { stats.value = await getKnowledgeStats() } catch { /* 状态拿不到不影响检索测试 */ }
}

// 加载Tab数据
async function loadTab() {
  const t = activeTab.value
  tabLoading[t] = true
  try {
    if (t === 'knowledge') {
      const r = await getAdminKnowledgeItems(tabPage.knowledge, tabPageSize.knowledge)
      tabData.knowledge = r?.items || []; tabTotal.knowledge = r?.total || 0
    } else if (t === 'farm') {
      const r = await getFarmRecords(tabPage.farm, tabPageSize.farm)
      tabData.farm = r?.items || []; tabTotal.farm = r?.total || 0
    } else if (t === 'rec') {
      const r = await getRecommendations(tabPage.rec, tabPageSize.rec)
      tabData.rec = r?.items || []; tabTotal.rec = r?.total || 0
    }
  } catch { tabData[t] = []; tabTotal[t] = 0 }
  finally { tabLoading[t] = false }
}

watch(activeTab, () => { tabPage[activeTab.value] = 1; loadTab() })
onMounted(() => { load(); loadTab(); loadStats() })
</script>

<style scoped>
.upload-area :deep(.el-upload) { width: 100%; }
</style>
