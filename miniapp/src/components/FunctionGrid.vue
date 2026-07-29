<template>
  <view class="func-grid">
    <view
      class="func-item"
      v-for="item in items"
      :key="item.key"
      @tap="onTap(item)"
      hover-class="func-item-hover"
    >
      <view class="func-icon-wrap" :style="{ background: item.bgColor || '#E8F5E9' }">
        <text class="func-icon">{{ item.icon }}</text>
      </view>
      <text class="func-label">{{ item.label }}</text>
      <text class="func-desc">{{ item.desc }}</text>
    </view>
  </view>
</template>

<script setup>
const props = defineProps({
  items: { type: Array, default: () => [] },
  columns: { type: Number, default: 4 }
})

const emit = defineEmits(['tap'])

function onTap(item) {
  // 只通过 emit 通知父组件，由父组件统一处理导航
  emit('tap', item)
}
</script>

<style scoped>
.func-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  padding: 0 4px;
}
.func-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 4px;
  border-radius: 12px;
  transition: all 0.2s ease;
}
.func-item-hover {
  transform: scale(0.95);
  opacity: 0.8;
}
.func-icon-wrap {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 6px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}
.func-icon {
  font-size: 24px;
}
.func-label {
  font-size: 12px;
  font-weight: 600;
  color: #2C1810;
  margin-bottom: 2px;
}
.func-desc {
  font-size: 10px;
  color: #8B7355;
}
</style>
