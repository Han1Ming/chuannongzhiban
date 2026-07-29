<template>
  <div class="flex" style="min-height:100vh;background:#F5F0EB">
    <!-- ====== 侧边栏 ====== -->
    <aside class="admin-sidebar" style="width:240px;background:linear-gradient(180deg,#1A4A2E 0%,#0D2B18 100%);flex-shrink:0">
      <!-- Logo -->
      <div class="p-5 border-b border-white/8">
        <router-link to="/admin" class="flex items-center gap-3 no-underline">
          <div class="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold font-[Georgia]"
            style="background:linear-gradient(135deg,rgba(255,255,255,0.15),rgba(255,255,255,0.05))">
            川
          </div>
          <div>
            <span class="text-white font-bold font-['Noto_Serif_SC'] text-sm block leading-tight">管理后台</span>
            <span class="text-[10px] opacity-40 text-white font-mono tracking-widest">ADMIN</span>
          </div>
        </router-link>
      </div>

      <!-- 导航菜单 -->
      <nav class="p-3 space-y-0.5">
        <router-link to="/admin" class="admin-nav-item" exact-active-class="admin-nav-active">
          <el-icon :size="17"><DataAnalysis /></el-icon><span>仪表盘</span>
        </router-link>
        <router-link to="/admin/users" class="admin-nav-item" active-class="admin-nav-active">
          <el-icon :size="17"><User /></el-icon><span>用户管理</span>
        </router-link>
        <router-link to="/admin/sub-admins" class="admin-nav-item" active-class="admin-nav-active">
          <el-icon :size="17"><Avatar /></el-icon><span>子管理员</span>
        </router-link>
        <router-link to="/admin/news" class="admin-nav-item" active-class="admin-nav-active">
          <el-icon :size="17"><Reading /></el-icon><span>新闻管理</span>
        </router-link>
        <router-link to="/admin/knowledge" class="admin-nav-item" active-class="admin-nav-active">
          <el-icon :size="17"><Document /></el-icon><span>知识库管理</span>
        </router-link>
        <router-link to="/admin/announcements" class="admin-nav-item" active-class="admin-nav-active">
          <el-icon :size="17"><Bell /></el-icon><span>公告管理</span>
        </router-link>

        <div class="h-px bg-white/6 my-2 mx-2"></div>

        <router-link to="/" class="admin-nav-item">
          <el-icon :size="17"><HomeFilled /></el-icon><span>回到前台</span>
        </router-link>
      </nav>

      <!-- 底部版本 -->
      <div class="mt-auto p-4 text-center">
        <span class="text-[10px] opacity-25 text-white font-mono">川农智伴 v1.0</span>
      </div>
    </aside>

    <!-- ====== 主区域 ====== -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- 顶部标题栏 -->
      <header class="admin-header h-14 bg-white border-b border-[#e8e0d4] flex items-center justify-between px-6 shrink-0">
        <div class="flex items-center gap-3">
          <div class="w-1 h-5 rounded-full" style="background:var(--green)"></div>
          <h2 class="font-['Noto_Serif_SC'] text-base font-bold" style="color:var(--green-deep)">{{ $route.meta.title || '管理后台' }}</h2>
        </div>
        <div class="flex items-center gap-3">
          <span class="text-xs" style="color:var(--brown-faint)">管理员</span>
          <div class="w-7 h-7 rounded-lg flex items-center justify-center text-xs" style="background:var(--green-mist);color:var(--green);font-weight:700">
            {{ (auth.userInfo?.username || 'A')[0] }}
          </div>
        </div>
      </header>

      <!-- 内容区 -->
      <div class="flex-1 overflow-y-auto p-6">
        <router-view />
      </div>
    </div>
  </div>
</template>

<script setup>
import { useAuthStore } from '@/stores/auth'
const auth = useAuthStore()
</script>

<style scoped>
/* 导航项 */
.admin-nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 16px;
  border-radius: 10px;
  font-size: 13.5px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.55);
  text-decoration: none;
  transition: all 0.2s ease;
  border-left: 3px solid transparent;
  margin-bottom: 1px;
}
.admin-nav-item:hover {
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.85);
  padding-left: 20px;
}
.admin-nav-active {
  background: rgba(255, 255, 255, 0.1) !important;
  color: #fff !important;
  border-left-color: var(--green-light) !important;
  font-weight: 600;
}
</style>
