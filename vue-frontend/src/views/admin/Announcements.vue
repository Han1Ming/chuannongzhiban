<template>
  <div>
    <div class="flex items-center justify-between mb-5">
      <h2 class="font-['Noto_Serif_SC'] text-xl font-bold" style="color:var(--brown)">公告管理</h2>
      <el-button type="primary" :icon="Plus" @click="openCreate">新建公告</el-button>
    </div>
    <div class="bg-white rounded-2xl border border-[#e8e0d4] overflow-hidden">
      <el-table :data="list" stripe v-loading="loading" empty-text="暂无公告">
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="title" label="标题" min-width="200" show-overflow-tooltip />
        <el-table-column label="分类" width="80"><template #default="{row}"><el-tag :type="row.category==='warning'?'danger':''" size="small">{{ row.category==='warning'?'警告':'通知' }}</el-tag></template></el-table-column>
        <el-table-column prop="target_role" label="目标角色" width="110" />
        <el-table-column label="状态" width="80"><template #default="{row}"><el-tag :type="row.is_active?'success':'info'" size="small">{{ row.is_active?'启用':'禁用' }}</el-tag></template></el-table-column>
        <el-table-column label="创建时间" width="150"><template #default="{row}">{{ formatDate(row.created_at) }}</template></el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{row}"><el-button size="small" @click="openEdit(row)">编辑</el-button><el-button size="small" type="danger" @click="handleDel(row.id)">删除</el-button></template>
        </el-table-column>
      </el-table>
      <div class="flex justify-center py-4" v-if="total > pageSize">
        <el-pagination v-model:current-page="page" :page-size="pageSize" :total="total" layout="prev, pager, next, total" @current-change="load" />
      </div>
    </div>
    <el-dialog v-model="dialog" :title="isEdit?'编辑公告':'新建公告'" width="520px">
      <el-form :model="form" label-width="70px">
        <el-form-item label="标题"><el-input v-model="form.title" /></el-form-item>
        <el-form-item label="分类"><el-radio-group v-model="form.category"><el-radio value="notice">通知</el-radio><el-radio value="warning">警告</el-radio></el-radio-group></el-form-item>
        <el-form-item label="目标角色"><el-select v-model="form.target_role" placeholder="全部" clearable class="!w-full"><el-option label="用户" value="USER" /><el-option label="管理员" value="ADMIN" /><el-option label="政府" value="GOV" /></el-select></el-form-item>
        <el-form-item label="内容"><el-input v-model="form.content" type="textarea" :rows="4" /></el-form-item>
        <el-form-item v-if="isEdit" label="启用"><el-switch v-model="form.is_active" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="dialog=0">取消</el-button><el-button type="primary" @click="handleSave" :loading="saving">保存</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getAnnouncementListPaginated, createAnnouncement, updateAnnouncement, deleteAnnouncement } from '@/api/admin'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { formatDate } from '@/utils/format'

const list = ref([]), loading = ref(false), dialog = ref(false), saving = ref(false), isEdit = ref(false)
const currentId = ref(null)
const page = ref(1), pageSize = ref(20), total = ref(0)
const form = ref({ title:'', content:'', category:'notice', target_role:'', is_active:true })

async function load() {
  loading.value = true
  try {
    const r = await getAnnouncementListPaginated(page.value, pageSize.value)
    list.value = r?.items || []
    total.value = r?.total || 0
  } catch { list.value = [] }
  finally { loading.value = false }
}
function openCreate() { isEdit.value = false; form.value = { title:'', content:'', category:'notice', target_role:'', is_active:true }; dialog.value = true }
function openEdit(row) { isEdit.value = true; currentId.value = row.id; form.value = { title:row.title, content:row.content, category:row.category, target_role:row.target_role||'', is_active:row.is_active }; dialog.value = true }
async function handleSave() {
  if (!form.value.title||!form.value.content) return ElMessage.warning('请填写标题和内容')
  saving.value = true
  try {
    isEdit.value ? await updateAnnouncement(currentId.value, form.value) : await createAnnouncement({...form.value})
    ElMessage.success(isEdit.value?'更新成功':'创建成功'); dialog.value = false; load()
  } catch {}
  finally { saving.value = false }
}
async function handleDel(id) {
  try { await ElMessageBox.confirm('确定删除？','提示',{type:'warning'}); await deleteAnnouncement(id); ElMessage.success('已删除'); load() } catch {}
}
onMounted(load)
</script>
