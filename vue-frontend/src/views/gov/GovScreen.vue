<template>
  <div class="gov-screen min-h-screen relative overflow-hidden">
    <!-- ====== 背景层 ====== -->
    <!-- 网格点阵 -->
    <div class="bg-grid"></div>
    <!-- 光晕 -->
    <div class="glow-orb glow-orb-1"></div>
    <div class="glow-orb glow-orb-2"></div>
    <!-- 扫描线 -->
    <div class="scan-line scan-line-top"></div>
    <div class="scan-line scan-line-bottom"></div>

    <div class="relative z-10 px-6 py-5 md:px-10 md:py-6 max-w-[1800px] mx-auto">
      <!-- ====== 四角科技括号 ====== -->
      <div class="corner-bracket corner-tl"></div>
      <div class="corner-bracket corner-tr"></div>
      <div class="corner-bracket corner-bl"></div>
      <div class="corner-bracket corner-br"></div>

      <!-- ====== 顶栏 ====== -->
      <header class="flex items-center justify-between pb-5 mb-5 header-bar">
        <div class="flex items-center gap-4">
          <div class="w-1 h-8 rounded-full" style="background:linear-gradient(180deg,#00F5A0,transparent);box-shadow:0 0 12px rgba(0,245,160,0.4)"></div>
          <div>
            <h1 class="text-xl md:text-2xl font-['Noto_Serif_SC'] font-bold tracking-[0.15em] title-glow">
              川南农业数据大屏
            </h1>
            <p class="text-[10px] tracking-[0.3em] opacity-40 font-mono">AGRICULTURE DATA DASHBOARD</p>
          </div>
        </div>

        <div class="flex items-center gap-6">
          <!-- 刷新状态 -->
          <div class="flex items-center gap-3">
            <!-- 倒计时环 -->
            <div class="refresh-ring relative w-8 h-8">
              <svg class="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="2" />
                <circle
                  cx="18" cy="18" r="15" fill="none"
                  stroke="rgba(0,245,160,0.5)" stroke-width="2"
                  stroke-linecap="round"
                  :stroke-dasharray="94.2"
                  :stroke-dashoffset="94.2 - (94.2 * refreshProgress / 30)"
                  style="transition: stroke-dashoffset 1s linear"
                />
              </svg>
              <span class="absolute inset-0 flex items-center justify-center text-[10px] font-mono" style="color:#00F5A0">{{ refreshCountdown }}</span>
            </div>
            <span class="text-xs tracking-wider flex items-center gap-1.5">
              <span class="w-1.5 h-1.5 rounded-full animate-pulse" style="background:#00F5A0;box-shadow:0 0 6px #00F5A0"></span>
              <span style="color:#5a6a5a">系统运行中</span>
            </span>
          </div>

          <!-- 时间 -->
          <div class="text-right">
            <div class="font-mono text-lg tracking-wider time-display">{{ time }}</div>
            <div class="text-[10px] tracking-widest opacity-40">{{ dateStr }}</div>
          </div>
        </div>
      </header>

      <!-- ====== 统计卡片 ====== -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div
          v-for="(s, si) in statsData"
          :key="s.label"
          class="stat-card rounded-2xl p-5 flex items-center gap-4 transition-all duration-400 hover:border-[rgba(0,245,160,0.4)] hover:-translate-y-1"
          :style="{ animationDelay: (0.1 * si) + 's' }"
        >
          <div class="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" :style="{background:s.bg,color:s.color}">
            <el-icon :size="22"><component :is="s.icon" /></el-icon>
          </div>
          <div>
            <span class="block text-3xl font-bold font-mono tracking-tight number-glow">{{ animated[s.key]?.toLocaleString() || 0 }}</span>
            <span class="text-xs opacity-50 tracking-wide">{{ s.label }}</span>
          </div>
        </div>
      </div>

      <!-- ====== 图表区域 ====== -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
        <!-- 柱状图 (占2份) -->
        <div class="lg:col-span-2 chart-card rounded-2xl p-5">
          <h3 class="chart-title text-sm font-medium mb-4">数据趋势</h3>
          <div ref="$bar" style="height:280px"></div>
        </div>
        <!-- 饼图 (占1份) -->
        <div class="chart-card rounded-2xl p-5">
          <h3 class="chart-title text-sm font-medium mb-4">数据占比</h3>
          <div ref="$pie" style="height:280px"></div>
        </div>
      </div>

      <!-- ====== 词云 (占位) ====== -->
      <div class="chart-card rounded-2xl p-5 mb-5">
        <h3 class="chart-title text-sm font-medium mb-4">热点词云</h3>
        <div class="wordcloud-area flex flex-wrap justify-center items-center gap-3 py-6 min-h-[120px]">
          <span
            v-for="(w, wi) in wordCloud"
            :key="w.word"
            class="wordcloud-tag transition-all duration-500 hover:text-[#00F5A0] cursor-default"
            :style="{ fontSize: (14 + w.weight * 20) + 'px', opacity: 0.3 + w.weight * 0.7, animationDelay: (0.08 * wi) + 's' }"
          >{{ w.word }}</span>
        </div>
      </div>

      <!-- ====== 底部状态栏 ====== -->
      <div class="flex items-center justify-between text-[10px] font-mono opacity-30 tracking-widest">
        <span>CHUANNONG-AI · AGRICULTURE DATA PLATFORM</span>
        <span>数据每30秒自动刷新</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, nextTick, computed } from 'vue'
