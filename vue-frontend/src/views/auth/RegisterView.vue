<template>
  <div class="flex min-h-screen">
    <!-- ====== 左侧品牌区（与登录页统一） ====== -->
    <div class="hidden lg:flex flex-1 items-center justify-center relative overflow-hidden">
      <div class="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1492496913980-501348b61469?w=1920&q=80"
          alt="茶园"
          class="w-full h-full object-cover ken-burns"
        />
        <div class="absolute inset-0" style="background:linear-gradient(135deg,rgba(10,92,51,0.65),rgba(22,40,55,0.35),rgba(10,92,51,0.55))"></div>
      </div>
      <div class="absolute top-1/4 right-1/4 w-64 h-64 rounded-full bg-[#E8B84B]/10 blur-[90px] floating" style="animation-duration:8s"></div>
      <div class="absolute bottom-1/3 left-1/4 w-56 h-56 rounded-full bg-[#2E9D63]/8 blur-[70px] floating-delay"></div>

      <div class="relative z-10 text-center text-white px-12 brand-content">
        <div class="mb-10 inline-flex items-center justify-center w-28 h-28 rounded-3xl bg-white/12 backdrop-blur-md border border-white/15 logo-breathe">
          <span class="text-6xl font-bold font-[Georgia]">川</span>
        </div>
        <h1 class="text-5xl font-['Noto_Serif_SC'] font-bold mb-3 tracking-[0.15em]">川农智伴</h1>
        <p class="text-lg opacity-75 mb-14 tracking-wide">加入我们，开启智慧农业之旅</p>
        <div class="text-left inline-flex flex-col gap-5">
          <div class="flex items-center gap-4 text-sm feature-item" style="animation-delay:0.1s">
            <div class="w-10 h-10 rounded-xl bg-white/8 flex items-center justify-center shrink-0">🌱</div>
            <span class="opacity-85">免费注册，即刻使用</span>
          </div>
          <div class="flex items-center gap-4 text-sm feature-item" style="animation-delay:0.25s">
            <div class="w-10 h-10 rounded-xl bg-white/8 flex items-center justify-center shrink-0">🤖</div>
            <span class="opacity-85">AI多模态智能服务</span>
          </div>
          <div class="flex items-center gap-4 text-sm feature-item" style="animation-delay:0.4s">
            <div class="w-10 h-10 rounded-xl bg-white/8 flex items-center justify-center shrink-0">📊</div>
            <span class="opacity-85">数据驱动的种植决策</span>
          </div>
        </div>
        <p class="mt-16 text-xs opacity-35 tracking-[0.2em]">科技赋能农业现代化</p>
      </div>
    </div>

    <!-- ====== 右侧表单 ====== -->
    <div class="flex-1 flex items-center justify-center p-8" style="background:linear-gradient(135deg,var(--cream),#F9F5EF)">
      <!-- 成功动画 -->
      <div v-if="regSuccess" class="success-card w-full max-w-[440px] text-center p-12 rounded-[2rem] bg-white"
        style="box-shadow:0 4px 6px rgba(0,0,0,0.02),0 10px 30px rgba(0,0,0,0.04),0 20px 60px rgba(10,92,51,0.04)">
        <div class="success-check mb-6">
          <div class="w-20 h-20 rounded-full flex items-center justify-center mx-auto" style="background:var(--green-mist)">
            <span class="text-4xl">✅</span>
          </div>
        </div>
        <h2 class="text-2xl font-['Noto_Serif_SC'] font-bold mb-2" style="color:var(--green-deep)">注册成功！</h2>
        <p class="text-sm mb-6" style="color:var(--brown-faint)">{{ countdown }} 秒后自动跳转至登录页…</p>
        <el-button type="primary" class="!rounded-xl !h-11" @click="router.push('/login')">立即登录</el-button>
      </div>

      <!-- 注册表单 -->
      <div v-else class="w-full max-w-[440px] form-card rounded-[2rem] p-10 bg-white"
        style="box-shadow:0 4px 6px rgba(0,0,0,0.02),0 10px 30px rgba(0,0,0,0.04),0 20px 60px rgba(10,92,51,0.04)">
        <div class="text-center mb-8">
          <h2 class="text-2xl font-['Noto_Serif_SC'] font-bold mb-2" style="color:var(--brown)">创建账号</h2>
          <div class="title-underline"></div>
          <p class="text-sm mt-3" style="color:var(--brown-faint)">注册川农智伴，免费使用AI农业服务</p>
        </div>

        <el-form ref="$f" :model="form" :rules="rules" size="large" @submit.prevent="handleRegister">
          <el-form-item prop="phone">
            <el-input v-model="form.phone" placeholder="手机号" maxlength="11" :prefix-icon="Phone" class="custom-input" />
          </el-form-item>
          <el-form-item prop="username">
            <el-input v-model="form.username" placeholder="用户名（选填）" :prefix-icon="User" class="custom-input" />
          </el-form-item>
          <el-form-item prop="password">
            <el-input v-model="form.password" type="password" placeholder="密码（至少6位）" show-password :prefix-icon="Lock" class="custom-input" @input="checkPwdStrength" />
          </el-form-item>
          <!-- 密码强度指示条 -->
          <div v-if="form.password" class="pwd-strength -mt-4 mb-4 px-1">
            <div class="flex gap-1.5 mb-1">
              <div v-for="i in 3" :key="i" class="flex-1 h-1 rounded-full transition-all duration-300"
                :style="{ background: i <= pwdLevel ? pwdColor : '#f0ece4' }"
              ></div>
            </div>
            <p class="text-xs" :style="{ color: pwdColor }">{{ pwdLabel }}</p>
          </div>
          <el-form-item prop="confirm">
            <el-input v-model="form.confirm" type="password" placeholder="确认密码" show-password :prefix-icon="Lock" class="custom-input" />
          </el-form-item>
          <el-form-item prop="captcha">
            <div class="flex gap-3 w-full">
              <el-input v-model="form.captcha" placeholder="验证码" maxlength="4" class="flex-1 custom-input" />
              <div
                class="captcha-box w-[130px] h-[42px] rounded-xl border border-[#e8e0d4] cursor-pointer overflow-hidden shrink-0 flex items-center justify-center transition-all duration-300 hover:border-[var(--green)]"
                :class="{ 'captcha-loading': capLoading }"
                @click="refresh"
              >
                <img v-if="capUrl" :src="capUrl" class="w-full h-full object-contain" alt="验证码" />
                <span v-else class="text-xs" style="color:#bbb">点击加载</span>
              </div>
            </div>
          </el-form-item>
          <el-button
            type="primary"
            native-type="submit"
            :loading="loading"
            class="w-full !h-12 !rounded-xl !text-base !font-bold login-submit-btn"
          >
            <template v-if="!loading">注 册</template>
          </el-button>
        </el-form>

        <div class="mt-7 text-center text-sm" style="color:var(--brown-faint)">
          已有账号？<router-link to="/login" class="font-medium register-link" style="color:var(--green)">立即登录</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { register, getCaptcha } from '@/api/auth'
