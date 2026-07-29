<template>
  <div class="flex min-h-screen">
    <!-- ====== 左侧品牌区 ====== -->
    <div class="hidden lg:flex flex-1 items-center justify-center relative overflow-hidden">
      <!-- 背景图 + Ken Burns -->
      <div class="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1920&q=80"
          alt="川南梯田"
          class="w-full h-full object-cover ken-burns"
        />
        <div class="absolute inset-0" style="background:linear-gradient(135deg,rgba(26,74,46,0.65),rgba(22,40,55,0.35),rgba(26,74,46,0.55))"></div>
      </div>

      <!-- 浮动光晕 -->
      <div class="absolute top-1/5 right-1/4 w-72 h-72 rounded-full bg-[#E8B84B]/10 blur-[100px] floating" style="animation-duration:7s"></div>
      <div class="absolute bottom-1/4 left-1/4 w-60 h-60 rounded-full bg-[#4CAF50]/8 blur-[80px] floating-delay"></div>

      <!-- 内容 -->
      <div class="relative z-10 text-center text-white px-12 brand-content">
        <!-- Logo + 呼吸发光 -->
        <div class="mb-10 inline-flex items-center justify-center w-28 h-28 rounded-3xl bg-white/12 backdrop-blur-md border border-white/15 logo-breathe">
          <span class="text-6xl font-bold font-[Georgia]">川</span>
        </div>

        <h1 class="text-5xl font-['Noto_Serif_SC'] font-bold mb-3 tracking-[0.15em]">川农智伴</h1>
        <p class="text-lg opacity-75 mb-14 tracking-wide">多模态AI农业智能体平台</p>

        <!-- 功能亮点 -->
        <div class="text-left inline-flex flex-col gap-5">
          <div class="flex items-center gap-4 text-sm feature-item" :style="{ animationDelay: '0.1s' }">
            <div class="w-10 h-10 rounded-xl bg-white/8 flex items-center justify-center shrink-0">🌾</div>
            <span class="opacity-85">AI智能农业问答</span>
          </div>
          <div class="flex items-center gap-4 text-sm feature-item" :style="{ animationDelay: '0.25s' }">
            <div class="w-10 h-10 rounded-xl bg-white/8 flex items-center justify-center shrink-0">📚</div>
            <span class="opacity-85">海量农技知识库</span>
          </div>
          <div class="flex items-center gap-4 text-sm feature-item" :style="{ animationDelay: '0.4s' }">
            <div class="w-10 h-10 rounded-xl bg-white/8 flex items-center justify-center shrink-0">🎯</div>
            <span class="opacity-85">精准种植匹配推荐</span>
          </div>
        </div>

        <!-- 底部 Slogan -->
        <p class="mt-16 text-xs opacity-35 tracking-[0.2em]">科技赋能农业现代化</p>
      </div>
    </div>

    <!-- ====== 右侧表单 ====== -->
    <div class="flex-1 flex items-center justify-center p-8" style="background:linear-gradient(135deg,var(--cream),#F9F5EF)">
      <div class="w-full max-w-[440px] form-card rounded-[2rem] p-10 bg-white"
        style="box-shadow:0 4px 6px rgba(0,0,0,0.02),0 10px 30px rgba(0,0,0,0.04),0 20px 60px rgba(26,74,46,0.04)">
        <!-- 标题 -->
        <div class="text-center mb-8">
          <h2 class="text-2xl font-['Noto_Serif_SC'] font-bold mb-2" style="color:var(--brown)">欢迎回来</h2>
          <div class="title-underline"></div>
          <p class="text-sm mt-3" style="color:var(--brown-faint)">登录您的川农智伴账号</p>
        </div>

        <!-- 表单 -->
        <el-form ref="$f" :model="form" :rules="rules" size="large" @submit.prevent="handleLogin">
          <el-form-item prop="phone">
            <el-input v-model="form.phone" placeholder="手机号" maxlength="11" :prefix-icon="Phone" class="custom-input" />
          </el-form-item>
          <el-form-item prop="password">
            <el-input v-model="form.password" type="password" placeholder="密码" show-password :prefix-icon="Lock" class="custom-input" />
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
            :class="{ 'is-loading': loading }"
          >
            <template v-if="!loading">登 录</template>
          </el-button>
        </el-form>

        <div class="mt-7 text-center text-sm" style="color:var(--brown-faint)">
          没有账号？<router-link to="/register" class="font-medium register-link" style="color:var(--green)">立即注册</router-link>
        </div>
        <div class="mt-2 text-center">
          <router-link to="/" class="text-xs no-underline back-link" style="color:#bbb">← 返回首页</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { login, getCaptcha } from '@/api/auth'
import { ElMessage } from 'element-plus'
import { Phone, Lock } from '@element-plus/icons-vue'

const router = useRouter(); const route = useRoute(); const auth = useAuthStore()
const loading = ref(false); const capLoading = ref(false); const capUrl = ref(''); const capId = ref(''); const $f = ref()
const form = reactive({ phone: '', password: '', captcha: '' })
const rules = {
  phone: [{ required: true, message: '请输入手机号' }, { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确' }],
  password: [{ required: true, message: '请输入密码' }, { min: 6, message: '至少6位' }],
  captcha: [{ required: true, message: '请输入验证码' }]
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
async function handleLogin() {
  if (!(await $f.value.validate().catch(() => 0))) return
  loading.value = true
  try {
    const d = await login({ phone: form.phone, password: form.password, captcha_id: capId.value, captcha: form.captcha })
    auth.loginSuccess(d); ElMessage.success('登录成功！')
    router.push(route.query.redirect || '/')
  } catch { refresh() }
  finally { loading.value = false }
}
onMounted(refresh)
</script>

<style scoped>
/* ===== 左侧品牌 ===== */
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

/* ===== 右侧表单卡片 ===== */
.form-card {
  animation: formSlideIn 0.7s cubic-bezier(0.4, 0, 0.2, 1) 0.15s both;
}
@keyframes formSlideIn {
  0% { opacity: 0; transform: translateX(40px); }
  100% { opacity: 1; transform: translateX(0); }
}

/* 标题装饰线 */
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

/* 输入框 Focus 增强 */
.custom-input :deep(.el-input__wrapper) {
  border-radius: 12px;
  transition: all 0.3s ease;
  box-shadow: 0 0 0 0 rgba(45, 122, 74, 0);
}
.custom-input :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 3px rgba(45, 122, 74, 0.1), 0 0 0 1px var(--green) !important;
}

/* 验证码 */
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

/* 登录按钮 */
.login-submit-btn {
  background: linear-gradient(135deg, var(--green), var(--green-deep)) !important;
  border: none !important;
  transition: all 0.3s ease !important;
  position: relative;
  overflow: hidden;
}
.login-submit-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(45, 122, 74, 0.3) !important;
}
.login-submit-btn:active {
  transform: scale(0.98);
}

/* 注册链接 */
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

/* 返回链接 */
.back-link:hover {
  color: var(--green) !important;
}
</style>
