<!-- FarmMatch.vue -->
<template>
  <div class="max-w-6xl mx-auto px-4 py-10">
    <!-- ====== 顶部横幅 ====== -->
    <div
      class="farm-banner h-44 md:h-60 -mx-4 -mt-10 mb-10 rounded-none md:rounded-3xl overflow-hidden relative"
    >
      <img
        src="https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=1920&q=80"
        alt="梯田晨光"
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
            智能种植匹配
          </h1>
          <p
            class="text-white/75 text-sm md:text-base font-light tracking-wide"
          >
            根据地区、季节和农业类型，智能推荐最佳种植方案
          </p>
          <div class="w-12 h-px bg-[#E8B84B]/50 mx-auto mt-4"></div>
        </div>
      </div>
    </div>

    <!-- ====== 双栏布局 ====== -->
    <div class="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
      <!-- 左侧筛选表单 (占2份) -->
      <div
        class="lg:col-span-2 bg-white rounded-3xl p-8 border border-[#e8e0d4]"
        style="box-shadow: 0 4px 24px rgba(0, 0, 0, 0.03)"
      >
        <h3
          class="font-['Noto_Serif_SC'] font-bold text-lg mb-6 flex items-center gap-2"
          style="color: var(--brown)"
        >
          <span class="text-xl">🎯</span> 筛选条件
        </h3>
        <el-form
          ref="$f"
          :model="form"
          :rules="rules"
          label-position="top"
          size="large"
        >
          <el-form-item label="川南地区" prop="region">
            <el-select
              v-model="form.region"
              placeholder="选择地区"
              class="!w-full match-select"
              @change="autoMatch"
            >
              <el-option v-for="r in REGIONS" :key="r" :label="r" :value="r" />
            </el-select>
          </el-form-item>
          <el-form-item label="农业类型" prop="farming_type">
            <el-select
              v-model="form.farming_type"
              placeholder="选择类型"
              class="!w-full match-select"
              @change="autoMatch"
            >
              <el-option
                v-for="t in FARMING_TYPES"
                :key="t"
                :label="t"
                :value="t"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="当前季节" prop="season">
            <el-select
              v-model="form.season"
              placeholder="选择季节"
              class="!w-full match-select"
              @change="autoMatch"
            >
              <el-option v-for="s in SEASONS" :key="s" :label="s" :value="s" />
            </el-select>
          </el-form-item>
          <el-button
            type="primary"
            size="large"
            @click="match"
            :loading="loading"
            class="match-btn w-full !h-12 !rounded-xl !text-base !font-bold !mt-3"
          >
            <template v-if="!loading">
              <el-icon :size="18"><Search /></el-icon> 智能匹配
            </template>
          </el-button>
        </el-form>
      </div>

      <!-- 右侧结果 (占3份) -->
      <div
        class="lg:col-span-3 bg-white rounded-3xl p-8 border border-[#e8e0d4] min-h-[420px] flex items-center justify-center"
        style="box-shadow: 0 4px 24px rgba(0, 0, 0, 0.03)"
      >
        <!-- 加载动画 -->
        <div v-if="loading" class="text-center">
          <div class="sprout-loader mb-6">
            <span class="sprout-icon text-6xl">🌱</span>
          </div>
          <p class="text-sm" style="color: var(--brown-faint)">
            AI 正在为您匹配合适的种植方案…
          </p>
        </div>

        <!-- 匹配结果 -->
        <div v-else-if="result" class="match-result text-center w-full">
          <div
            class="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-5"
            style="
              background: linear-gradient(135deg, var(--green-mist), #d4edda);
            "
          >
            <span class="text-4xl">🌾</span>
          </div>
          <h2
            class="font-['Noto_Serif_SC'] text-3xl font-bold mb-2"
            style="color: var(--green-deep)"
          >
            {{ result.crop }}
          </h2>
          <div
            class="w-10 h-1 rounded-full mx-auto mb-6"
            style="background: var(--gold)"
          ></div>
          <div
            class="text-left text-sm leading-[1.9] markdown-body p-6 rounded-2xl"
            style="background: #faf8f4; color: var(--brown-soft)"
            v-html="md.render(result.plan || '')"
          ></div>
        </div>

        <!-- 无结果 -->
        <div v-else-if="notFound" class="text-center py-10">
          <div
            class="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-5"
            style="background: #f5f5f5"
          >
            <span class="text-3xl opacity-30">🔍</span>
          </div>
          <p class="text-sm mb-1" style="color: #bbb">暂未找到匹配方案</p>
          <p class="text-xs" style="color: #ddd">请调整筛选条件后重新匹配</p>
        </div>

        <!-- 初始状态 -->
        <div v-else class="text-center py-10 empty-state">
          <div
            class="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-5"
            style="background: #f5f5f5"
          >
            <el-icon :size="36" style="color: #ccc"><Search /></el-icon>
          </div>
          <p class="text-sm" style="color: #bbb">选择地区、类型和季节</p>
          <p class="text-xs mt-1" style="color: #ddd">
            AI 为您智能推荐最佳种植方案
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from "vue";
import { matchRecommendation } from "@/api/farm";
import { REGIONS, FARMING_TYPES, SEASONS } from "@/utils/constants";
import MarkdownIt from "markdown-it";

const md = new MarkdownIt({ html: false, breaks: true });
const $f = ref();
const loading = ref(false);
const result = ref(null);
const notFound = ref(false);

const form = reactive({
  region: "",
  farming_type: "",
  season: "",
});

const rules = {
  region: [{ required: true, message: "请选择地区" }],
  farming_type: [{ required: true, message: "请选择农业类型" }],
  season: [{ required: true, message: "请选择季节" }],
};

function autoMatch() {
  if (form.region && form.farming_type && form.season) {
    match();
  }
}

async function match() {
  try {
    const valid = await $f.value.validate();
    if (!valid) return;
  } catch {
    return;
  }

  result.value = null;
  notFound.value = false;
  loading.value = true;

  try {
    const data = await matchRecommendation({ ...form });
    if (data?.crop) {
      result.value = data;
    } else {
      notFound.value = true;
    }
  } catch (err) {
    // 后端返回 404 表示未找到
    if (err.response?.status === 404) {
      notFound.value = true;
    } else {
      console.error("匹配请求失败:", err);
      notFound.value = true;
    }
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.match-btn {
  background: linear-gradient(
    135deg,
    var(--green),
    var(--green-deep)
  ) !important;
  border: none !important;
  transition: all 0.3s ease !important;
}
.match-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(14, 122, 68, 0.3) !important;
}
.match-select :deep(.el-input__wrapper) {
  border-radius: 14px;
  transition: all 0.3s ease;
}
.match-select :deep(.el-input__wrapper.is-focus) {
  box-shadow:
    0 0 0 3px rgba(14, 122, 68, 0.1),
    0 0 0 1px var(--green) !important;
}

/* 发芽加载动画 */
.sprout-loader {
  animation: sproutBounce 1.2s ease-in-out infinite;
}
@keyframes sproutBounce {
  0%,
  100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-16px) scale(1.1);
  }
  50% {
    transform: translateY(0) scale(0.95);
  }
  70% {
    transform: translateY(-6px) scale(1.05);
  }
}

.match-result {
  animation: resultFadeIn 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}
@keyframes resultFadeIn {
  0% {
    opacity: 0;
    transform: translateY(20px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}
.empty-state {
  animation: emptyFade 0.4s ease;
}
@keyframes emptyFade {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}
</style>