import { getGovStats } from '@/api/gov'
import * as echarts from 'echarts'

// ===== 数据状态 =====
const stats = ref({})
const time = ref('')
const dateStr = ref('')
const $bar = ref(null)
const $pie = ref(null)
let bar = null; let pie = null
let clockTimer = null; let refreshTimer = null; let countdownTimer = null

// 30秒刷新倒计时
const refreshCountdown = ref(30)
const refreshProgress = ref(30)

// 动画数字
const animated = reactive({ total_users: 0, total_chats: 0, total_diagnoses: 0, total_knowledge: 0 })

const statsData = computed(() => [
  { key: 'total_users', icon: 'UserFilled', label: '注册用户', value: stats.value.total_users || 0, color: '#00F5A0', bg: 'rgba(0,245,160,.1)' },
  { key: 'total_chats', icon: 'ChatDotRound', label: '对话总数', value: stats.value.total_chats || 0, color: '#2F80ED', bg: 'rgba(47,128,237,.15)' },
  { key: 'total_diagnoses', icon: 'CameraFilled', label: '图片诊断', value: stats.value.total_diagnoses || 0, color: '#F2994A', bg: 'rgba(242,153,74,.15)' },
  { key: 'total_knowledge', icon: 'Reading', label: '知识条目', value: stats.value.total_knowledge || 0, color: '#A78BFA', bg: 'rgba(167,139,250,.15)' }
])

// 词云数据
const wordCloud = [
  { word: '智慧农业', weight: 0.9 },
  { word: '水稻种植', weight: 0.8 },
  { word: '病虫害防治', weight: 0.75 },
  { word: '柑橘', weight: 0.7 },
  { word: '川南', weight: 0.65 },
  { word: 'AI诊断', weight: 0.6 },
  { word: '茶叶', weight: 0.55 },
  { word: '施肥', weight: 0.5 },
  { word: 'RAG检索', weight: 0.45 },
  { word: '收益计算', weight: 0.4 },
  { word: '大数据', weight: 0.35 },
  { word: '物联网', weight: 0.3 }
]

// ===== 时间更新 =====
function updateTime() {
  const d = new Date()
  time.value = d.toLocaleTimeString('zh-CN', { hour12: false })
  dateStr.value = d.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short' })
}

