<template>
  <div class="max-w-5xl mx-auto px-4 py-10">
    <!-- ====== 顶部横幅 ====== -->
    <div class="profile-banner h-44 md:h-52 -mx-4 -mt-10 mb-8 rounded-none md:rounded-3xl overflow-hidden relative">
      <img
        src="https://images.unsplash.com/photo-1504214208698-ea1916a2195a?w=1920&q=80"
        alt="迷雾田野"
        class="w-full h-full object-cover ken-burns"
        loading="lazy"
      />
      <div class="absolute inset-0" style="background:linear-gradient(135deg,rgba(10,92,51,0.55),rgba(14,122,68,0.3))"></div>
      <div class="absolute inset-0 flex items-center justify-center">
        <div class="text-center text-white">
          <h1 class="font-['Noto_Serif_SC'] text-4xl md:text-5xl font-bold mb-2">个人中心</h1>
          <p class="text-white/75 text-sm md:text-base font-light tracking-wide">管理您的账户信息与偏好设置</p>
        </div>
      </div>
    </div>

    <!-- ====== 用户信息区域 ====== -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <!-- 左侧：头像 & 基本信息 -->
      <div class="lg:col-span-1">
        <div class="profile-avatar-card bg-white rounded-3xl border border-[#e8e0d4] p-8 text-center hover:shadow-lg transition-all duration-400"
          style="box-shadow:0 4px 24px rgba(0,0,0,0.03)">
          <!-- 头像（带光环） -->
          <div class="relative inline-block mb-5">
            <div class="avatar-ring absolute inset-0 rounded-full"></div>
            <div class="w-28 h-28 rounded-[2rem] flex items-center justify-center mx-auto relative z-10"
              style="background:linear-gradient(135deg,var(--green-mist),var(--green-light));color:var(--green);box-shadow:0 8px 24px rgba(14,122,68,0.15)">
              <span class="text-4xl font-bold font-['Noto_Serif_SC']">{{ (auth.userInfo?.username || '?')[0] }}</span>
            </div>
            <div class="absolute -bottom-1 -right-1 w-9 h-9 rounded-full flex items-center justify-center border-[3px] border-white z-20"
              :style="{ background: roleColor, color: 'white', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }">
              <el-icon :size="16"><component :is="roleIcon" /></el-icon>
            </div>
          </div>

          <h2 class="font-['Noto_Serif_SC'] text-2xl font-bold mb-2" style="color:var(--brown)">{{ auth.userInfo?.username || '用户' }}</h2>
          <el-tag :type="tagType" size="large" effect="plain" class="mb-4" round>{{ roleLabel }}</el-tag>
          <div class="text-xs" style="color:var(--brown-faint)">ID: {{ auth.userInfo?.id || '-' }}</div>
        </div>
      </div>

      <!-- 右侧：详细信息 -->
      <div class="lg:col-span-2">
        <div class="bg-white rounded-3xl border border-[#e8e0d4] p-8 hover:shadow-lg transition-all duration-400"
          style="box-shadow:0 4px 24px rgba(0,0,0,0.03)">
          <h3 class="font-['Noto_Serif_SC'] text-lg font-bold mb-6 flex items-center gap-2" style="color:var(--brown)">
            <el-icon :size="20"><InfoFilled /></el-icon> 账户信息
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            <div class="info-item flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 hover:bg-[#FAF8F4]">
              <div class="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style="background:var(--green-mist);color:var(--green)">
                <el-icon :size="20"><Iphone /></el-icon>
              </div>
              <div>
                <span class="text-xs block mb-0.5" style="color:var(--brown-faint)">手机号</span>
                <span class="text-base font-medium" style="color:var(--brown)">{{ auth.userInfo?.phone || '-' }}</span>
              </div>
            </div>
            <div class="info-item flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 hover:bg-[#FAF8F4]">
              <div class="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style="background:var(--green-mist);color:var(--green)">
                <el-icon :size="20"><User /></el-icon>
              </div>
              <div>
                <span class="text-xs block mb-0.5" style="color:var(--brown-faint)">用户名</span>
                <span class="text-base font-medium" style="color:var(--brown)">{{ auth.userInfo?.username || '-' }}</span>
              </div>
            </div>
            <div class="info-item flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 hover:bg-[#FAF8F4]">
              <div class="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style="background:var(--green-mist);color:var(--green)">
                <el-icon :size="20"><Key /></el-icon>
              </div>
              <div>
                <span class="text-xs block mb-0.5" style="color:var(--brown-faint)">角色</span>
                <el-tag :type="tagType" size="small" round>{{ roleLabel }}</el-tag>
              </div>
            </div>
            <div class="info-item flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 hover:bg-[#FAF8F4]">
              <div class="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style="background:var(--green-mist);color:var(--green)">
                <el-icon :size="20"><Clock /></el-icon>
              </div>
              <div>
                <span class="text-xs block mb-0.5" style="color:var(--brown-faint)">注册时间</span>
                <span class="text-base font-medium" style="color:var(--brown)">{{ formatDate(auth.userInfo?.created_at) || '-' }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ====== 快捷入口 ====== -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <div class="quick-entry group bg-white rounded-2xl p-5 border border-[#e8e0d4] hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer text-center" @click="$router.push('/chat')">
        <div class="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 transition-transform duration-300 group-hover:scale-110" style="background:#E8F5E9;color:#0E7A44">
          <el-icon :size="24"><ChatDotRound /></el-icon>
        </div>
        <h4 class="font-bold text-sm mb-1" style="color:var(--brown)">智能问答</h4>
        <p class="text-xs" style="color:var(--brown-faint)">AI 农业助手</p>
      </div>
      <div class="quick-entry group bg-white rounded-2xl p-5 border border-[#e8e0d4] hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer text-center" @click="$router.push('/knowledge')">
        <div class="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 transition-transform duration-300 group-hover:scale-110" style="background:#FEF3C7;color:#D97706">
          <el-icon :size="24"><Reading /></el-icon>
        </div>
        <h4 class="font-bold text-sm mb-1" style="color:var(--brown)">知识库</h4>
        <p class="text-xs" style="color:var(--brown-faint)">农技资料</p>
      </div>
      <div class="quick-entry group bg-white rounded-2xl p-5 border border-[#e8e0d4] hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer text-center" @click="$router.push('/farm/calculate')">
        <div class="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 transition-transform duration-300 group-hover:scale-110" style="background:#E0E7FF;color:#6366F1">
          <el-icon :size="24"><TrendCharts /></el-icon>
        </div>
        <h4 class="font-bold text-sm mb-1" style="color:var(--brown)">收益计算</h4>
        <p class="text-xs" style="color:var(--brown-faint)">科学决策</p>
      </div>
      <div class="quick-entry group bg-white rounded-2xl p-5 border border-[#e8e0d4] hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer text-center" @click="$router.push('/news')">
        <div class="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 transition-transform duration-300 group-hover:scale-110" style="background:#DBEAFE;color:#3B82F6">
          <el-icon :size="24"><Notification /></el-icon>
        </div>
        <h4 class="font-bold text-sm mb-1" style="color:var(--brown)">农业资讯</h4>
        <p class="text-xs" style="color:var(--brown-faint)">最新动态</p>
      </div>
    </div>

    <!-- ====== 底部操作 ====== -->
    <div class="bg-white rounded-3xl border border-[#e8e0d4] p-6" style="box-shadow:0 4px 24px rgba(0,0,0,0.03)">
      <div class="flex items-center justify-center gap-4 flex-wrap">
        <el-button v-if="auth.isAdmin" type="primary" size="large" round @click="$router.push('/admin')">
          <el-icon><Setting /></el-icon> 管理后台
        </el-button>
        <el-button v-if="auth.canGov" size="large" round @click="$router.push('/gov')" style="background:linear-gradient(135deg,var(--gold),#D4A531);color:white;border:none">
          <el-icon><DataAnalysis /></el-icon> 政府大屏
        </el-button>
        <el-button size="large" round class="logout-btn" @click="handleLogout">
          <el-icon><SwitchButton /></el-icon> 退出登录
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ElMessage, ElMessageBox } from 'element-plus'
import { formatDate } from '@/utils/format'
import {
  InfoFilled, Iphone, User, Key, Clock,
  ChatDotRound, Reading, Notification, TrendCharts,
  Setting, DataAnalysis, SwitchButton
} from '@element-plus/icons-vue'

