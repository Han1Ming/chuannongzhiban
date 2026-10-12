<template>
  <view class="markdown-render">
    <rich-text v-if="formattedContent" :nodes="formattedContent" />
    <text v-else class="empty-text">{{ content || '暂无内容' }}</text>
  </view>
</template>

<script setup>
import { computed } from 'vue'
import { mdToHtml } from '@/utils/markdown'
import { stripRetrievalContainer } from '@/utils/aiTypes'

const props = defineProps({
  content: { type: String, default: '' },
  /**
   * 是否摘掉正文末尾的「检索来源」折叠容器。
   * 有结构化检索通道的消息由 SourceList 组件（可收缩、带匹配度/链接）呈现源文字，
   * 正文里再展平一份就是同一屏展示两遍——而小程序无法折叠，重复尤其刺眼。
   * 流式阶段还没有 payload，保持 false，正文里那份兜底可见。
   */
  stripSources: { type: Boolean, default: false }
})

const formattedContent = computed(() => {
  const text = props.stripSources ? stripRetrievalContainer(props.content) : props.content
  return mdToHtml(text)
})
</script>

<style scoped>
.markdown-render { width: 100%; line-height: 1.6; }
.empty-text { font-size: 14px; color: #C4A882; }
</style>
