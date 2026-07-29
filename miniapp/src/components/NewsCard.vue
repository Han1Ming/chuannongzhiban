<template>
  <view class="news-card" @tap="onTap" hover-class="news-card-hover">
    <image class="news-image" src="/static/images/default-news.jpg" mode="aspectFill" v-if="showImage" />
    <view class="news-content" :class="{ 'no-image': !showImage }">
      <text class="news-title">{{ item.title }}</text>
      <text class="news-desc" v-if="item.description">{{ item.description }}</text>
      <view class="news-meta">
        <text class="news-source">{{ item.source || '农业资讯' }}</text>
        <text class="news-time">{{ formatTime(item.ctime) }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { relativeTime } from '@/utils/format'

const props = defineProps({
  item: { type: Object, required: true },
  showImage: { type: Boolean, default: true }
})

const emit = defineEmits(['tap'])

function formatTime(time) {
  return relativeTime(time)
}

function onTap() {
  emit('tap', props.item)
}
</script>

<style scoped>
.news-card {
  display: flex;
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  padding: 12px;
  box-shadow: 0 1px 4px rgba(26, 74, 46, 0.04);
  margin-bottom: 8px;
  transition: all 0.2s;
}
.news-card-hover {
  transform: scale(0.98);
  opacity: 0.9;
}
.news-image {
  width: 100px;
  height: 75px;
  border-radius: 8px;
  margin-right: 12px;
  flex-shrink: 0;
  background: #F5EDE0;
}
.news-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.news-content.no-image {
  margin-left: 0;
}
.news-title {
  font-size: 14px;
  font-weight: 600;
  color: #2C1810;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.news-desc {
  font-size: 12px;
  color: #8B7355;
  margin-top: 4px;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.news-meta {
  display: flex;
  align-items: center;
  margin-top: 6px;
  gap: 8px;
}
.news-source {
  font-size: 11px;
  color: #C4A882;
}
.news-time {
  font-size: 11px;
  color: #8B7355;
}
</style>
