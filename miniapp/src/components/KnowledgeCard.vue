<template>
  <view class="knowledge-card" @tap="onTap" hover-class="knowledge-card-hover">
    <view class="card-top">
      <text class="card-icon">{{ icon }}</text>
      <view class="card-info">
        <text class="card-title">{{ item.title }}</text>
        <text class="card-summary">{{ item.content }}</text>
      </view>
    </view>
    <view class="card-bottom">
      <text class="card-category" :style="{ background: catBg }">{{ categoryLabel }}</text>
      <text class="card-reads">阅读 {{ reads }}次</text>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'
import { KNOWLEDGE_CATEGORIES } from '@/utils/constants'

const props = defineProps({
  item: { type: Object, required: true }
})

const emit = defineEmits(['tap'])

const categoryLabel = computed(() => {
  const cat = KNOWLEDGE_CATEGORIES.find(c => c.value === props.item.category)
  return cat ? cat.label : '🌾 农业'
})

const icon = computed(() => {
  const cat = KNOWLEDGE_CATEGORIES.find(c => c.value === props.item.category)
  return cat ? cat.icon : '📚'
})

const catBg = computed(() => {
  const map = { rice: '#E8F5E9', citrus: '#FEF3C7', tea: '#E0F2FE', livestock: '#FCE7F3' }
  return map[props.item.category] || '#F5EDE0'
})

const reads = computed(() => {
  return Math.floor(Math.random() * 2000) + 100
})

function onTap() {
  emit('tap', props.item)
}
</script>

<style scoped>
.knowledge-card {
  background: #fff;
  border-radius: 14px;
  padding: 14px;
  margin-bottom: 10px;
  box-shadow: 0 1px 4px rgba(26, 74, 46, 0.04);
  transition: all 0.2s;
}
.knowledge-card-hover {
  transform: scale(0.98);
  opacity: 0.9;
}
.card-top {
  display: flex;
  gap: 10px;
}
.card-icon {
  font-size: 28px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #F8F6F2;
  border-radius: 10px;
  flex-shrink: 0;
}
.card-info {
  flex: 1;
  min-width: 0;
}
.card-title {
  font-size: 15px;
  font-weight: 600;
  color: #2C1810;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.card-summary {
  font-size: 13px;
  color: #8B7355;
  margin-top: 4px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.5;
}
.card-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px solid #F5EDE0;
}
.card-category {
  font-size: 11px;
  padding: 2px 10px;
  border-radius: 20px;
  color: #5C4033;
}
.card-reads {
  font-size: 11px;
  color: #C4A882;
}
</style>