// ===== 数字动画 =====
function animateNumbers() {
  const targets = {
    total_users: stats.value.total_users || 0,
    total_chats: stats.value.total_chats || 0,
    total_diagnoses: stats.value.total_diagnoses || 0,
    total_knowledge: stats.value.total_knowledge || 0
  }
  const duration = 1800
  const startTime = performance.now()
  function tick(now) {
    const p = Math.min((now - startTime) / duration, 1)
    const ease = 1 - Math.pow(1 - p, 3)
    for (const k of Object.keys(targets)) {
      animated[k] = Math.floor(targets[k] * ease)
    }
    if (p < 1) requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
}

// ===== ECharts 渲染 =====
function renderCharts() {
  const s = stats.value
  const textColor = '#667766'
  const gridColor = 'rgba(255,255,255,0.04)'

  if ($bar.value) {
    bar?.dispose(); bar = echarts.init($bar.value, 'dark')
    bar.setOption({
      tooltip: { trigger: 'axis' },
      grid: { left: 50, right: 20, top: 15, bottom: 30 },
      xAxis: {
        type: 'category',
        data: ['注册用户', '对话总数', '图片诊断', '知识条目'],
        axisLabel: { color: textColor, fontSize: 12 },
        axisLine: { lineStyle: { color: gridColor } }
      },
      yAxis: {
        type: 'value',
        axisLabel: { color: textColor },
        splitLine: { lineStyle: { color: gridColor } }
      },
      series: [{
        type: 'bar',
        barWidth: '50%',
        data: [s.total_users || 0, s.total_chats || 0, s.total_diagnoses || 0, s.total_knowledge || 0],
        itemStyle: {
          borderRadius: [8, 8, 0, 0],
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#00F5A0' },
            { offset: 1, color: 'rgba(0,245,160,0.2)' }
          ])
        },
        animationDuration: 1800,
        animationEasing: 'cubicOut'
      }]
    })
  }

  if ($pie.value) {
    pie?.dispose(); pie = echarts.init($pie.value, 'dark')
    pie.setOption({
      tooltip: { trigger: 'item' },
      series: [{
        type: 'pie',
        radius: ['50%', '75%'],
        center: ['50%', '52%'],
        label: { color: textColor, formatter: '{b}\n{d}%', fontSize: 11 },
        animationDuration: 1800,
        animationEasing: 'cubicOut',
        data: [
          { value: s.total_users || 0, name: '用户', itemStyle: { color: '#00F5A0' } },
          { value: s.total_chats || 0, name: '对话', itemStyle: { color: '#2F80ED' } },
          { value: s.total_diagnoses || 0, name: '诊断', itemStyle: { color: '#F2994A' } },
          { value: s.total_knowledge || 0, name: '知识', itemStyle: { color: '#A78BFA' } }
        ]
      }]
    })
  }
}

// ===== 数据加载 =====
async function load() {
  try { const d = await getGovStats(); if (d) stats.value = d; nextTick(() => { animateNumbers(); renderCharts() }) } catch { /* ignore */ }
}

// ===== 倒计时 =====
function startCountdown() {
  refreshCountdown.value = 30
  refreshProgress.value = 30
  countdownTimer = setInterval(() => {
    refreshCountdown.value--
    refreshProgress.value = refreshCountdown.value
    if (refreshCountdown.value <= 0) refreshCountdown.value = 30
  }, 1000)
}

// ===== 生命周期 =====
onMounted(() => {
  updateTime()
  clockTimer = setInterval(updateTime, 1000)
  load()
  startCountdown()
  refreshTimer = setInterval(() => { load(); refreshCountdown.value = 30; refreshProgress.value = 30 }, 30000)
})

onUnmounted(() => {
  clearInterval(clockTimer); clearInterval(refreshTimer); clearInterval(countdownTimer)
  bar?.dispose(); pie?.dispose()
})
</script>

<style scoped>
/* ===== 整体背景 ===== */
.gov-screen {
  background: linear-gradient(160deg, #060E08 0%, #0A150C 30%, #060E08 100%);
  color: #c8d6c8;
  font-family: 'Noto Sans SC', system-ui, sans-serif;
}

/* 网格背景 */
.bg-grid {
  position: absolute;
  inset: 0;
  opacity: 0.04;
  background-image:
    linear-gradient(rgba(0,245,160,0.3) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0,245,160,0.3) 1px, transparent 1px);
  background-size: 60px 60px;
}

