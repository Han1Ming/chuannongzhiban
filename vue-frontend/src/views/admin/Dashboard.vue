<template>
  <div>
    <h2 class="font-['Noto_Serif_SC'] text-xl font-bold mb-6 flex items-center gap-2" style="color:var(--brown)">
      仪表盘
    </h2>

    <!-- ====== 统计卡片 ====== -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
      <div
        v-for="(s, si) in statsData"
        :key="s.label"
        ref="$statCards"
        class="stat-card bg-white rounded-2xl p-6 flex items-center gap-4 border border-[#e8e0d4] cursor-default transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
        :style="{ borderLeft: `4px solid ${s.color}`, animationDelay: (0.08 * si) + 's' }"
      >
        <div class="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110" :style="{background:s.bg, color:s.color}">
          <el-icon :size="22"><component :is="s.icon" /></el-icon>
        </div>
        <div>
          <span class="block text-2xl font-bold font-mono tracking-tight" style="color:var(--brown)">{{ animated[s.key]?.toLocaleString() || 0 }}</span>
          <span class="text-xs" style="color:var(--brown-faint)">{{ s.label }}</span>
        </div>
      </div>
    </div>

    <!-- ====== 图表 ====== -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="bg-white rounded-2xl p-6 border border-[#e8e0d4] hover:shadow-md transition-shadow duration-300">
        <h3 class="font-['Noto_Serif_SC'] font-bold text-sm mb-5 flex items-center gap-2" style="color:var(--brown)">
          <span class="w-1.5 h-4 rounded-full" style="background:var(--green)"></span> 数据概览
        </h3>
        <div ref="$bar" style="height:280px"></div>
      </div>
      <div class="bg-white rounded-2xl p-6 border border-[#e8e0d4] hover:shadow-md transition-shadow duration-300">
        <h3 class="font-['Noto_Serif_SC'] font-bold text-sm mb-5 flex items-center gap-2" style="color:var(--brown)">
          <span class="w-1.5 h-4 rounded-full" style="background:var(--gold)"></span> 数据占比
        </h3>
        <div ref="$pie" style="height:280px"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick, onUnmounted } from 'vue'
import { getGovStats } from '@/api/gov'
import * as echarts from 'echarts'

const stats = ref({})
const $bar = ref(null); const $pie = ref(null); const $statCards = ref([])
let bar = null; let pie = null

const statsData = computed(() => [
  { key: 'total_users', icon: 'UserFilled', label: '注册用户', value: stats.value.total_users || 0, color: '#0E7A44', bg: '#E8F5E9' },
  { key: 'total_chats', icon: 'ChatDotRound', label: '对话总数', value: stats.value.total_chats || 0, color: '#3B82F6', bg: '#DBEAFE' },
  { key: 'total_diagnoses', icon: 'CameraFilled', label: '图片诊断', value: stats.value.total_diagnoses || 0, color: '#D97706', bg: '#FEF3C7' },
  { key: 'total_knowledge', icon: 'Reading', label: '知识条目', value: stats.value.total_knowledge || 0, color: '#7C3AED', bg: '#EDE9FE' }
])

// 动画数字
const animated = reactive({ total_users: 0, total_chats: 0, total_diagnoses: 0, total_knowledge: 0 })

function animateStats() {
  const targets = {
    total_users: stats.value.total_users || 0,
    total_chats: stats.value.total_chats || 0,
    total_diagnoses: stats.value.total_diagnoses || 0,
    total_knowledge: stats.value.total_knowledge || 0
  }
  const duration = 1500
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

function render() {
  const s = stats.value
  if ($bar.value) {
    bar?.dispose(); bar = echarts.init($bar.value)
    bar.setOption({
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: ['用户', '对话', '诊断', '知识'], axisLine: { lineStyle: { color: '#e8e0d4' } } },
      yAxis: { type: 'value', splitLine: { lineStyle: { color: '#f5f0eb' } } },
      series: [{
        type: 'bar',
        data: [s.total_users || 0, s.total_chats || 0, s.total_diagnoses || 0, s.total_knowledge || 0],
        itemStyle: {
          borderRadius: [8, 8, 0, 0],
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#2E9D63' },
            { offset: 1, color: '#0E7A44' }
          ])
        },
        animationDuration: 1500,
        animationEasing: 'cubicOut'
      }]
    })
  }
  if ($pie.value) {
    pie?.dispose(); pie = echarts.init($pie.value)
    pie.setOption({
      tooltip: { trigger: 'item' },
      series: [{
        type: 'pie',
        radius: ['50%', '72%'],
        animationDuration: 1500,
        animationEasing: 'cubicOut',
        label: { formatter: '{b}\n{d}%' },
        data: [
          { value: s.total_users || 0, name: '用户', itemStyle: { color: '#0E7A44' } },
          { value: s.total_chats || 0, name: '对话', itemStyle: { color: '#3B82F6' } },
          { value: s.total_diagnoses || 0, name: '诊断', itemStyle: { color: '#D97706' } },
          { value: s.total_knowledge || 0, name: '知识', itemStyle: { color: '#7C3AED' } }
        ]
      }]
    })
  }
}

onMounted(async () => {
  try { stats.value = await getGovStats() || {} } catch {}
  nextTick(() => { animateStats(); render() })
})

onUnmounted(() => { bar?.dispose(); pie?.dispose() })
</script>

<style scoped>
.stat-card {
  animation: statCardSlide 0.5s cubic-bezier(0.4, 0, 0.2, 1) both;
}
@keyframes statCardSlide {
  0% { opacity: 0; transform: translateY(16px); }
  100% { opacity: 1; transform: translateY(0); }
}
</style>
