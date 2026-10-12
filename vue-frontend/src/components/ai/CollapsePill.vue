<template>
  <!--
    统一的可收缩胶囊：推理链、依据来源、图谱路径、智能体链路都用它，
    保证同一张回答卡片里几个折叠块的视觉与交互完全一致。

    为什么做成组件而不是各写一份：
    之前每引入一个新折叠块就要复制一套胶囊 CSS，改一次样式要改四处，
    很容易出现"一个胖一个瘦"。现在样式只有这一份。
  -->
  <div class="collapse-pill">
    <button
      class="cp-pill"
      type="button"
      :aria-expanded="open"
      @click="open = !open"
    >
      <span class="cp-icon" aria-hidden="true">{{ icon }}</span>
      <span class="truncate">{{ label }}</span>
      <span v-if="count !== null && count !== undefined" class="cp-count">（{{ count }}）</span>
      <span v-if="hint" class="cp-hint truncate">{{ hint }}</span>
      <el-icon
        :size="12"
        class="shrink-0 transition-transform duration-300"
        :style="{ transform: open ? 'rotate(90deg)' : 'rotate(0deg)', color: 'var(--brown-faint)' }"
      >
        <ArrowRight />
      </el-icon>
    </button>

    <transition name="cp">
      <div v-if="open" class="cp-body">
        <slot />
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { ArrowRight } from '@element-plus/icons-vue'

const props = defineProps({
  /** 胶囊左侧图标（emoji） */
  icon: { type: String, default: '📋' },
  /** 胶囊标题 */
  label: { type: String, required: true },
  /** 条数，显示为「（N）」；传 null 则不显示 */
  count: { type: [Number, String], default: null },
  /** 标题后的灰色补充说明 */
  hint: { type: String, default: '' },
  /** 默认是否展开：解释性内容默认收起，主内容默认展开 */
  defaultOpen: { type: Boolean, default: false },
  /**
   * 外部强制展开（如内容异步到达后需要自动展开）。
   * 传 undefined 表示不干预；传 true/false 会覆盖当前状态。
   */
  forceOpen: { type: Boolean, default: undefined },
})

const open = ref(props.defaultOpen)

// 内容从"没有"变成"有"时自动展开一次：例如来源列表从空态变为有数据，
// 用户点了搜索却看不到结果会以为是坏的
watch(
  () => props.count,
  (next, prev) => {
    if (prev === 0 || prev === null || prev === undefined) {
      if (next) open.value = true
    }
  },
)
watch(
  () => props.forceOpen,
  (v) => {
    if (v !== undefined) open.value = v
  },
)
</script>

<style scoped>
.cp-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  max-width: 100%;
  padding: 4px 12px;
  border-radius: 9999px;
  border: 1px solid #ececec;
  background: #fff;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.6;
  color: var(--brown);
  text-align: left;
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    background 0.2s ease,
    box-shadow 0.2s ease;
}
.cp-pill:hover {
  border-color: rgba(14, 122, 68, 0.3);
  background: var(--brand-mist);
  box-shadow: 0 2px 8px rgba(14, 122, 68, 0.08);
}
.cp-icon {
  font-size: 12px;
  line-height: 1;
  flex-shrink: 0;
}
.cp-count {
  font-weight: 400;
  color: var(--brown-faint);
  flex-shrink: 0;
}
.cp-hint {
  font-weight: 400;
  color: var(--brown-faint);
}
.cp-body {
  margin-top: 6px;
}

.cp-enter-active,
.cp-leave-active {
  transition: all 0.25s ease;
}
.cp-enter-from,
.cp-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
