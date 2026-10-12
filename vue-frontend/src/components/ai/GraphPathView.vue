<template>
  <!--
    图谱路径：横向「节点 → 关系 → 节点」链路；多条路径用 tab 切换，窄屏横向滚动不换行挤压。
    与推理链/依据来源一起统一成可收缩面板，但**默认展开**——图谱路径是本项目的主打能力，
    藏起来反而看不出效果；需要腾版面时用户可以收起。
  -->
  <CollapsePill
    icon="🕸️"
    label="知识图谱路径"
    :count="paths.length || null"
    default-open
  >
    <div style="border: 1px solid #f0ece4; border-radius: 12px; background: #fff">
      <div
        v-if="paths.length > 1"
        class="flex items-center justify-between gap-2 px-3 py-2"
        style="border-bottom: 1px solid #f0ece4"
      >
        <span class="text-xs font-semibold" style="color: var(--brown)">选择路径</span>
        <select
          v-model.number="active"
          class="gp-select text-xs rounded-lg px-2 py-1 outline-none max-w-[60%]"
          style="border: 1px solid #e8e0d4; color: var(--brown-soft); background: #faf8f4"
        >
          <option v-for="(p, i) in paths" :key="i" :value="i">
            路径 {{ i + 1 }}{{ p.query ? '：' + p.query : '' }}
          </option>
        </select>
      </div>

      <!-- 空态：给向量检索留出说明位置 -->
      <div v-if="!paths.length" class="px-3 py-3 text-xs leading-relaxed" style="color: var(--brown-faint)">
        本次未命中知识图谱路径，以下为向量检索依据
      </div>

      <template v-else>
        <div v-if="current.query" class="px-3 pt-2 text-[11px] truncate" style="color: var(--brown-faint)">
          检索式：{{ current.query }}
        </div>
        <div class="gp-scroll px-3 py-3 overflow-x-auto">
          <div class="flex items-center gap-1.5 min-w-max">
            <template v-for="(n, i) in current.nodes" :key="n.name + i">
              <span
                v-if="i > 0"
                class="gp-rel flex flex-col items-center px-1 shrink-0"
              >
                <span class="gp-arrow" :style="{ color: 'var(--earth)' }">→</span>
                <span
                  v-if="relLabel(i - 1)"
                  class="text-[10px] whitespace-nowrap"
                  style="color: var(--brown-faint)"
                  >{{ relLabel(i - 1) }}</span
                >
              </span>
              <button
                class="gp-node shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-transform duration-200 cursor-pointer"
                :style="{
                  background: n.style.bg,
                  color: n.style.color,
                  border: `1px solid ${n.style.color}33`,
                }"
                :title="`${n.style.label} · 点击查看图谱`"
                @click="$emit('node-click', { name: n.name, type: n.type })"
              >
                <span class="text-[10px] opacity-70 mr-1">{{ n.style.label }}</span>{{ n.name }}
              </button>
            </template>
          </div>
        </div>
      </template>
    </div>
  </CollapsePill>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { RELATION_LABELS, toText } from '@/utils/aiTypes'
import CollapsePill from './CollapsePill.vue'

const props = defineProps({
  // 已归一化的 GraphPath[]；此处只做展示，不再二次容错
  paths: { type: Array, default: () => [] },
})
defineEmits(['node-click'])

const active = ref(0)
// paths 变化（切换消息、多图诊断）时把选中项收回合法范围，避免下标越界
watch(
  () => props.paths.length,
  (len) => { if (active.value >= len) active.value = 0 },
)

const current = computed(() => props.paths[active.value] || { nodes: [], rels: [], query: '' })
const relLabel = (i) => RELATION_LABELS[toText(current.value.rels?.[i])] || toText(current.value.rels?.[i])
</script>

<style scoped>
.gp-node:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(44, 24, 16, 0.1);
}
.gp-select {
  appearance: auto;
}
@media (max-width: 768px) {
  .gp-scroll {
    padding-bottom: 6px;
  }
}
</style>
