<template>
  <view class="low-guide">
    <view class="guide-head">
      <text class="guide-icon">🔍</text>
      <text class="guide-title">信息不足，暂不提供处方</text>
    </view>

    <!-- 明确告诉用户为什么没有处方，避免被理解为系统故障 -->
    <text class="guide-reason">{{ reason }}</text>

    <view class="suggest-box" v-if="suggestions.length">
      <text class="suggest-title">建议补充</text>
      <view class="suggest-item" v-for="(s, i) in suggestions" :key="i">
        <text class="suggest-num">{{ i + 1 }}</text>
        <text class="suggest-text">{{ s }}</text>
      </view>
    </view>

    <button class="retake-btn" @tap="onRetake">
      <text class="retake-text">📷 补充照片</text>
    </button>

    <view class="station-box" v-if="tip">
      <text class="station-text">🏛 {{ tip }}</text>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'
import { DEFAULT_LOW_CONFIDENCE_GUIDE } from '@/utils/aiTypes'

const props = defineProps({
  // normalizeNeedMoreInfo 结果；为空时用后端同款默认文案兜底
  guide: { type: Object, default: null }
})

const emit = defineEmits(['retake'])

const reason = computed(() => props.guide?.reason || DEFAULT_LOW_CONFIDENCE_GUIDE.reason)
const suggestions = computed(() => {
  const list = props.guide?.suggestions
  return Array.isArray(list) && list.length ? list : DEFAULT_LOW_CONFIDENCE_GUIDE.suggestions
})
const tip = computed(() => props.guide?.agri_station_tip || DEFAULT_LOW_CONFIDENCE_GUIDE.agri_station_tip)

/**
 * 只负责选图，不做上传：上传流程由父页面复用现有的 chooseImages/startDiagnose，
 * 组件里重写一套会造成两份上传逻辑分叉。
 */
function onRetake() {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: (res) => {
      const path = res.tempFilePaths && res.tempFilePaths[0]
      if (path) emit('retake', path)
    }
  })
}
</script>

<style scoped>
.low-guide {
  background: #FDF3E3;
  border: 1rpx solid #F3D9AE;
  border-radius: 12rpx;
  padding: 16rpx;
  margin-top: 12rpx;
}
.guide-head {
  display: flex;
  align-items: center;
  gap: 8rpx;
  margin-bottom: 8rpx;
}
.guide-icon { font-size: 24rpx; }
.guide-title {
  font-size: 24rpx;
  font-weight: 700;
  color: #E6A23C;
  flex: 1;
}
.guide-reason {
  display: block;
  font-size: 22rpx;
  color: #5C4033;
  line-height: 1.6;
}
.suggest-box {
  background: #fff;
  border-radius: 10rpx;
  padding: 12rpx;
  margin-top: 10rpx;
}
.suggest-title {
  font-size: 21rpx;
  font-weight: 600;
  color: #8B7355;
  display: block;
  margin-bottom: 6rpx;
}
.suggest-item {
  display: flex;
  gap: 8rpx;
  margin-bottom: 6rpx;
}
.suggest-item:last-child {
  margin-bottom: 0;
}
.suggest-num {
  width: 28rpx;
  height: 28rpx;
  border-radius: 50%;
  background: #E8F5E9;
  color: #2D7A4A;
  font-size: 18rpx;
  text-align: center;
  line-height: 28rpx;
  flex-shrink: 0;
}
.suggest-text {
  flex: 1;
  font-size: 22rpx;
  color: #2C1810;
  line-height: 1.6;
}
.retake-btn {
  margin-top: 12rpx;
  background: linear-gradient(135deg, #2D7A4A, #1A4A2E);
  border-radius: 10rpx;
  padding: 0;
  height: 76rpx;
  line-height: 76rpx;
  border: none;
}
.retake-text {
  font-size: 26rpx;
  color: #fff;
  font-weight: 600;
}
.station-box {
  margin-top: 10rpx;
}
.station-text {
  font-size: 21rpx;
  color: #8B7355;
  line-height: 1.6;
}
</style>