/* 光晕球体 */
.glow-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(120px);
  pointer-events: none;
}
.glow-orb-1 {
  top: 10%;
  left: 20%;
  width: 500px;
  height: 500px;
  background: rgba(0, 245, 160, 0.04);
}
.glow-orb-2 {
  bottom: 15%;
  right: 15%;
  width: 400px;
  height: 400px;
  background: rgba(47, 128, 237, 0.03);
}

/* 扫描线 */
.scan-line {
  position: absolute;
  left: 0;
  right: 0;
  height: 1px;
  pointer-events: none;
}
.scan-line-top {
  top: 80px;
  background: linear-gradient(90deg, transparent, rgba(0,245,160,0.12) 20%, rgba(0,245,160,0.12) 80%, transparent);
}
.scan-line-bottom {
  bottom: 40px;
  background: linear-gradient(90deg, transparent, rgba(0,245,160,0.08) 30%, rgba(0,245,160,0.08) 70%, transparent);
}

/* ===== 四角括号 ===== */
.corner-bracket {
  position: absolute;
  width: 30px;
  height: 30px;
  pointer-events: none;
  z-index: 5;
}
.corner-tl { top: 12px; left: 12px; border-top: 1px solid rgba(0,245,160,0.2); border-left: 1px solid rgba(0,245,160,0.2); }
.corner-tr { top: 12px; right: 12px; border-top: 1px solid rgba(0,245,160,0.2); border-right: 1px solid rgba(0,245,160,0.2); }
.corner-bl { bottom: 12px; left: 12px; border-bottom: 1px solid rgba(0,245,160,0.2); border-left: 1px solid rgba(0,245,160,0.2); }
.corner-br { bottom: 12px; right: 12px; border-bottom: 1px solid rgba(0,245,160,0.2); border-right: 1px solid rgba(0,245,160,0.2); }

/* ===== 标题发光 ===== */
.title-glow {
  background: linear-gradient(180deg, #e0ffe0, #00F5A0);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  filter: drop-shadow(0 0 20px rgba(0,245,160,0.3));
}
.time-display {
  color: #c8d6c8;
  text-shadow: 0 0 8px rgba(0,245,160,0.2);
}

/* ===== 统计卡片 ===== */
.stat-card {
  background: rgba(12, 24, 16, 0.8);
  border: 1px solid rgba(0, 245, 160, 0.1);
  backdrop-filter: blur(10px);
  animation: statCardIn 0.6s cubic-bezier(0.4, 0, 0.2, 1) both;
}
.stat-card:hover {
  border-color: rgba(0, 245, 160, 0.35);
  box-shadow: 0 0 24px rgba(0, 245, 160, 0.06), inset 0 0 20px rgba(0, 245, 160, 0.02);
}
@keyframes statCardIn {
  0% { opacity: 0; transform: translateY(20px); }
  100% { opacity: 1; transform: translateY(0); }
}
.number-glow {
  text-shadow: 0 0 12px rgba(0, 245, 160, 0.2);
}

/* ===== 图表卡片 ===== */
.chart-card {
  background: rgba(12, 24, 16, 0.65);
  border: 1px solid rgba(0, 245, 160, 0.08);
  backdrop-filter: blur(8px);
  transition: all 0.4s ease;
}
.chart-card:hover {
  border-color: rgba(0, 245, 160, 0.25);
  box-shadow: 0 0 30px rgba(0, 245, 160, 0.04);
}
.chart-title {
  color: #667766;
  letter-spacing: 0.08em;
  border-left: 2px solid rgba(0, 245, 160, 0.3);
  padding-left: 12px;
}

/* ===== 词云 ===== */
.wordcloud-tag {
  cursor: default;
  color: #556655;
  animation: wordFadeIn 0.5s ease both;
  transition: all 0.3s ease;
}
.wordcloud-tag:hover {
  color: #00F5A0;
  text-shadow: 0 0 12px rgba(0, 245, 160, 0.4);
  transform: scale(1.1);
}
@keyframes wordFadeIn {
  0% { opacity: 0; transform: translateY(8px); }
  100% { opacity: 1; transform: translateY(0); }
}

/* ===== 顶栏分隔线 ===== */
.header-bar {
  border-bottom: 1px solid rgba(0, 245, 160, 0.1);
}
</style>
