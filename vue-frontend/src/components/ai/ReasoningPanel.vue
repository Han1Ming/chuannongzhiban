<template>
  <!-- 推理链默认折叠：回答本身已经够长，推理过程只在用户主动展开时占版面 -->
  <CollapsePill v-if="visible" icon="🧠" label="推理过程" hint="可解释性说明">
    <div class="reason-body flex flex-col gap-2.5">
      <div
        v-if="chain.conclusion"
        class="rp-conclusion px-3 py-2 rounded-lg text-xs leading-relaxed"
        style="background: var(--green-mist); color: var(--green-deep)"
      >
        <span class="font-semibold mr-1">结论：</span>{{ chain.conclusion }}
      </div>
      <div v-for="sec in sections" :key="sec.key" class="rp-section">
        <p class="text-[11px] font-semibold mb-1" :style="{ color: sec.color }">{{ sec.label }}</p>
        <ul class="flex flex-col gap-1">
          <li
            v-for="(item, i) in sec.items"
            :key="i"
            class="text-xs leading-relaxed flex items-start gap-1.5"
            style="color: var(--brown-soft)"
          >
            <span class="shrink-0 mt-[3px] w-1 h-1 rounded-full" :style="{ background: sec.color }"></span>
            <span class="min-w-0 break-words">{{ item }}</span>
          </li>
        </ul>
      </div>
    </div>
  </CollapsePill>

  <!-- 无数据：整条灰显一行提示，不占折叠面板的版面 -->
  <p v-else class="text-xs px-1" style="color: var(--brown-faint); opacity: 0.7">暂无推理链记录</p>
</template>

<script setup>
import { computed } from 'vue'
import { toArray } from '@/utils/aiTypes'
import CollapsePill from './CollapsePill.vue'

const props = defineProps({
  chain: { type: Object, default: null },
})

const visible = computed(() => !!props.chain)

const sections = computed(() => {
  const c = props.chain || {}
  return [
    { key: 'symptoms', label: '观察症状', color: '#B45309', items: toArray(c.symptoms) },
    { key: 'environment', label: '环境条件', color: '#0E7490', items: toArray(c.environment) },
    { key: 'knowledge_match', label: '知识匹配', color: 'var(--green)', items: toArray(c.knowledge_match) },
    { key: 'excluded', label: '排除项', color: '#6B7280', items: toArray(c.excluded) },
  ].filter((s) => s.items.length)
})
</script>

<style scoped>
.reason-body {
  padding: 12px;
  border-radius: 12px;
  background: #fff;
  border: 1px solid #f0ece4;
}
</style>
