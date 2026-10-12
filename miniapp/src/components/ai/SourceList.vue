<template>
  <view class="source-list">
    <!--
      检索来源（需求：在最终答案下方以可收缩容器展示**三种检索方式**的源文字）。

      小程序端为什么必须用组件而不是靠 Markdown 的 <details>：
      微信 rich-text 不认 <details>，后端答案里的折叠容器会被
      utils/markdown.js 展平（只能展平、不能交互），所以"可收缩"这件事
      只能由组件来做。三路通道分 section，每路自带状态。
    -->
    <view class="list-head" @tap="toggle">
      <text class="head-icon">🔗</text>
      <text class="head-title">{{ title }}</text>
      <text class="head-count">{{ headSummary }}</text>
      <text class="head-arrow" :class="{ open: expanded }">▾</text>
    </view>

    <view class="list-body" v-if="expanded">
      <!-- ============ 三路通道分 section ============ -->
      <block v-if="channels.length">
        <view class="channel" v-for="c in channels" :key="c.key">
          <view class="channel-head">
            <text class="channel-icon">{{ c.icon }}</text>
            <text class="channel-label">{{ c.label }}</text>
            <text class="channel-count" :style="{ color: c.color, background: c.bg }">{{ c.count }} 条</text>
            <text class="channel-status" v-if="!c.count">{{ c.status_label }}</text>
          </view>
          <!-- 空通道也给一行说明：不写农户会以为这一路被漏掉了 -->
          <text class="channel-empty" v-if="!c.count">
            {{ c.error ? '该通道调用失败：' + c.error : (c.detail || '本次未从该通道取到可用内容。') }}
          </text>

          <view class="source-item" v-for="(s, i) in c.items" :key="c.key + '-' + i" @tap="toggleItem(c.key + '-' + i)">
            <view class="item-head">
              <text class="type-tag" :style="{ color: c.color, background: c.bg }">{{ s.source_type_label }}</text>
              <text class="item-title">{{ s.title || s.doc_id || '未命名依据' }}</text>
            </view>

            <!-- 匹配度：优先 similarity；只有 score 时必须注明是「距离」口径，避免误读 -->
            <view class="item-meta">
              <text class="match-text" v-if="rateOf(s).text">匹配度 {{ rateOf(s).text }}</text>
              <text class="match-note" v-if="rateOf(s).note">{{ rateOf(s).note }}</text>
              <text class="meta-text" v-if="s.provider">{{ s.provider }}</text>
              <text class="meta-text" v-if="s.category">{{ s.category }}</text>
            </view>

            <!-- 源文字：需求要展示的「检索到的源文字」，收起时夹 3 行 -->
            <text class="src-text" :class="{ clamped: openedKey !== c.key + '-' + i }" v-if="s.source_text">
              {{ s.source_text }}
            </text>

            <view class="item-actions">
              <text class="src-act" v-if="s.source_text && s.source_text.length > 40">
                {{ openedKey === c.key + '-' + i ? '收起原文' : '展开原文' }}
              </text>
              <text class="src-act src-act-link" v-if="s.url" @tap.stop="openUrl(s.url)">查看原文 ↗</text>
            </view>
          </view>
        </view>
      </block>

      <!-- ============ 无分组通道：退回扁平列表（历史消息兼容） ============ -->
      <view class="source-item" v-else v-for="(s, i) in sources" :key="i" @tap="toggleItem('f' + i)">
        <view class="item-head">
          <text class="type-tag">{{ sourceTypeLabel(s.source_type) }}</text>
          <text class="item-title">{{ s.title || s.source_id || '未命名依据' }}</text>
        </view>

        <view class="item-meta">
          <text class="match-text" v-if="rateOf(s).text">匹配度 {{ rateOf(s).text }}</text>
          <text class="match-note" v-if="rateOf(s).note">{{ rateOf(s).note }}</text>
          <text class="meta-text" v-if="s.category">{{ s.category }}</text>
          <text class="meta-text" v-if="s.source_id">{{ s.source_id }}</text>
        </view>

        <text class="src-text clamped" v-if="s.excerpt && openedKey !== 'f' + i">{{ s.excerpt }}</text>
        <text class="src-text" v-else-if="s.excerpt">{{ s.excerpt }}</text>
        <text class="excerpt-hint" v-else-if="!s.excerpt">无原文节选</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { sourceTypeLabel, matchRateText } from '@/utils/aiTypes'

const props = defineProps({
  // normalizeSources 结果（历史消息兼容路径）
  sources: { type: Array, default: () => [] },
  // normalizeRetrievalChannels 结果（三路分组，优先）
  channels: { type: Array, default: () => [] },
  title: { type: String, default: '检索来源' },
  defaultExpanded: { type: Boolean, default: false }
})

