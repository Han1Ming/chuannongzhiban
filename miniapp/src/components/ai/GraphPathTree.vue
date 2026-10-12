<template>
  <view class="graph-tree">
    <view class="tree-head">
      <text class="head-icon">🕸</text>
      <text class="head-title">知识图谱路径</text>
      <text class="head-count" v-if="paths.length">{{ paths.length }} 条</text>
    </view>

    <!-- 空态：GraphRAG 双通道下图谱可能未命中，向量检索依据仍在，文案要说明而不是报错 -->
    <view class="empty-box" v-if="!paths.length">
      <text class="empty-text">本次未命中知识图谱路径，以下为向量检索依据</text>
    </view>

    <view class="paths-group" v-else>
      <!-- 多路径切换：横向滚动 pill，避免窄屏换行挤压 -->
      <scroll-view class="path-tabs" scroll-x v-if="paths.length > 1">
        <view class="tab-row">
          <view
            class="path-tab"
            v-for="(p, i) in paths"
            :key="i"
            :class="{ active: i === activeIndex }"
            @tap="activeIndex = i"
          >
            <text class="tab-text">路径 {{ i + 1 }}</text>
          </view>
        </view>
      </scroll-view>

      <view class="path-query" v-if="activePath.query">
        <text class="query-text">查询：{{ activePath.query }}</text>
      </view>

      <!-- 横向节点 + 关系箭头：小程序无法承载 echarts，用横向 scroll-view 表达链路 -->
      <scroll-view class="node-scroll" scroll-x>
        <view class="node-row">
          <template v-for="(n, i) in activeNodes" :key="i">
            <view class="node-chip" :style="{ borderColor: nodeColor(n.type) }">
              <text class="node-name" :style="{ color: nodeColor(n.type) }">{{ n.name }}</text>
              <text class="node-type" v-if="n.type" :style="{ background: nodeColor(n.type) }">{{ nodeLabel(n.type) }}</text>
            </view>
            <view class="rel-arrow" v-if="i < activeNodes.length - 1">
              <text class="rel-text">{{ relationLabel(activeRels[i]) || '关联' }}</text>
              <text class="rel-line">→</text>
            </view>
          </template>
        </view>
      </scroll-view>

      <text class="path-source" v-if="activePath.source">来源：{{ activePath.source === 'kg' ? '知识图谱' : activePath.source }}</text>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { nodeColor, nodeLabel, relationLabel } from '@/utils/aiTypes'

const props = defineProps({
  // normalizeGraphPaths 结果
  paths: { type: Array, default: () => [] }
})

const list = computed(() => (Array.isArray(props.paths) ? props.paths : []))
const activeIndex = ref(0)

// 路径条数变化（切换会话/重新提问）时回到第一条，避免索引越界
watch(() => list.value.length, () => { activeIndex.value = 0 })

const activePath = computed(() => list.value[activeIndex.value] || {})

// 优先用 nodes（带 type，可配色），退化到 path 字符串数组
const activeNodes = computed(() => {
  const p = activePath.value
  if (Array.isArray(p.nodes) && p.nodes.length) {
    return p.nodes.map(n => ({ name: n.name, type: n.type || '' }))
  }
  return (Array.isArray(p.path) ? p.path : []).map(name => ({ name, type: '' }))
})

const activeRels = computed(() => (Array.isArray(activePath.value.rels) ? activePath.value.rels : []))
</script>

<style scoped>
.graph-tree {
  background: #FDF8F3;
  border: 1rpx solid #E8E0D4;
  border-radius: 12rpx;
  padding: 16rpx;
  margin-top: 12rpx;
}
.tree-head {
  display: flex;
  align-items: center;
  gap: 8rpx;
  margin-bottom: 10rpx;
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
}
.empty-box {
  background: #F5F1EA;
  border-radius: 8rpx;
  padding: 12rpx;
}
.empty-text {
  font-size: 22rpx;
  color: #8B7355;
  line-height: 1.5;
}
.path-tabs {
  white-space: nowrap;
  margin-bottom: 10rpx;
}
.tab-row {
  display: flex;
  gap: 8rpx;
}
.path-tab {
  padding: 6rpx 16rpx;
  border-radius: 20rpx;
  background: #fff;
  border: 1rpx solid #E8E0D4;
  flex-shrink: 0;
}
.path-tab.active {
  background: #E8F5E9;
  border-color: #2D7A4A;
}
.tab-text {
  font-size: 20rpx;
  color: #5C4033;
}
.path-tab.active .tab-text {
  color: #2D7A4A;
  font-weight: 600;
}
.path-query {
  margin-bottom: 8rpx;
}
.query-text {
  font-size: 20rpx;
  color: #8B7355;
}
.node-scroll {
  white-space: nowrap;
  width: 100%;
}
.node-row {
  display: flex;
  align-items: center;
}
.node-chip {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  background: #fff;
  border: 2rpx solid #E8E0D4;
  border-radius: 10rpx;
  padding: 8rpx 12rpx;
  flex-shrink: 0;
  max-width: 220rpx;
}
.node-name {
  font-size: 22rpx;
  font-weight: 600;
  line-height: 1.4;
  white-space: normal;
}
.node-type {
  font-size: 16rpx;
  color: #fff;
  border-radius: 6rpx;
  padding: 0 6rpx;
  margin-top: 4rpx;
}
.rel-arrow {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  padding: 0 6rpx;
  flex-shrink: 0;
}
.rel-text {
  font-size: 16rpx;
  color: #8B7355;
  white-space: nowrap;
}
.rel-line {
  font-size: 22rpx;
  color: #C4A882;
}
.path-source {
  display: block;
  font-size: 18rpx;
  color: #C4A882;
  margin-top: 8rpx;
}
</style>