const auth = useAuthStore(); const router = useRouter()
const roleLabel = computed(() => ({ USER: '普通农户', ADMIN: '系统管理员', GOV: '政府人员' }[auth.role] || auth.role))
const tagType = computed(() => ({ USER: 'success', ADMIN: 'danger', GOV: 'warning' }[auth.role] || ''))
const roleColor = computed(() => ({ USER: '#0E7A44', ADMIN: '#DC2626', GOV: '#D97706' }[auth.role] || '#999'))
const roleIcon = computed(() => ({ USER: 'UserFilled', ADMIN: 'Tools', GOV: 'DataBoard' }[auth.role] || 'UserFilled'))

function handleLogout() {
  ElMessageBox.confirm('确定退出登录？', '提示', { type: 'warning', confirmButtonText: '确定', cancelButtonText: '取消' })
    .then(() => { auth.logout(); ElMessage.success('已退出'); router.push('/') }).catch(() => {})
}
</script>

<style scoped>
/* 头像光环 */
.avatar-ring {
  width: calc(100% + 16px);
  height: calc(100% + 16px);
  top: -8px;
  left: -8px;
  border-radius: 50%;
  border: 2px solid transparent;
  background: linear-gradient(135deg, var(--green-light), var(--gold), var(--green)) border-box;
  -webkit-mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  animation: ringRotate 8s linear infinite;
}
@keyframes ringRotate {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 信息条目 */
.info-item {
  cursor: default;
}
.info-item:hover {
  transform: translateX(4px);
}

/* 快捷入口 */
.quick-entry {
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 退出按钮 */
.logout-btn {
  color: #DC2626 !important;
  border-color: #FEE2E2 !important;
  background: white !important;
  transition: all 0.3s ease !important;
}
.logout-btn:hover {
  background: #FEF2F2 !important;
  border-color: #DC2626 !important;
}
</style>
