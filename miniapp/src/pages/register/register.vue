<template>
  <view class="register-page">
    <NavBar title="注册" :show-back="true" />

    <view class="register-content">
      <view class="register-header">
        <text class="register-icon">🌾</text>
        <text class="register-title">创建账号</text>
      </view>

      <view class="input-group">
        <view class="input-item">
          <text class="input-label">📱</text>
          <input class="input-field" v-model="phone" type="text" placeholder="请输入手机号" maxlength="11" />
        </view>
        <view class="input-item">
          <text class="input-label">👤</text>
          <input class="input-field" v-model="username" type="text" placeholder="请输入昵称（选填）" />
        </view>
        <view class="input-item">
          <text class="input-label">🔒</text>
          <input class="input-field" v-model="password" type="password" placeholder="请输入密码（不少于6位）" />
        </view>
      </view>

      <button class="register-btn" :disabled="!phone || !password" @tap="handleRegister">
        注册
      </button>

      <view class="login-link">
        <text>已有账号？</text>
        <text class="link" @tap="goLogin">去登录</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import NavBar from '@/components/NavBar.vue'
import { register } from '@/api/auth'
import { handleError } from '@/utils/error'

const phone = ref('')
const username = ref('')
const password = ref('')
const submitting = ref(false)

async function handleRegister() {
  if (submitting.value) return
  if (!phone.value || phone.value.length !== 11) {
    uni.showToast({ title: '请输入正确的手机号', icon: 'none' })
    return
  }
  if (!password.value || password.value.length < 6) {
    uni.showToast({ title: '密码不少于6位', icon: 'none' })
    return
  }

  submitting.value = true
  uni.showLoading({ title: '注册中...' })
  try {
    await register(phone.value, password.value, username.value || undefined)
    uni.hideLoading()
    uni.showToast({ title: '注册成功', icon: 'success' })
    uni.navigateBack()
  } catch (err) {
    uni.hideLoading()
    handleError(err, { fallbackMsg: '注册失败' })
  } finally {
    submitting.value = false
  }
}

function goLogin() {
  uni.navigateBack()
}
</script>

<style scoped>
.register-page {
  min-height: 100vh;
  background: #FDF8F3;
}
.register-content {
  padding: 20px 24px;
}
.register-header {
  text-align: center;
  margin-bottom: 32px;
}
.register-icon {
  font-size: 48px;
  display: block;
  margin-bottom: 12px;
}
.register-title {
  font-size: 22px;
  font-weight: 700;
  color: #1A4A2E;
}
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
.register-btn {
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
.register-btn[disabled] {
  opacity: 0.5;
  box-shadow: none;
}
.login-link {
  text-align: center;
  margin-top: 20px;
  font-size: 14px;
  color: #8B7355;
}
.link {
  color: #2D7A4A;
  font-weight: 500;
}
</style>
