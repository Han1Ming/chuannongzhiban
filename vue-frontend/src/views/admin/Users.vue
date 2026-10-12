<template>
  <div>
    <h2 class="font-['Noto_Serif_SC'] text-xl font-bold mb-5 flex items-center gap-2" style="color:var(--brown)">
      用户管理
    </h2>

    <!-- 搜索栏 -->
    <div class="flex items-center gap-3 mb-5 flex-wrap">
      <el-input
        v-model="keyword"
        placeholder="搜索手机号或用户名…"
        clearable
        style="max-width:320px"
        class="admin-search"
        @keyup.enter="page=1;load()"
        @clear="page=1;load()"
      />
      <el-select
        v-model="roleFilter"
        placeholder="全部角色"
        clearable
        style="width:150px"
        class="admin-search"
        @change="page=1;load()"
      >
        <el-option v-for="r in ROLE_OPTIONS" :key="r.value" :label="r.label" :value="r.value" />
      </el-select>
      <el-button type="primary" :icon="Search" @click="page=1;load()" class="!rounded-xl">搜索</el-button>
      <span class="text-xs" style="color:var(--brown-faint)">共 {{ total }} 人</span>
    </div>

    <!-- 用户表格 -->
    <div class="bg-white rounded-2xl border border-[#e8e0d4] overflow-hidden" style="box-shadow:0 2px 12px rgba(0,0,0,0.02)">
      <el-table :data="users" stripe v-loading="loading" empty-text="暂无用户" class="admin-table">
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="phone" label="手机号" width="140" />
        <el-table-column prop="username" label="用户名" width="140" />
        <el-table-column prop="role" label="角色" width="120">
          <template #default="{ row }">
            <!-- role 由后端返回；缺失时兜底为 USER，避免出现空白单元格 -->
            <el-tag :type="roleMeta(row.role).type" size="small" round effect="light">
              {{ roleMeta(row.role).label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="注册时间" min-width="150">
          <template #default="{ row }">{{ formatDate(row.created_at) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="300" fixed="right">
          <template #default="{ row }">
            <el-button size="small" class="!rounded-lg" @click.stop="openEdit(row)">编辑</el-button>
            <el-button size="small" class="!rounded-lg" @click.stop="handleChatRecord(row)">
              <span class="mr-1">💬</span> 聊天记录
            </el-button>
            <el-button v-if="row.role !== 'ADMIN'" size="small" type="danger" class="!rounded-lg" @click.stop="handleDel(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="flex justify-center py-5 border-t border-[#f0ece4]" v-if="total > pageSize">
        <el-pagination
          v-model:current-page="page"
          :page-size="pageSize"
          :total="total"
          layout="prev, pager, next, total"
          @current-change="load"
        />
      </div>
    </div>

    <!-- 编辑用户弹窗 -->
    <el-dialog v-model="dialog" title="编辑用户" width="440px" class="admin-dialog">
      <el-form :model="edit" label-width="80px">
        <el-form-item label="手机号">
          <el-input v-model="edit.phone" class="!rounded-xl" />
        </el-form-item>
        <el-form-item label="用户名">
          <el-input v-model="edit.username" class="!rounded-xl" />
        </el-form-item>
        <el-form-item label="所在地">
          <el-input
            v-model="edit.location"
            class="!rounded-xl"
            placeholder="如：宜宾市"
            maxlength="50"
          />
          <div class="text-xs mt-1" style="color:var(--brown-faint)">
            用于天气查询与处方地区适配；留空则相关功能会提示补全
          </div>
        </el-form-item>
        <el-form-item label="重置密码">
          <el-switch v-model="edit.reset_password" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialog = false" class="!rounded-xl">取消</el-button>
        <el-button type="primary" @click="handleSave" :loading="saving" class="!rounded-xl">保存</el-button>
      </template>
    </el-dialog>

    <!-- 聊天记录弹窗 -->
    <el-dialog v-model="chatDialog" :title="`💬 聊天记录 - ${chatUserPhone}`" width="760px" top="5vh" class="admin-dialog">
      <div v-if="chatLoading" class="text-center py-12">
        <div class="w-8 h-8 border-2 border-[var(--green)] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <span class="text-sm" style="color:var(--brown-faint)">加载中…</span>
      </div>
      <div v-else-if="chatError" class="text-center py-12">
        <span class="text-sm" style="color:var(--error)">{{ chatError }}</span>
      </div>
      <div v-else class="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
        <div v-for="s in chatSessions" :key="s.id" class="p-4 rounded-2xl transition-colors" style="background:#FAF8F4;border:1px solid #f0ece4">
          <div class="flex items-center justify-between mb-3 pb-2 border-b border-[#f0ece4]">
            <span class="font-bold text-sm" style="color:var(--brown)">{{ s.title || '未命名会话' }}</span>
            <div class="flex items-center gap-2">
              <span v-if="s.is_deleted" class="text-xs px-2 py-0.5 rounded-full" style="background:#FEE2E2;color:#DC2626">已删除</span>
              <span class="text-xs" style="color:#bbb">{{ s.created_at }}</span>
            </div>
          </div>
          <div v-for="m in s.messages" :key="m.id" class="flex gap-3 mb-2 text-sm items-start">
            <span class="shrink-0 text-base mt-0.5">{{ m.role === 'user' ? '👤' : '🤖' }}</span>
            <span class="leading-relaxed" style="color:var(--brown)">{{ m.content }}</span>
          </div>
        </div>
        <div v-if="!chatSessions.length" class="text-center py-12 text-sm" style="color:#ccc">该用户暂无聊天记录</div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getAdminUserListPaginated, updateAdminUser, deleteAdminUser, getUserChatData } from '@/api/admin'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { formatDate } from '@/utils/format'

const users = ref([]); const loading = ref(false); const dialog = ref(false); const saving = ref(false)
const edit = ref({ phone: '', username: '', reset_password: false })
const currentId = ref(null)
const page = ref(1); const pageSize = ref(20); const total = ref(0); const keyword = ref('')
const roleFilter = ref('')

// 角色展示口径：后端存的是 USER / ADMIN / GOV，直接显示英文代码对管理员不友好
const ROLE_OPTIONS = [
  { value: 'USER', label: '普通用户' },
  { value: 'GOV', label: '政府人员' },
  { value: 'ADMIN', label: '管理员' }
]
const ROLE_META = {
  ADMIN: { label: '管理员', type: 'danger' },
  GOV: { label: '政府人员', type: 'warning' },
  USER: { label: '普通用户', type: 'success' }
}
function roleMeta(role) {
  return ROLE_META[(role || 'USER').toUpperCase()] || { label: role || '未知', type: 'info' }
}

const chatDialog = ref(false); const chatLoading = ref(false); const chatError = ref('')
const chatSessions = ref([]); const chatUserPhone = ref('')

async function load() {
  loading.value = true
  try {
    const r = await getAdminUserListPaginated(page.value, pageSize.value, keyword.value, roleFilter.value)
    users.value = r?.items || []
    total.value = r?.total || 0
  } catch { users.value = [] }
  finally { loading.value = false }
}
function openEdit(row) {
  currentId.value = row.id
  // 带上所在地：它是天气查询与地区适配的依据，管理员需要能补全
  edit.value = {
    phone: row.phone,
    username: row.username,
    location: row.location || '',
    reset_password: false
  }
  dialog.value = true
}
async function handleSave() {
  saving.value = true
  try { await updateAdminUser(currentId.value, edit.value); ElMessage.success('更新成功'); dialog.value = false; load() } catch { /* handled by interceptor */ }
  finally { saving.value = false }
}
async function handleDel(id) {
  try {
    await ElMessageBox.confirm('确定删除该用户？此操作不可恢复。', '删除确认', {
      type: 'warning',
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      confirmButtonClass: '!rounded-xl',
      cancelButtonClass: '!rounded-xl'
    })
    await deleteAdminUser(id); ElMessage.success('已删除'); load()
  } catch { /* cancelled */ }
}
async function handleChatRecord(row) {
  chatSessions.value = []; chatError.value = ''; chatDialog.value = true; chatLoading.value = true
  chatUserPhone.value = row.phone
  try {
    const r = await getUserChatData(row.id)
    if (r?.sessions) chatSessions.value = r.sessions
    else chatError.value = '暂无数据'
  } catch (e) {
    chatError.value = e.message || '加载失败'
  } finally { chatLoading.value = false }
}
onMounted(load)
</script>

<style scoped>
.admin-table :deep(.el-table__row) {
  transition: background-color 0.15s ease;
}
.admin-table :deep(.el-table__row:hover > td) {
  background-color: #FAF8F4 !important;
}
.admin-search :deep(.el-input__wrapper) {
  border-radius: 14px;
}
</style>
