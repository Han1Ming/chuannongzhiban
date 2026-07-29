<template>
  <view class="farm-match-page">
    <NavBar title="作物匹配" :show-back="true" />

    <scroll-view class="match-scroll" scroll-y>
      <!-- 选择参数 -->
      <view class="picker-card">
        <view class="picker-row">
          <text class="picker-label">📍 地区</text>
          <picker class="picker-value" :range="regions" @change="onRegionChange">
            <text :class="{ placeholder: !selectedRegion }">{{ selectedRegion || '请选择地区' }}</text>
            <text class="picker-arrow">›</text>
          </picker>
        </view>
        <view class="picker-row">
          <text class="picker-label">🌱 农事类型</text>
          <picker class="picker-value" :range="farmingTypes" @change="onFarmingTypeChange">
            <text :class="{ placeholder: !selectedFarmingType }">{{ selectedFarmingType || '请选择类型' }}</text>
            <text class="picker-arrow">›</text>
          </picker>
        </view>
        <view class="picker-row">
          <text class="picker-label">🍂 季节</text>
          <picker class="picker-value" :range="seasons" @change="onSeasonChange">
            <text :class="{ placeholder: !selectedSeason }">{{ selectedSeason || '请选择季节' }}</text>
            <text class="picker-arrow">›</text>
          </picker>
        </view>
      </view>

      <button class="match-btn" :disabled="!selectedRegion || !selectedSeason" @tap="startMatch">
        🌱 开始匹配
      </button>

      <!-- 匹配中 -->
      <view class="matching" v-if="matching">
        <view class="matching-dots">
          <view class="dot dot-1" />
          <view class="dot dot-2" />
          <view class="dot dot-3" />
        </view>
        <text class="matching-text">AI 智能匹配中...</text>
      </view>

      <!-- 结果 -->
      <view class="result-card" v-if="matchResult">
        <view class="result-header">
          <text class="result-icon">🌾</text>
          <text class="result-title">推荐方案</text>
        </view>
        <view class="result-crop">
          <text class="crop-label">推荐种植</text>
          <text class="crop-name">{{ matchResult.crop }}</text>
        </view>
        <view class="result-plan">
          <text class="plan-text">{{ matchResult.plan }}</text>
        </view>
      </view>

      <view class="bottom-safe" />
    </scroll-view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import NavBar from '@/components/NavBar.vue'
import { REGIONS, FARMING_TYPES, SEASONS } from '@/utils/constants'
import { matchRecommendation } from '@/api/farm'
import { handleError } from '@/utils/error'

const regions = REGIONS
const farmingTypes = FARMING_TYPES
const seasons = SEASONS

const selectedRegion = ref('')
const selectedFarmingType = ref('种植')
const selectedSeason = ref('')
const matching = ref(false)
const matchResult = ref(null)

function onRegionChange(e) {
  selectedRegion.value = regions[e.detail.value]
}

function onFarmingTypeChange(e) {
  selectedFarmingType.value = farmingTypes[e.detail.value]
}

function onSeasonChange(e) {
  selectedSeason.value = seasons[e.detail.value]
}

async function startMatch() {
  matching.value = true
  matchResult.value = null

  try {
    const result = await matchRecommendation(
      selectedRegion.value,
      selectedFarmingType.value,
      selectedSeason.value
    )
    if (result) {
      matchResult.value = result  // 后端返回 {crop, plan}
    } else {
      uni.showToast({ title: '暂无匹配方案', icon: 'none' })
    }
  } catch (err) {
    handleError(err, { fallbackMsg: '匹配失败' })
  } finally {
    matching.value = false
  }
}
</script>

<style scoped>
.farm-match-page {
  min-height: 100vh;
  background: #FDF8F3;
}
.match-scroll {
  padding: 0 16px;
  height: calc(100vh - 44px);
}

/* 选择器卡片 */
.picker-card {
  background: #fff;
  border-radius: 16px;
  padding: 8px 20px;
  margin: 16px 0;
  box-shadow: 0 2px 12px rgba(26, 74, 46, 0.04);
}
.picker-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0;
  border-bottom: 1px solid #F5EDE0;
}
.picker-row:last-child {
  border-bottom: none;
}
.picker-label {
  font-size: 15px;
  color: #2C1810;
  font-weight: 500;
}
.picker-value {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 15px;
  color: #2D7A4A;
  font-weight: 500;
}
.picker-value .placeholder {
  color: #C4A882;
}
.picker-arrow {
  font-size: 18px;
  color: #C4A882;
}

.match-btn {
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
.match-btn[disabled] {
  opacity: 0.5;
  box-shadow: none;
}

/* 匹配中 */
.matching {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 0;
}
.matching-dots {
  display: flex;
  gap: 6px;
  margin-bottom: 16px;
}
.matching-dots .dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #2D7A4A;
  animation: dotPulse 1.4s infinite;
}
.matching-dots .dot-1 { animation-delay: 0s; }
.matching-dots .dot-2 { animation-delay: 0.2s; }
.matching-dots .dot-3 { animation-delay: 0.4s; }
@keyframes dotPulse {
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
  40% { transform: scale(1); opacity: 1; }
}
.matching-text {
  font-size: 14px;
  color: #8B7355;
}

/* 结果 */
.result-card {
  background: #fff;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(26, 74, 46, 0.06);
  margin-bottom: 20px;
}
.result-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #E8F5E9;
}
.result-icon {
  font-size: 24px;
}
.result-title {
  font-size: 16px;
  font-weight: 700;
  color: #1A4A2E;
}
.result-crop {
  text-align: center;
  padding: 16px 0;
  background: #F0F9F1;
  border-radius: 12px;
  margin-bottom: 16px;
}
.crop-label {
  font-size: 13px;
  color: #8B7355;
  display: block;
  margin-bottom: 6px;
}
.crop-name {
  font-size: 22px;
  font-weight: 700;
  color: #2D7A4A;
}
.result-plan {
  background: #F8F6F2;
  border-radius: 12px;
  padding: 14px;
}
.plan-text {
  font-size: 14px;
  color: #5C4033;
  line-height: 1.7;
}
.bottom-safe {
  height: 30px;
}
</style>
