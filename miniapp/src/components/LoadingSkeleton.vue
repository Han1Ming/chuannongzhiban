<template>
  <view class="skeleton-list">
    <view class="skeleton-item" v-for="i in count" :key="i">
      <view class="skeleton-img skeleton-anim" v-if="type === 'card'" />
      <view class="skeleton-content">
        <view class="skeleton-line w-70 skeleton-anim" />
        <view class="skeleton-line w-90 skeleton-anim" />
        <view class="skeleton-line w-40 skeleton-anim" v-if="type !== 'text-only'" />
      </view>
    </view>
  </view>
</template>

<script setup>
defineProps({
  count: { type: Number, default: 3 },
  type: { type: String, default: 'card' } // card, text-only, list
})
</script>

<style scoped>
.skeleton-list {
  padding: 4px 0;
}
.skeleton-item {
  display: flex;
  gap: 12px;
  padding: 14px 0;
  border-bottom: 1px solid rgba(232, 224, 212, 0.3);
}
.skeleton-img {
  width: 100px;
  height: 75px;
  border-radius: 8px;
  background: #F0ECE4;
  flex-shrink: 0;
}
.skeleton-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.skeleton-line {
  height: 14px;
  border-radius: 7px;
  background: #F0ECE4;
}
.w-70 { width: 70%; }
.w-90 { width: 90%; }
.w-40 { width: 40%; }
.w-60 { width: 60%; }

.skeleton-anim {
  background: linear-gradient(90deg, #F0ECE4 25%, #F8F6F2 50%, #F0ECE4 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>