import { ElMessage } from 'element-plus'
import { Phone, Lock, User } from '@element-plus/icons-vue'

const router = useRouter()
const loading = ref(false); const capLoading = ref(false); const capUrl = ref(''); const capId = ref(''); const $f = ref()
const form = reactive({ phone: '', username: '', password: '', confirm: '', captcha: '' })
const regSuccess = ref(false); const countdown = ref(3)

const rules = {
  phone: [{ required: true, message: '请输入手机号' }, { pattern: /^1[3-9]\d{9}$/, message: '格式不正确' }],
  password: [{ required: true, message: '请输入密码' }, { min: 6, message: '至少6位' }],
  confirm: [{ required: true, message: '请确认密码' }, { validator: (_, v, c) => { if (v !== form.password) c(new Error('两次密码不一致')); else c() } }],
  captcha: [{ required: true, message: '请输入验证码' }]
}

// 密码强度
const pwdLevel = ref(0)
const pwdColor = computed(() => ['#DC2626', '#D97706', '#059669'][pwdLevel.value - 1] || '#f0ece4')
const pwdLabel = computed(() => ['', '弱 - 建议增加字母和符号', '中 - 建议增加符号', '强'][pwdLevel.value] || '')

function checkPwdStrength() {
  const v = form.password
  let score = 0
  if (v.length >= 6) score++
  if (v.length >= 10) score++
  if (/[a-zA-Z]/.test(v) && /\d/.test(v)) score++
  if (/[^a-zA-Z0-9]/.test(v)) score++
  pwdLevel.value = Math.min(3, score)
}

