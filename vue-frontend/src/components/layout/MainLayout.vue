<template>
  <div class="min-h-screen flex flex-col" style="background:var(--cream)">
    <!-- ====== 固定顶栏 ====== -->
    <header
      ref="$header"
      class="fixed top-0 left-0 right-0 z-50 transition-shadow duration-300"
      :class="{ 'header-scrolled': scrolled }"
      style="background:rgba(255,255,255,0.82);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-bottom:1px solid rgba(232,224,212,0.5)"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[68px] flex items-center justify-between">
        <!-- Logo -->
        <router-link to="/" class="flex items-center gap-3 no-underline logo-group">
          <div class="w-11 h-11 rounded-xl flex items-center justify-center text-lg logo-box"
            style="background:linear-gradient(135deg,var(--green-deep),var(--green),var(--green-light))">
            <span class="text-white font-bold font-[Georgia]">川</span>
          </div>
          <span class="text-xl font-bold font-['Noto_Serif_SC'] tracking-wide" style="color:var(--green-deep)">川农智伴</span>
        </router-link>

        <!-- 桌面导航 -->
        <nav class="hidden md:flex items-center gap-0.5">
          <router-link to="/" class="nav-link" exact-active-class="nav-active">
            <span>首页</span>
            <span class="nav-active-icon">🌱</span>
          </router-link>
          <router-link to="/chat" class="nav-link" active-class="nav-active">智能问答</router-link>
          <router-link to="/news" class="nav-link" active-class="nav-active">农业新闻</router-link>
          <router-link to="/knowledge" class="nav-link" active-class="nav-active">知识库</router-link>
          <router-link to="/knowledge-graph" class="nav-link" active-class="nav-active">🌾 知识图谱</router-link>
          <router-link to="/farm/calculate" class="nav-link" active-class="nav-active">农事工具</router-link>
          <router-link v-if="auth.isAdmin" to="/admin" class="nav-link" active-class="nav-active">管理后台</router-link>
        </nav>

        <!-- 右侧用户区 -->
        <div class="flex items-center gap-3">
          <template v-if="auth.isLoggedIn">
            <span class="hidden sm:block text-sm font-medium" style="color:var(--brown-soft)">{{ auth.userInfo?.username || '用户' }}</span>

            <!-- 汉堡菜单按钮（桌面+移动端通用） -->
            <div class="relative">
              <button class="p-2 rounded-lg hamburger-btn" style="color:var(--brown-soft)" @click="toggleMenu">
                <div class="hamburger-lines" :class="{ 'hamburger-open': menuOpen }">
                  <span></span><span></span><span></span>
                </div>
              </button>

              <!-- 弹出菜单 -->
              <transition name="menu-drop">
                <div v-if="menuOpen" class="menu-dropdown absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-[#e8e0d4] overflow-hidden z-50"
                  style="box-shadow:0 8px 32px rgba(0,0,0,0.1)">
                  <!-- 移动端：导航链接 -->
                  <div class="md:hidden border-b border-[#f0ece4]">
                    <router-link to="/" class="menu-item" @click="menuOpen = false" exact-active-class="!text-[var(--green)] !bg-[#E8F5E9]">🏠 首页</router-link>
                    <router-link to="/chat" class="menu-item" @click="menuOpen = false" active-class="!text-[var(--green)] !bg-[#E8F5E9]">💬 智能问答</router-link>
                    <router-link to="/news" class="menu-item" @click="menuOpen = false" active-class="!text-[var(--green)] !bg-[#E8F5E9]">📰 农业新闻</router-link>
                    <router-link to="/knowledge" class="menu-item" @click="menuOpen = false" active-class="!text-[var(--green)] !bg-[#E8F5E9]">📚 知识库</router-link>
                    <router-link to="/knowledge-graph" class="menu-item" @click="menuOpen = false" active-class="!text-[var(--green)] !bg-[#E8F5E9]">🌾 知识图谱</router-link>
                    <router-link to="/farm/calculate" class="menu-item" @click="menuOpen = false" active-class="!text-[var(--green)] !bg-[#E8F5E9]">🧮 收益计算</router-link>
                    <router-link to="/farm/match" class="menu-item" @click="menuOpen = false" active-class="!text-[var(--green)] !bg-[#E8F5E9]">🌱 智能匹配</router-link>
                    <router-link v-if="auth.isAdmin" to="/admin" class="menu-item" @click="menuOpen = false" active-class="!text-[var(--green)] !bg-[#E8F5E9]">⚙️ 管理后台</router-link>
                  </div>
                  <!-- 用户菜单 -->
                  <router-link to="/profile" class="menu-item" @click="menuOpen = false">👤 个人中心</router-link>
                  <router-link v-if="auth.isAdmin" to="/admin" class="menu-item hidden md:flex" @click="menuOpen = false">⚙️ 管理后台</router-link>
                  <router-link v-if="auth.canGov" to="/gov" class="menu-item" @click="menuOpen = false">📊 政府大屏</router-link>
                  <div class="border-t border-[#f0ece4]">
                    <button class="menu-item w-full text-left text-red-500 hover:bg-red-50" @click="menuOpen = false; handleLogout()">🚪 退出登录</button>
                  </div>
                </div>
              </transition>

              <!-- 点击遮罩 -->
              <div v-if="menuOpen" class="fixed inset-0 z-40" @click="menuOpen = false"></div>
            </div>
          </template>
          <template v-else>
            <router-link to="/login" class="text-sm font-medium no-underline nav-login-link" style="color:var(--brown-soft)">登录</router-link>
            <router-link to="/register" class="px-5 py-2 text-sm font-medium rounded-xl text-white no-underline nav-register-btn" style="background:var(--green)">注册</router-link>
          </template>
        </div>
      </div>

    </header>

    <!-- 顶栏占位 -->
    <div class="h-[68px] shrink-0"></div>

    <!-- 主内容区 -->
    <main class="flex-1 flex flex-col min-h-0">
      <router-view v-slot="{ Component }">
        <transition name="page" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <!-- ====== Footer ====== -->
    <footer class="relative" style="background:var(--green-deep)">
      <!-- 金色装饰线 -->
      <div class="footer-gold-line"></div>

      <!-- 背景纹理 -->
      <div class="absolute inset-0 opacity-[0.03] pointer-events-none" style="background-image:repeating-linear-gradient(45deg,transparent,transparent 8px,rgba(255,255,255,0.5) 8px,rgba(255,255,255,0.5) 9px)"></div>

      <div class="max-w-7xl mx-auto px-4 py-14 sm:px-6 lg:px-8 relative z-10">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-10">
          <!-- 品牌 -->
          <div>
            <div class="flex items-center gap-3 mb-4">
              <div class="w-10 h-10 rounded-xl flex items-center justify-center text-base"
                style="background:linear-gradient(135deg,rgba(255,255,255,0.15),rgba(255,255,255,0.05))">
                <span class="text-white font-bold font-[Georgia]">川</span>
              </div>
              <h3 class="font-['Noto_Serif_SC'] text-white text-lg font-bold">川农智伴</h3>
            </div>
            <p class="leading-relaxed text-white/55 text-sm">
              多模态AI农业智能体平台<br/>科技赋能川南农业现代化
            </p>
          </div>

          <!-- 功能链接 -->
          <div>
            <h3 class="font-['Noto_Serif_SC'] text-white text-base font-bold mb-4">快捷功能</h3>
            <div class="space-y-1.5">
              <router-link to="/chat" class="footer-link">智能问答</router-link>
              <router-link to="/news" class="footer-link">农业新闻</router-link>
              <router-link to="/knowledge" class="footer-link">农技知识库</router-link>
              <router-link to="/knowledge-graph" class="footer-link">知识图谱</router-link>
              <router-link to="/farm/calculate" class="footer-link">收益计算</router-link>
              <router-link to="/farm/match" class="footer-link">智能种植匹配</router-link>
            </div>
          </div>

          <!-- 关于 & 社交媒体 -->
          <div>
            <h3 class="font-['Noto_Serif_SC'] text-white text-base font-bold mb-4">关于我们</h3>
            <p class="text-white/55 text-sm leading-relaxed mb-5">
              致力于为川南地区提供<br/>AI驱动的智慧农业服务
            </p>
            <!-- 社交媒体占位 -->
            <div class="flex items-center gap-3">
              <a href="#" class="social-icon-placeholder" title="微信公众号">
                <span class="text-sm">💬</span>
              </a>
              <a href="#" class="social-icon-placeholder" title="微博">
                <span class="text-sm">📢</span>
              </a>
              <a href="#" class="social-icon-placeholder" title="邮箱">
                <span class="text-sm">📧</span>
              </a>
              <a href="#" class="social-icon-placeholder" title="GitHub">
                <span class="text-sm">💻</span>
              </a>
            </div>
          </div>
        </div>

        <!-- 版权 -->
        <div class="border-t border-white/8 mt-10 pt-7 text-center text-xs text-white/35">
          &copy; {{ new Date().getFullYear() }} 川农智伴 — 版权所有 · 川南AI农业智能体平台
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useChatStore } from '@/stores/chat'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

