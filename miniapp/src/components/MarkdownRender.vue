<template>
  <view class="markdown-render">
    <rich-text v-if="formattedContent" :nodes="formattedContent" />
    <text v-else class="empty-text">{{ content || '暂无内容' }}</text>
  </view>
</template>

<script setup>
import { computed } from 'vue'
import { mdToHtml } from '@/utils/markdown'

const props = defineProps({
  content: { type: String, default: '' }
})

const formattedContent = computed(() => mdToHtml(props.content))
</script>

<style scoped>
.markdown-render { width: 100%; line-height: 1.6; }
.empty-text { font-size: 14px; color: #C4A882; }
</style>
