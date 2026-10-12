<!-- FarmCalc.vue -->
<template>
  <div class="max-w-6xl mx-auto px-4 py-10">
    <!-- ====== 顶部横幅 ====== -->
    <div
      class="farm-banner h-44 md:h-60 -mx-4 -mt-10 mb-10 rounded-none md:rounded-3xl overflow-hidden relative"
    >
      <img
        src="https://images.unsplash.com/photo-1472396961693-142e6e269027?w=1920&q=80"
        alt="晨雾梯田"
        class="w-full h-full object-cover ken-burns"
        loading="lazy"
      />
      <div
        class="absolute inset-0"
        style="
          background: linear-gradient(
            135deg,
            rgba(10, 92, 51, 0.55),
            rgba(14, 122, 68, 0.3)
          );
        "
      ></div>
      <div class="absolute inset-0 flex items-center justify-center">
        <div class="text-center text-white">
          <h1
            class="font-['Noto_Serif_SC'] text-4xl md:text-5xl font-bold mb-2"
          >
            收益计算器
          </h1>
          <p
            class="text-white/75 text-sm md:text-base font-light tracking-wide"
          >
            科学评估种植收益，辅助农业决策
          </p>
          <div class="w-12 h-px bg-[#E8B84B]/50 mx-auto mt-4"></div>
        </div>
      </div>
    </div>

    <!-- ====== 双栏布局 ====== -->
    <div class="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
      <!-- 左侧表单 -->
      <div
        class="lg:col-span-2 bg-white rounded-3xl p-8 border border-[#e8e0d4]"
        style="box-shadow: 0 4px 24px rgba(0, 0, 0, 0.03)"
      >
        <h3
          class="font-['Noto_Serif_SC'] font-bold text-lg mb-6 flex items-center gap-2"
          style="color: var(--brown)"
        >
          <span class="text-xl">📋</span> 种植参数
        </h3>
        <el-form
          ref="$f"
          :model="form"
          :rules="rules"
          label-position="top"
          size="large"
        >
          <el-form-item label="种植面积（亩）" prop="area">
            <el-input-number
              v-model="form.area"
              :min="0.1"
              :precision="1"
              :step="1"
              class="!w-full"
            />
          </el-form-item>
          <el-form-item label="每亩成本（元）" prop="cost_per_mu">
            <el-input-number
              v-model="form.cost_per_mu"
              :min="0"
              :precision="2"
              :step="100"
              class="!w-full"
            />
          </el-form-item>
          <el-form-item label="每亩产量（斤）" prop="yield_per_mu">
            <el-input-number
              v-model="form.yield_per_mu"
              :min="0"
              :precision="1"
              :step="50"
              class="!w-full"
            />
          </el-form-item>
          <el-form-item label="单价（元/斤）" prop="price_per_unit">
            <el-input-number
              v-model="form.price_per_unit"
              :min="0"
              :precision="2"
              :step="0.5"
              class="!w-full"
            />
          </el-form-item>
          <el-button
            type="primary"
            size="large"
            @click="calc"
            :loading="loading"
            class="calc-btn w-full !h-12 !rounded-xl !text-base !font-bold !mt-3"
          >
            <template v-if="!loading">
              <el-icon :size="18"><DataAnalysis /></el-icon> 开始计算
            </template>
          </el-button>
        </el-form>
      </div>

      <!-- 右侧结果 -->
      <div
        class="lg:col-span-3 bg-white rounded-3xl p-8 border border-[#e8e0d4] min-h-[420px] flex flex-col justify-center"
        style="box-shadow: 0 4px 24px rgba(0, 0, 0, 0.03)"
      >
        <template v-if="result">
          <h3
            class="font-['Noto_Serif_SC'] font-bold text-lg mb-6 text-center"
            style="color: var(--brown)"
          >
            📊 计算结果
          </h3>

          <!-- 数字卡片 -->
          <div class="grid grid-cols-2 gap-4 mb-6">
            <div
              class="result-card p-5 rounded-2xl text-center"
              style="background: var(--cream)"
            >
              <span
                class="text-xs block mb-1.5"
                style="color: var(--brown-faint)"
                >总成本</span
              >
              <span
                class="result-num text-2xl font-bold font-mono"
                style="color: var(--brown)"
                >{{ displayNum("total_cost") }}元</span
              >
            </div>
            <div
              class="result-card p-5 rounded-2xl text-center"
              style="background: var(--cream)"
            >
              <span
                class="text-xs block mb-1.5"
                style="color: var(--brown-faint)"
                >总收入</span
              >
              <span
                class="result-num text-2xl font-bold font-mono"
                style="color: var(--green)"
                >{{ displayNum("total_income") }}元</span
              >
            </div>
            <div
              class="result-card p-5 rounded-2xl text-center col-span-2"
              style="background: var(--green-mist)"
            >
              <span
                class="text-xs block mb-1.5"
                style="color: var(--brown-faint)"
                >净利润</span
              >
              <span
                class="result-num text-3xl font-bold font-mono"
                :style="{
                  color:
                    result.net_profit >= 0 ? 'var(--green)' : 'var(--error)',
                }"
                >{{ displayNum("net_profit") }}元</span
              >
            </div>
          </div>

          <!-- 投资回报率 -->
          <div class="text-center mb-6">
            <span class="text-xs" style="color: var(--brown-faint)"
              >投资回报率</span
            >
            <div
              class="text-2xl font-bold font-mono mt-1"
              :style="{
                color: result.roi >= 0 ? 'var(--green)' : 'var(--error)',
              }"
            >
              {{ (result.roi * 100).toFixed(1) }}%
            </div>
          </div>

          <!-- ECharts 容器 - 强制固定尺寸并加调试边框 -->
          <div
            ref="$chart"
            class="chart-wrapper"
            style="
              height: 220px;
              width: 100%;
              display: block;
              border: 2px dashed #ccc;
              border-radius: 12px;
              background: #fafafa;
            "
          ></div>
        </template>

        <!-- 空状态 -->
        <div v-else class="text-center py-10 empty-state">
          <div
            class="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-5"
            style="background: #f5f5f5"
          >
            <el-icon :size="36" style="color: #ccc"><DataAnalysis /></el-icon>
          </div>
          <p class="text-sm" style="color: #bbb">
            填写左侧参数，点击"开始计算"
          </p>
          <p class="text-xs mt-1" style="color: #ddd">
            系统将生成详细的收益分析图表
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, nextTick, onMounted, onUnmounted, watch } from "vue";
import { calculateBudget } from "@/api/farm";
import * as echarts from "echarts";

