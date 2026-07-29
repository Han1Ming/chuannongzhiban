<template>
  <view class="profile-page">
    <NavBar title="个人中心" />

    <scroll-view class="profile-scroll" scroll-y>
      <!-- 用户信息 -->
      <view class="user-card" @tap="goToLogin" v-if="!authStore.isLoggedIn">
        <view class="user-avatar placeholder-avatar">
          <text class="avatar-text">?</text>
        </view>
        <view class="user-info">
          <text class="user-name">点击登录</text>
          <text class="user-phone">登录后可享受完整功能</text>
        </view>
        <text class="user-arrow">›</text>
      </view>

      <view class="user-card" v-else>
        <view class="user-avatar">
          <text class="avatar-text">{{ avatarText }}</text>
        </view>
        <view class="user-info">
          <text class="user-name">{{ displayName }}</text>
          <text class="user-phone">{{ displayPhone }}</text>
        </view>
        <view class="user-badge" v-if="authStore.role">
          <text>{{ roleLabel }}</text>
        </view>
      </view>

      <!-- 功能入口 -->
      <view class="menu-section">
        <view class="menu-item" @tap="goToSessions">
          <text class="menu-icon">💬</text>
          <text class="menu-label">我的对话历史</text>
          <text class="menu-arrow">›</text>
        </view>
        <view class="menu-item" @tap="goToDiagnoses">
          <text class="menu-icon">📷</text>
          <text class="menu-label">我的诊断记录</text>
          <text class="menu-arrow">›</text>
        </view>
      </view>

      <view class="menu-section">
        <view class="menu-item" @tap="showAbout = true">
          <text class="menu-icon">ℹ️</text>
          <text class="menu-label">关于川农智伴</text>
          <text class="menu-arrow">›</text>
        </view>
      </view>

      <!-- 退出登录 -->
      <view class="logout-section" v-if="authStore.isLoggedIn">
        <button class="logout-btn" @tap="handleLogout">退出登录</button>
      </view>

      <!-- 关于弹窗 -->
      <view class="about-mask" v-if="showAbout" @tap="showAbout = false" />
      <view class="about-panel" :class="{ show: showAbout }">
        <text class="about-title">🌾 川农智伴</text>
        <text class="about-version">版本 1.0.0</text>
        <text class="about-desc">
          川农智伴是一款多模态AI农业助手，专为川南地区农业生产提供智能服务。
          支持AI智能问答、病虫害图片诊断、农技知识检索、收益计算等核心功能。
        </text>
        <button class="about-close" @tap="showAbout = false">我知道了</button>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import NavBar from '@/components/NavBar.vue'
import { useAuthStore } from '@/store/auth'
import { handleError } from '@/utils/error'

const authStore = useAuthStore()
const showAbout = ref(false)

const avatarText = computed(() => {
  if (!authStore.userInfo?.username) return '🌾'
  return authStore.userInfo.username.charAt(0)
})

const displayName = computed(() => {
  return authStore.userInfo?.username || '农户'
})

const displayPhone = computed(() => {
  const phone = authStore.userInfo?.phone
  if (phone) return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
  return '未绑定手机号'
})

const roleLabel = computed(() => {
  const roleMap = { USER: '🌾 农户', ADMIN: '⚙️ 管理员', GOV: '🏛️ 政府' }
  return roleMap[authStore.role] || '🌾 农户'
})

function goToLogin() {
  uni.navigateTo({ url: '/pages/login/login' })
}

function goToSessions() {
  uni.navigateTo({ url: '/pages/chat/session-list' })
}

function goToDiagnoses() {
  uni.showToast({ title: '功能开发中', icon: 'none' })
}

function handleLogout() {
  uni.showModal({
    title: '确认退出',
    content: '退出后需要重新登录',
    success: (res) => {
      if (res.confirm) {
        authStore.logout()
        uni.showToast({ title: '已退出', icon: 'success' })
      }
    }
  })
}
</script>

<style scoped>
.profile-page {
  min-height: 100vh;
  background: #FDF8F3;
}
.profile-scroll {
  padding: 0 16px;
  height: calc(100vh - 50px);
}

/* 用户卡片 */
.user-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 20px;
  background: linear-gradient(135deg, #E8F5E9, #C8E6C9);
  border-radius: 16px;
  margin: 12px 0 20px;
  box-shadow: 0 4px 16px rgba(26, 74, 46, 0.08);
}
.user-avatar {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}
.placeholder-avatar {
  background: #F5EDE0;
}
.avatar-text {
  font-size: 24px;
  color: #1A4A2E;
}
.user-info {
  flex: 1;
}
.user-name {
  display: block;
  font-size: 17px;
  font-weight: 700;
  color: #1A4A2E;
}
.user-phone {
  display: block;
  font-size: 13px;
  color: #5C4033;
  margin-top: 2px;
}
.user-arrow {
  font-size: 24px;
  color: #2D7A4A;
}
.user-badge {
  padding: 4px 12px;
  background: rgba(255,255,255,0.6);
  border-radius: 20px;
  font-size: 12px;
  color: #1A4A2E;
}

/* 菜单 */
.menu-section {
  background: #fff;
  border-radius: 14px;
  margin-bottom: 12px;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0,0,0,0.02);
}
.menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border-bottom: 1px solid #F5EDE0;
}
.menu-item:last-child {
  border-bottom: none;
}
.menu-item:active {
  background: #F8F6F2;
}
.menu-icon {
  font-size: 20px;
  width: 28px;
  text-align: center;
}
.menu-label {
  flex: 1;
  font-size: 14px;
  color: #2C1810;
}
.menu-arrow {
  font-size: 18px;
  color: #C4A882;
}

/* 退出 */
.logout-section {
  margin-top: 30px;
  padding-bottom: 40px;
}
.logout-btn {
  width: 100%;
  padding: 14px;
  background: transparent;
  border: 1px solid #DC2626;
  border-radius: 12px;
  color: #DC2626;
  font-size: 15px;
  font-weight: 500;
  text-align: center;
}
.logout-btn:active {
  background: #FEF2F2;
}

/* 关于弹窗 */
.about-mask {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.4);
  z-index: 200;
}
.about-panel {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  border-radius: 20px 20px 0 0;
  padding: 30px 24px;
  z-index: 201;
  transform: translateY(100%);
  transition: transform 0.3s ease;
}
.about-panel.show {
  transform: translateY(0);
}
.about-title {
  display: block;
  font-size: 22px;
  font-weight: 700;
  color: #1A4A2E;
  text-align: center;
  margin-bottom: 6px;
}
.about-version {
  display: block;
  text-align: center;
  font-size: 13px;
  color: #C4A882;
  margin-bottom: 20px;
}
.about-desc {
  display: block;
  font-size: 14px;
  color: #5C4033;
  line-height: 1.7;
  text-align: center;
  margin-bottom: 24px;
}
.about-close {
  width: 100%;
  padding: 14px;
  background: #E8F5E9;
  border: none;
  border-radius: 12px;
  color: #2D7A4A;
  font-size: 15px;
  font-weight: 600;
  text-align: center;
}
</style>