const auth = useAuthStore()
const chatStore = useChatStore()
const router = useRouter()
const menuOpen = ref(false)
const scrolled = ref(false)
const $header = ref(null)

function toggleMenu() {
  menuOpen.value = !menuOpen.value
}

function handleLogout() {
  auth.logout()
  chatStore.clearAll()
  ElMessage.success('已退出')
  router.push('/')
}

// ===== 滚动阴影检测 =====
function onScroll() {
  scrolled.value = window.scrollY > 60
}

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
})
</script>

<style scoped>
/* ===== 顶栏 ===== */
.header-scrolled {
  box-shadow: 0 4px 24px rgba(26, 74, 46, 0.08), 0 1px 3px rgba(0, 0, 0, 0.04);
}
.header-scrolled::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 5%;
  right: 5%;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(232, 184, 75, 0.4), transparent);
}

/* ===== Logo ===== */
.logo-box {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 12px rgba(26, 74, 46, 0.2);
}
.logo-group:hover .logo-box {
  transform: scale(1.08);
  box-shadow: 0 6px 20px rgba(26, 74, 46, 0.3);
}

/* ===== 导航链接 ===== */
.nav-link {
  position: relative;
  padding: 10px 16px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  color: var(--brown-soft);
  text-decoration: none;
  transition: all 0.25s ease;
}
.nav-link:hover {
  color: var(--green-deep);
  background: rgba(245, 237, 224, 0.5);
}
.nav-link::after {
  content: '';
  position: absolute;
  bottom: 4px;
  left: 25%;
  right: 25%;
  height: 2.5px;
  background: linear-gradient(90deg, var(--green), var(--green-light));
  border-radius: 2px;
  transform: scaleX(0);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.nav-link:hover::after,
.nav-active::after {
  transform: scaleX(1);
}
.nav-active {
  color: var(--green-deep) !important;
}

/* 活跃指示器叶子图标 */
.nav-active-icon {
  position: absolute;
  top: -6px;
  right: 6px;
  font-size: 10px;
  opacity: 0;
  transform: translateY(-4px);
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.nav-active .nav-active-icon {
  opacity: 1;
  transform: translateY(0);
}

/* ===== 登录/注册链接 ===== */
.nav-login-link:hover {
  color: var(--green) !important;
}
.nav-register-btn {
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(45, 122, 74, 0.2);
}
.nav-register-btn:hover {
  background: var(--green-deep) !important;
  box-shadow: 0 4px 16px rgba(45, 122, 74, 0.35);
  transform: translateY(-1px);
}

/* ===== 汉堡菜单按钮 ===== */
.hamburger-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 10px;
  transition: background 0.2s;
}
.hamburger-btn:hover {
  background: rgba(245, 237, 224, 0.5);
}
.hamburger-lines {
  width: 20px;
  height: 14px;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.hamburger-lines span {
  display: block;
  width: 100%;
  height: 2px;
  background: var(--brown-soft);
  border-radius: 2px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  transform-origin: center;
}
.hamburger-open span:nth-child(1) {
  transform: translateY(6px) rotate(45deg);
}
.hamburger-open span:nth-child(2) {
  opacity: 0;
  transform: scaleX(0);
}
.hamburger-open span:nth-child(3) {
  transform: translateY(-6px) rotate(-45deg);
}

/* ===== 弹出菜单 ===== */
.menu-dropdown {
  min-width: 180px;
}
.menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  font-size: 14px;
  color: var(--brown);
  text-decoration: none;
  transition: background 0.15s;
  cursor: pointer;
  border: none;
  background: transparent;
}
.menu-item:hover {
  background: #F5EDE0;
}

/* 菜单动画 */
.menu-drop-enter-active {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
.menu-drop-leave-active {
  transition: all 0.15s ease-in;
}
.menu-drop-enter-from {
  opacity: 0;
  transform: translateY(-8px) scale(0.96);
}
.menu-drop-leave-to {
  opacity: 0;
  transform: translateY(-4px) scale(0.98);
}

/* ===== Footer ===== */
/* 金色装饰线 */
.footer-gold-line {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent 0%, var(--gold) 30%, var(--gold) 70%, transparent 100%);
  opacity: 0.7;
}

/* Footer 链接 */
.footer-link {
  display: flex;
  align-items: center;
  gap: 0;
  color: rgba(255, 255, 255, 0.5);
  text-decoration: none;
  font-size: 14px;
  padding: 6px 0;
  transition: all 0.25s ease;
}
.footer-link::after {
  content: '→';
  opacity: 0;
  transform: translateX(-6px);
  transition: all 0.25s ease;
  font-size: 13px;
  color: var(--gold);
}
.footer-link:hover {
  color: rgba(255, 255, 255, 0.85);
  padding-left: 4px;
}
.footer-link:hover::after {
  opacity: 1;
  transform: translateX(2px);
}

/* 社交媒体占位 */
.social-icon-placeholder {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.1);
  text-decoration: none;
  transition: all 0.3s ease;
}
.social-icon-placeholder:hover {
  background: rgba(255, 255, 255, 0.16);
  border-color: rgba(255, 255, 255, 0.25);
  transform: translateY(-3px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}
</style>