const $f = ref();
const $chart = ref();
const loading = ref(false);
const result = ref(null);
let chartInstance = null;
let resizeObserver = null;

const form = reactive({
  area: 10,
  cost_per_mu: 800,
  yield_per_mu: 1000,
  price_per_unit: 2.0,
});

const rules = {
  area: [{ required: true, message: "请输入种植面积" }],
  cost_per_mu: [{ required: true, message: "请输入每亩成本" }],
  yield_per_mu: [{ required: true, message: "请输入每亩产量" }],
  price_per_unit: [{ required: true, message: "请输入单价" }],
};

// 数字动画
const displayed = reactive({ total_cost: 0, total_income: 0, net_profit: 0 });

function displayNum(key) {
  return Number(displayed[key]).toLocaleString("zh-CN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function animateValue(key, target) {
  const start = displayed[key];
  const diff = target - start;
  const duration = 1200;
  const startTime = performance.now();
  function tick(now) {
    const p = Math.min((now - startTime) / duration, 1);
    const ease = 1 - Math.pow(1 - p, 3);
    displayed[key] = start + diff * ease;
    if (p < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

// ---------- ECharts 渲染 ----------
function renderChart() {
  const el = $chart.value;
  if (!el) {
    console.warn("图表容器不存在");
    return;
  }

  // 销毁旧实例
  if (chartInstance) {
    chartInstance.dispose();
    chartInstance = null;
  }

  try {
    // 初始化，强制使用 canvas
    chartInstance = echarts.init(el, null, { renderer: "canvas" });

    // 打印容器实际尺寸供调试
    console.log("容器实际尺寸:", el.clientWidth, "x", el.clientHeight);

    const { total_cost, net_profit } = result.value;

    chartInstance.setOption({
      tooltip: {
        trigger: "item",
        formatter: "{b}: {c}元 ({d}%)",
      },
      legend: {
        orient: "horizontal",
        bottom: 0,
        left: "center",
        icon: "circle",
        itemWidth: 10,
        itemHeight: 10,
      },
      series: [
        {
          type: "pie",
          radius: ["45%", "72%"],
          center: ["50%", "48%"],
          avoidLabelOverlap: true,
          animation: true,
          animationDuration: 1500,
          animationEasing: "cubicOut",
          label: {
            formatter: "{b}\n{d}%",
            fontSize: 12,
            color: "#5D4E3A",
          },
          labelLine: {
            length: 12,
            length2: 16,
          },
          data: [
            {
              value: Math.max(net_profit, 0),
              name: "净利润",
              itemStyle: { color: "#0E7A44" },
            },
            {
              value: total_cost,
              name: "总成本",
              itemStyle: { color: "#C4A882" },
            },
          ],
        },
      ],
    });

    // 强制 resize 以适应容器
    chartInstance.resize();
    console.log("图表渲染成功，尺寸已调整");
  } catch (err) {
    console.error("ECharts 渲染失败:", err);
  }
}

// 监听 result 变化
watch(result, (newVal) => {
  if (newVal) {
    nextTick(() => {
      // 延迟确保 DOM 渲染完成
      setTimeout(renderChart, 150);
    });
  }
});

// 窗口自适应
function handleResize() {
  if (chartInstance) {
    chartInstance.resize();
  }
}

onMounted(() => {
  window.addEventListener("resize", handleResize);
  if ($chart.value && window.ResizeObserver) {
    resizeObserver = new ResizeObserver(() => {
      if (chartInstance) chartInstance.resize();
    });
    resizeObserver.observe($chart.value);
  }
});

onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }
  if (chartInstance) {
    chartInstance.dispose();
    chartInstance = null;
  }
});

// ---------- 计算 ----------
async function calc() {
  try {
    const valid = await $f.value.validate();
    if (!valid) return;
  } catch {
    return;
  }

  loading.value = true;
  try {
    const data = await calculateBudget({ ...form });
    result.value = data;

    nextTick(() => {
      animateValue("total_cost", data.total_cost);
      animateValue("total_income", data.total_income);
      animateValue("net_profit", data.net_profit);
      // 延迟更长时间确保 DOM 布局稳定
      setTimeout(renderChart, 300);
    });
  } catch (err) {
    console.error("计算失败:", err);
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.calc-btn {
  background: linear-gradient(
    135deg,
    var(--green),
    var(--green-deep)
  ) !important;
  border: none !important;
  transition: all 0.3s ease !important;
}
.calc-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(14, 122, 68, 0.3) !important;
}
.result-card {
  transition: all 0.3s ease;
}
.result-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
}
.empty-state {
  animation: emptyFade 0.6s ease;
}
@keyframes emptyFade {
  0% {
    opacity: 0;
    transform: translateY(10px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