async function refresh() {
  capLoading.value = true
  try {
    const r = await getCaptcha()
    capId.value = r.headers['x-captcha-id'] || r.headers['X-Captcha-Id']
    if (capUrl.value) URL.revokeObjectURL(capUrl.value)
    capUrl.value = URL.createObjectURL(new Blob([r.data], { type: 'image/png' }))
  } finally { capLoading.value = false }
}

let cdTimer = null
async function handleRegister() {
  if (!(await $f.value.validate().catch(() => 0))) return
  loading.value = true
  try {
    await register({ phone: form.phone, password: form.password, username: form.username || form.phone })
    regSuccess.value = true
    cdTimer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) { clearInterval(cdTimer); router.push('/login') }
    }, 1000)
  } catch { refresh() }
  finally { loading.value = false }
}

onMounted(refresh)
onUnmounted(() => { if (cdTimer) clearInterval(cdTimer) })
</script>

<style scoped>
/* 与登录页共享样式 */
.brand-content {
  animation: brandSlideIn 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}
@keyframes brandSlideIn {
  0% { opacity: 0; transform: translateX(-40px); }
  100% { opacity: 1; transform: translateX(0); }
}
.logo-breathe {
  animation: logoBreathing 3s ease-in-out infinite;
}
@keyframes logoBreathing {
  0%, 100% { box-shadow: 0 0 20px rgba(255,255,255,0.08); }
  50% { box-shadow: 0 0 40px rgba(255,255,255,0.2), 0 0 60px rgba(232,184,75,0.15); }
}
.feature-item {
  opacity: 0;
  animation: featureFadeIn 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}
@keyframes featureFadeIn {
  0% { opacity: 0; transform: translateX(-20px); }
  100% { opacity: 1; transform: translateX(0); }
}
.form-card {
  animation: formSlideIn 0.7s cubic-bezier(0.4, 0, 0.2, 1) 0.15s both;
}
@keyframes formSlideIn {
  0% { opacity: 0; transform: translateX(40px); }
  100% { opacity: 1; transform: translateX(0); }
}
.title-underline {
  width: 40px;
  height: 3px;
  background: linear-gradient(90deg, var(--green), var(--green-light));
  border-radius: 2px;
  margin: 0 auto;
  animation: titleLineExtend 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.5s both;
}
@keyframes titleLineExtend {
  0% { width: 0; opacity: 0; }
  100% { width: 40px; opacity: 1; }
}
.custom-input :deep(.el-input__wrapper) {
  border-radius: 12px;
  transition: all 0.3s ease;
  box-shadow: 0 0 0 0 rgba(14, 122, 68, 0);
}
.custom-input :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 3px rgba(14, 122, 68, 0.1), 0 0 0 1px var(--green) !important;
}
.captcha-box {
  transition: all 0.3s ease;
}
.captcha-box:active {
  transform: scale(0.95);
}
.captcha-loading {
  opacity: 0.5;
  pointer-events: none;
  animation: captchaSpin 0.6s ease;
}
@keyframes captchaSpin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
.login-submit-btn {
  background: linear-gradient(135deg, var(--green), var(--green-deep)) !important;
  border: none !important;
  transition: all 0.3s ease !important;
}
.login-submit-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(14, 122, 68, 0.3) !important;
}
.login-submit-btn:active {
  transform: scale(0.98);
}
.register-link {
  position: relative;
  text-decoration: none;
}
.register-link::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  width: 0;
  height: 1.5px;
  background: var(--green);
  transition: width 0.3s ease;
}
.register-link:hover::after {
  width: 100%;
}

/* 成功率 */
.success-check {
  animation: successPopIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes successPopIn {
  0% { transform: scale(0); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}
</style>
