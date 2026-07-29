<template>
  <view class="login-page">
    <!-- 顶部装饰 -->
    <view class="login-header">
      <view class="header-bg" />
      <view class="logo-area">
        <view class="logo-icon">🌾</view>
        <text class="app-name">川农智伴</text>
        <text class="app-desc">多模态AI农业助手</text>
      </view>
    </view>

    <!-- 登录方式切换 -->
    <view class="tab-bar">
      <view class="tab-item" :class="{ active: tab === 'wechat' }" @tap="tab='wechat'">
        <text>微信一键登录</text>
      </view>
      <view class="tab-item" :class="{ active: tab === 'phone' }" @tap="tab='phone'">
        <text>密码登录</text>
      </view>
    </view>

    <!-- 微信一键登录 -->
    <view class="tab-content" v-show="tab === 'wechat'">
      <button class="wechat-btn" open-type="getUserInfo" @getuserinfo="handleWechatLogin">
        <text class="wechat-icon">💬</text>
        <text class="wechat-text">微信用户一键登录</text>
      </button>
      <text class="agreement">
        首次登录将自动创建账号，登录即表示同意
        <text class="link">《用户协议》</text>和<text class="link">《隐私政策》</text>
      </text>
    </view>

    <!-- 密码登录 -->
    <view class="tab-content" v-show="tab === 'phone'">
      <view class="input-group">
        <view class="input-item">
          <text class="input-label">📱</text>
          <input class="input-field" type="text" v-model="phone" placeholder="请输入手机号" maxlength="11" />
        </view>
        <view class="input-item">
          <text class="input-label">🔒</text>
          <input class="input-field" type="password" v-model="password" placeholder="请输入密码" />
        </view>
      </view>

      <button class="login-btn" :disabled="!phone || !password" @tap="handlePasswordLogin">
        <text>登录</text>
      </button>

      <view class="login-links">
        <text class="link" @tap="goRegister">没有账号？去注册</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from '@/store/auth'
import { loginSimple, wechatLogin } from '@/api/auth'
import { handleError } from '@/utils/error'

const tab = ref('wechat')
const phone = ref('')
const password = ref('')
const submitting = ref(false)
const authStore = useAuthStore()

// 微信一键登录
async function handleWechatLogin(e) {
  if (e.detail.errMsg !== 'getUserInfo:ok') return
  if (submitting.value) return
  submitting.value = true

  uni.showLoading({ title: '登录中...' })
  try {
    const loginRes = await new Promise((resolve, reject) => {
      uni.login({
        success: (res) => resolve(res),
        fail: (err) => reject(err)
      })
    })

    if (!loginRes.code) {
      uni.hideLoading()
      uni.showToast({ title: '获取授权失败', icon: 'none' })
      return
    }

    const result = await wechatLogin(loginRes.code)
    authStore.loginSuccess(result)

    uni.hideLoading()
    uni.showToast({ title: '登录成功', icon: 'success' })
    navigateAfterLogin()
  } catch (err) {
    uni.hideLoading()
    handleError(err, { fallbackMsg: '登录失败' })
  } finally {
    submitting.value = false
  }
}

// 密码登录
async function handlePasswordLogin() {
  if (submitting.value) return
  if (!phone.value || !password.value) return
  if (!/^1\d{10}$/.test(phone.value)) {
    uni.showToast({ title: '请输入正确的手机号', icon: 'none' })
    return
  }

  submitting.value = true
  uni.showLoading({ title: '登录中...' })
  try {
    const result = await loginSimple(phone.value, password.value)
    authStore.loginSuccess(result)

    uni.hideLoading()
    uni.showToast({ title: '登录成功', icon: 'success' })
    navigateAfterLogin()
  } catch (err) {
    uni.hideLoading()
    handleError(err, { fallbackMsg: '登录失败' })
  } finally {
    submitting.value = false
  }
}

function navigateAfterLogin() {
  const redirect = getApp().globalData?.redirectPage
  if (redirect) {
    getApp().globalData.redirectPage = null
    uni.switchTab({ url: redirect })
  } else {
    uni.switchTab({ url: '/pages/index/index' })
  }
}

function goRegister() {
  uni.navigateTo({ url: '/pages/register/register' })
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background: #FDF8F3;
}
.login-header {
  position: relative;
  padding: 60px 20px 40px;
  text-align: center;
  overflow: hidden;
}
.header-bg {
  position: absolute;
  top: -60px;
  left: 50%;
  transform: translateX(-50%);
  width: 500px;
  height: 500px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(232, 245, 233, 0.8) 0%, rgba(232, 245, 233, 0.2) 50%, transparent 70%);
  pointer-events: none;
}
.logo-area {
  position: relative;
  z-index: 1;
}
.logo-icon {
  font-size: 64px;
  margin-bottom: 12px;
}
.app-name {
  display: block;
  font-size: 28px;
  font-weight: 700;
  color: #1A4A2E;
  margin-bottom: 6px;
}
.app-desc {
  font-size: 14px;
  color: #8B7355;
}

/* Tab切换 */
.tab-bar {
  display: flex;
  margin: 0 20px;
  background: #F5EDE0;
  border-radius: 12px;
  padding: 3px;
}
.tab-item {
  flex: 1;
  text-align: center;
  padding: 10px 0;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  color: #8B7355;
  transition: all 0.3s;
}
.tab-item.active {
  background: #fff;
  color: #2D7A4A;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}
.tab-content {
  padding: 30px 20px;
}

/* 微信登录 */
.wechat-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 16px;
  background: linear-gradient(135deg, #2D7A4A, #1A4A2E);
  border-radius: 14px;
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  border: none;
  box-shadow: 0 4px 16px rgba(45, 122, 74, 0.3);
  margin-bottom: 20px;
}
.wechat-btn:active {
  transform: scale(0.97);
  opacity: 0.9;
}
.wechat-icon { font-size: 22px; }
.agreement {
  display: block;
  text-align: center;
  font-size: 12px;
  color: #C4A882;
  line-height: 1.6;
}
.link {
  color: #2D7A4A;
  text-decoration: underline;
}

/* 密码登录 */
.input-group {
  margin-bottom: 24px;
}
.input-item {
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 12px;
  padding: 14px 16px;
  margin-bottom: 12px;
  border: 1px solid #E8E0D4;
  box-shadow: 0 1px 4px rgba(0,0,0,0.02);
}
.input-label {
  font-size: 18px;
  margin-right: 10px;
}
.input-field {
  flex: 1;
  font-size: 15px;
  color: #2C1810;
  height: 22px;
}
.input-field::placeholder {
  color: #C4A882;
}
.login-btn {
  width: 100%;
  padding: 16px;
  background: linear-gradient(135deg, #2D7A4A, #1A4A2E);
  border-radius: 14px;
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  border: none;
  box-shadow: 0 4px 16px rgba(45, 122, 74, 0.3);
}
.login-btn[disabled] {
  opacity: 0.5;
  box-shadow: none;
}
.login-links {
  text-align: center;
  margin-top: 20px;
}
</style>
