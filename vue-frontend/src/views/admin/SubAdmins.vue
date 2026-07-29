<template>
  <div>
    <div class="flex items-center justify-between mb-5">
      <h2 class="font-['Noto_Serif_SC'] text-xl font-bold" style="color:var(--brown)">子管理员管理</h2>
      <el-button type="primary" :icon="Plus" @click="openCreate">新建管理员</el-button>
    </div>
    <div class="bg-white rounded-2xl border border-[#e8e0d4] overflow-hidden">
      <el-table :data="list" stripe v-loading="loading" empty-text="暂无子管理员">
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="phone" label="手机号" width="140" />
        <el-table-column prop="username" label="用户名" width="150" />
        <el-table-column label="角色" width="90">
          <template #default="{row}"><el-tag type="success" size="small">ADMIN</el-tag></template>
        </el-table-column>
        <el-table-column label="创建时间" min-width="150">
          <template #default="{row}">{{ row.created_at }}</template>
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
    <el-dialog v-model="dialog" title="新建子管理员" width="420px">
      <el-form :model="form" label-width="70px" ref="$f" :rules="rules">
        <el-form-item label="手机号" prop="phone"><el-input v-model="form.phone" maxlength="11" /></el-form-item>
        <el-form-item label="用户名"><el-input v-model="form.username" placeholder="选填" /></el-form-item>
        <el-form-item label="密码" prop="password"><el-input v-model="form.password" type="password" show-password /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialog=0">取消</el-button>
        <el-button type="primary" @click="handleCreate" :loading="saving">创建</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getSubAdminListPaginated, createSubAdmin, deleteSubAdmin } from '@/api/admin'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'

const list = ref([]), loading = ref(false), dialog = ref(false), saving = ref(false)
const page = ref(1), pageSize = ref(20), total = ref(0)
const form = ref({ phone: '', username: '', password: '' })
const rules = {
  phone: [{ required: true, message: '请输入手机号' }, { pattern: /^1[3-9]\d{9}$/, message: '格式不正确' }],
  password: [{ required: true, message: '请输入密码' }, { min: 6, message: '至少6位' }]
}
const $f = ref()

async function load() {
  loading.value = true
  try {
    const r = await getSubAdminListPaginated(page.value, pageSize.value)
    list.value = r?.items || []
    total.value = r?.total || 0
  } catch { list.value = [] }
  finally { loading.value = false }
}
function openCreate() {
  form.value = { phone: '', username: '', password: '' }; dialog.value = true
}
async function handleCreate() {
  if (!(await $f.value.validate().catch(() => 0))) return
  saving.value = true
  try {
    await createSubAdmin({ phone: form.value.phone, password: form.value.password, username: form.value.username || form.value.phone })
    ElMessage.success('创建成功'); dialog.value = false; load()
  } catch { ElMessage.error('创建失败') }
  finally { saving.value = false }
}
async function handleDel(id) {
  try {
    await ElMessageBox.confirm('确定删除？','提示',{type:'warning'})
    await deleteSubAdmin(id); ElMessage.success('已删除'); load()
  } catch {}
}
onMounted(load)
</script>
