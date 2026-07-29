<template>
  <view class="diagnose-page">
    <NavBar title="病虫害诊断" :show-back="true" />

    <scroll-view class="diagnose-scroll" scroll-y>
      <!-- 拍照入口 -->
      <view class="upload-area" @tap="chooseImages">
        <view class="upload-box" v-if="!tempFiles.length">
          <text class="upload-icon">📷</text>
          <text class="upload-title">点击拍照或选择图片</text>
          <text class="upload-desc">AI智能识别农作物病虫害</text>
          <text class="upload-hint">支持水稻、柑橘、茶叶等作物</text>
        </view>
        <view class="preview-list" v-else>
          <view class="preview-item" v-for="(file, i) in tempFiles" :key="i">
            <image class="preview-img" :src="file" mode="aspectFill" />
            <text class="preview-del" @tap.stop="removeImage(i)">✕</text>
          </view>
          <view class="preview-item preview-add" @tap="chooseImages" v-if="tempFiles.length < 4">
            <text class="add-icon">+</text>
          </view>
        </view>
        <text class="upload-count" v-if="tempFiles.length">已选择 {{ tempFiles.length }} 张图片</text>
      </view>

      <!-- 开始诊断按钮 -->
      <button class="diagnose-btn" :disabled="!tempFiles.length || diagnosing" @tap="startDiagnose">
        <text v-if="!diagnosing">🔬 开始AI诊断</text>
        <text v-else>⏳ 诊断中...</text>
      </button>

      <!-- 诊断结果 -->
      <view class="results" v-if="diagnosisResult">
        <view class="result-header">
          <text class="result-title">📋 诊断结果</text>
        </view>
        <view class="result-summary" v-if="diagnosisResult.summary">
          <text class="summary-text">{{ diagnosisResult.summary }}</text>
        </view>
        <DiagnoseCard
          v-for="(r, i) in diagnosisResult.results || []"
          :key="i"
          :result="r"
        />
      </view>

      <view class="bottom-safe" />
    </scroll-view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import NavBar from '@/components/NavBar.vue'
import DiagnoseCard from '@/components/DiagnoseCard.vue'
import { diagnoseImage } from '@/api/multimodal'
import { handleError } from '@/utils/error'

const tempFiles = ref([])
const diagnosing = ref(false)
const diagnosisResult = ref(null)

function chooseImages() {
  uni.chooseImage({
    count: 4 - tempFiles.value.length,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: (res) => {
      tempFiles.value = [...tempFiles.value, ...res.tempFilePaths]
    }
  })
}

function removeImage(index) {
  tempFiles.value.splice(index, 1)
}

async function startDiagnose() {
  if (!tempFiles.value.length || diagnosing.value) return

  diagnosing.value = true
  diagnosisResult.value = null

  try {
    const result = await diagnoseImage(tempFiles.value[0])
    diagnosisResult.value = result
  } catch (err) {
    handleError(err, { fallbackMsg: '诊断失败' })
  } finally {
    diagnosing.value = false
  }
}
</script>

<style scoped>
.diagnose-page {
  min-height: 100vh;
  background: #FDF8F3;
}
.diagnose-scroll {
  padding: 0 16px;
  height: calc(100vh - 44px);
}

/* 上传区域 */
.upload-area {
  margin: 16px 0;
}
.upload-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px;
  background: #fff;
  border-radius: 16px;
  border: 2px dashed #E8E0D4;
  transition: border-color 0.2s;
}
.upload-box:active {
  border-color: #2D7A4A;
  background: #F8F6F2;
}
.upload-icon {
  font-size: 48px;
  margin-bottom: 12px;
}
.upload-title {
  font-size: 16px;
  font-weight: 600;
  color: #2C1810;
  margin-bottom: 6px;
}
.upload-desc {
  font-size: 13px;
  color: #8B7355;
  margin-bottom: 4px;
}
.upload-hint {
  font-size: 12px;
  color: #C4A882;
}

/* 预览 */
.preview-list {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}
.preview-item {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  border-radius: 12px;
  overflow: hidden;
  background: #f0ece4;
}
.preview-img {
  width: 100%;
  height: 100%;
}
.preview-del {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 20px;
  height: 20px;
  background: rgba(0,0,0,0.5);
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}
.preview-add {
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px dashed #E8E0D4;
  background: #F8F6F2;
}
.add-icon {
  font-size: 28px;
  color: #C4A882;
}
.upload-count {
  display: block;
  text-align: center;
  font-size: 12px;
  color: #8B7355;
  margin-top: 8px;
}

/* 诊断按钮 */
.diagnose-btn {
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
.diagnose-btn[disabled] {
  opacity: 0.5;
  box-shadow: none;
}

/* 结果 */
.results {
  margin-bottom: 20px;
}
.result-header {
  margin-bottom: 12px;
}
.result-title {
  font-size: 16px;
  font-weight: 700;
  color: #1A4A2E;
}
.result-summary {
  background: #F0F9F1;
  border-radius: 12px;
  padding: 14px;
  margin-bottom: 12px;
}
.summary-text {
  font-size: 13px;
  color: #1A4A2E;
  line-height: 1.6;
}
.bottom-safe {
  height: 30px;
}
</style>
