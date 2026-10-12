<template>
  <view class="reasoning-panel">
    <!-- 折叠头：默认收起，推理链信息量大，展开会淹没回答正文 -->
    <view class="panel-head" @tap="toggle">
      <text class="head-icon">🧠</text>
      <text class="head-title">推理链</text>
      <text class="head-count" v-if="hasAny">{{ sectionCount }} 项依据</text>
      <text class="head-arrow" :class="{ open: expanded }">▾</text>
    </view>

    <view class="panel-body" v-if="expanded">
      <view class="chain-group" v-if="hasAny">
        <view class="section" v-if="chain.symptoms.length">
          <text class="section-title">👁 观察症状</text>
          <view class="item" v-for="(s, i) in chain.symptoms" :key="'s' + i">
            <text class="item-dot">·</text>
            <text class="item-text">{{ s }}</text>
          </view>
        </view>

        <view class="section" v-if="chain.environment.length">
          <text class="section-title">🌦 环境条件</text>
          <view class="item" v-for="(s, i) in chain.environment" :key="'e' + i">
            <text class="item-dot">·</text>
            <text class="item-text">{{ s }}</text>
          </view>
        </view>

        <view class="section" v-if="chain.knowledge_match.length">
          <text class="section-title">📚 知识匹配</text>
          <view class="item" v-for="(s, i) in chain.knowledge_match" :key="'k' + i">
            <text class="item-dot">·</text>
            <text class="item-text">{{ s }}</text>
          </view>
        </view>

        <view class="section" v-if="chain.excluded.length">
          <text class="section-title">🚫 排除项</text>
          <view class="item" v-for="(s, i) in chain.excluded" :key="'x' + i">
            <text class="item-dot excluded">·</text>
            <text class="item-text excluded">{{ s }}</text>
          </view>
        </view>

        <view class="conclusion" v-if="chain.conclusion">
          <text class="conclusion-label">结论</text>
          <text class="conclusion-text">{{ chain.conclusion }}</text>
        </view>
      </view>

      <text class="empty-text" v-else>暂无推理链记录</text>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  // normalizeReasoningChain 结果，可能为 null
  chain: { type: Object, default: null },
  defaultExpanded: { type: Boolean, default: false }
})

const expanded = ref(props.defaultExpanded)

const chain = computed(() => {
  const c = props.chain || {}
  return {
    symptoms: Array.isArray(c.symptoms) ? c.symptoms : [],
    environment: Array.isArray(c.environment) ? c.environment : [],
    knowledge_match: Array.isArray(c.knowledge_match) ? c.knowledge_match : [],
    excluded: Array.isArray(c.excluded) ? c.excluded : [],
    conclusion: c.conclusion || ''
  }
})

// 有任意分区有内容才认为「有数据」，否则显示空态
const hasAny = computed(() =>
  chain.value.symptoms.length > 0 ||
  chain.value.environment.length > 0 ||
  chain.value.knowledge_match.length > 0 ||
  chain.value.excluded.length > 0 ||
  !!chain.value.conclusion
)

const sectionCount = computed(() =>
  chain.value.symptoms.length + chain.value.environment.length +
  chain.value.knowledge_match.length + chain.value.excluded.length
)

function toggle() { expanded.value = !expanded.value }
</script>

<style scoped>
.reasoning-panel {
  background: #FDF8F3;
  border: 1rpx solid #E8E0D4;
  border-radius: 12rpx;
  margin-top: 12rpx;
  overflow: hidden;
}
.panel-head {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 16rpx;
}
.panel-head:active {
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
.panel-body {
  padding: 0 16rpx 16rpx;
  border-top: 1rpx solid #E8E0D4;
  padding-top: 12rpx;
}
.section {
  margin-bottom: 14rpx;
}
.section-title {
  font-size: 22rpx;
  font-weight: 600;
  color: #2D7A4A;
  display: block;
  margin-bottom: 6rpx;
}
.item {
  display: flex;
  gap: 6rpx;
  margin-bottom: 4rpx;
}
.item-dot {
  font-size: 24rpx;
  color: #C4A882;
  line-height: 1.5;
}
.item-dot.excluded {
  color: #DC2626;
}
.item-text {
  flex: 1;
  font-size: 23rpx;
  color: #2C1810;
  line-height: 1.6;
}
.item-text.excluded {
  color: #8B7355;
}
.conclusion {
  background: #F0F9F1;
  border-radius: 8rpx;
  padding: 12rpx;
  margin-top: 4rpx;
}
.conclusion-label {
  font-size: 20rpx;
  color: #2D7A4A;
  font-weight: 600;
  display: block;
  margin-bottom: 4rpx;
}
.conclusion-text {
  font-size: 23rpx;
  color: #1A4A2E;
  line-height: 1.6;
}
.empty-text {
  font-size: 23rpx;
  color: #8B7355;
}
</style>
