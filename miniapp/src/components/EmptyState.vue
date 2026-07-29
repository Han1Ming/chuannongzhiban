<template>
  <view class="empty-state">
    <text class="empty-icon">{{ icon }}</text>
    <text class="empty-title">{{ title }}</text>
    <text class="empty-desc" v-if="desc">{{ desc }}</text>
    <view class="empty-action" v-if="actionText" @tap="$emit('action')">
      <text class="action-btn">{{ actionText }}</text>
    </view>
  </view>
</template>

<script setup>
defineProps({
  icon: { type: String, default: '📭' },
  title: { type: String, default: '暂无内容' },
  desc: { type: String, default: '' },
  actionText: { type: String, default: '' }
})

defineEmits(['action'])
</script>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
}
.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.6;
}
.empty-title {
  font-size: 15px;
  font-weight: 600;
  color: #8B7355;
  margin-bottom: 6px;
}
.empty-desc {
  font-size: 13px;
  color: #C4A882;
  text-align: center;
  line-height: 1.5;
}
.empty-action {
  margin-top: 20px;
}
.action-btn {
  font-size: 14px;
  color: #2D7A4A;
  background: #E8F5E9;
  padding: 10px 24px;
  border-radius: 20px;
  font-weight: 500;
}
</style>