const list = computed(() => (Array.isArray(props.sources) ? props.sources : []))
const channels = computed(() => (Array.isArray(props.channels) ? props.channels : []))
const expanded = ref(props.defaultExpanded)
// 同时只展开一条源文字，避免面板被撑得过长
const openedKey = ref('')

// 胶囊右侧概览：一眼看出三种检索各查到几条
const headSummary = computed(() => {
  if (channels.value.length) {
    return channels.value.map((c) => `${c.label}${c.count}`).join(' / ')
  }
  return `${list.value.length} 条`
})

function toggle() { expanded.value = !expanded.value }
function toggleItem(key) {
  openedKey.value = openedKey.value === key ? '' : key
}
function rateOf(item) { return matchRateText(item) }
function openUrl(url) {
  // 联网来源才带 url；小程序里复制链接比直接跳转更稳（外部域名需配置业务域名）
  uni.setClipboardData({
    data: url,
    success: () => uni.showToast({ title: '链接已复制', icon: 'none' })
  })
}
</script>

<style scoped>
.source-list {
  background: #FDF8F3;
  border: 1rpx solid #E8E0D4;
  border-radius: 12rpx;
  margin-top: 12rpx;
  overflow: hidden;
}
.list-head {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 16rpx;
}
.list-head:active {
  background: #F5EDE0;
}
.head-icon { font-size: 24rpx; }
.head-title {
  font-size: 24rpx;
  font-weight: 600;
  color: #5C4033;
}
.head-count {
  font-size: 20rpx;
  color: #8B7355;
  flex: 1;
}
.head-arrow {
  font-size: 22rpx;
  color: #8B7355;
  transition: transform 0.2s;
}
.head-arrow.open {
  transform: rotate(180deg);
}
.list-body {
  padding: 0 16rpx 8rpx;
  border-top: 1rpx solid #E8E0D4;
}

/* 通道分节：每一路一块，块之间用虚线分隔，视觉上区分「三种检索方式」 */
.channel + .channel {
  margin-top: 12rpx;
  padding-top: 12rpx;
  border-top: 1rpx dashed #E8E0D4;
}
.channel-head {
  display: flex;
  align-items: center;
  gap: 8rpx;
  margin-bottom: 6rpx;
}
.channel-icon { font-size: 22rpx; }
.channel-label {
  font-size: 23rpx;
  font-weight: 700;
  color: #5C4033;
}
.channel-count {
  font-size: 18rpx;
  line-height: 1.6;
  padding: 2rpx 8rpx;
  border-radius: 6rpx;
}
.channel-status {
  font-size: 18rpx;
  color: #C4A882;
}
.channel-empty {
  display: block;
  font-size: 21rpx;
  line-height: 1.6;
  color: #A08A6D;
  padding: 4rpx 0 8rpx;
}

.source-item {
  padding: 12rpx 0;
  border-bottom: 1rpx solid #F0ECE4;
}
.source-item:last-child {
  border-bottom: none;
}
.item-head {
  display: flex;
  align-items: flex-start;
  gap: 8rpx;
}
.type-tag {
  font-size: 18rpx;
  color: #2D7A4A;
  background: #E8F5E9;
  border-radius: 6rpx;
  padding: 2rpx 8rpx;
  flex-shrink: 0;
  line-height: 1.6;
}
.item-title {
  flex: 1;
  font-size: 23rpx;
  color: #2C1810;
  line-height: 1.5;
}
.item-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10rpx;
  margin-top: 6rpx;
}
.match-text {
  font-size: 20rpx;
  color: #2D7A4A;
  font-weight: 600;
}
.match-note {
  font-size: 18rpx;
  color: #8B7355;
}
.meta-text {
  font-size: 18rpx;
  color: #C4A882;
}

/* 源文字：需求要展示的「检索到的源文字」 */
.src-text {
  display: block;
  background: #fff;
  border-radius: 8rpx;
  padding: 10rpx 12rpx;
  margin-top: 8rpx;
  font-size: 22rpx;
  color: #5C4033;
  line-height: 1.6;
  word-break: break-all;
}
/* 收起时夹 3 行：小程序里多行截断用 -webkit-line-clamp */
.src-text.clamped {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.item-actions {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-top: 8rpx;
}
.src-act {
  font-size: 19rpx;
  color: #2D7A4A;
  padding: 2rpx 12rpx;
  border: 1rpx solid rgba(45, 122, 74, 0.25);
  border-radius: 999rpx;
  background: #fff;
}
.src-act-link {
  color: #6D28D9;
  border-color: rgba(109, 40, 217, 0.25);
}
.excerpt-hint {
  display: block;
  font-size: 20rpx;
  color: #C4A882;
  margin-top: 6rpx;
}
</style>
