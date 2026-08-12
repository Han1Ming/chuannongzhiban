<template>
  <el-drawer
    :model-value="visible"
    title="节点详情"
    size="400px"
    direction="rtl"
    :with-header="true"
    class="kg-node-drawer"
    @close="$emit('close')"
  >
    <div v-if="node" class="px-1 pb-6">
      <!-- 基本信息 -->
      <div class="flex items-center gap-3 mb-4">
        <span
          class="w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg font-bold shrink-0"
          :style="{ background: NODE_COLORS[node.type] || '#888' }"
        >{{ node.name?.slice(0, 1) }}</span>
        <div class="min-w-0">
          <h3 class="text-base font-bold truncate" style="color: var(--brown)">{{ node.name }}</h3>
          <el-tag size="small" effect="plain" :style="{ color: NODE_COLORS[node.type] || '#888', borderColor: NODE_COLORS[node.type] || '#888' }">
            {{ NODE_LABELS[node.type] || node.type }}
          </el-tag>
        </div>
      </div>

      <p v-if="node.description" class="text-sm leading-relaxed mb-4 p-3 rounded-xl" style="background: #f8f6f2; color: var(--brown-soft); border: 1px solid #f0ece4;">
        {{ node.description }}
      </p>

      <!-- 病害/药物扩展字段 -->
      <div v-if="node.severity || node.season" class="grid grid-cols-2 gap-3 mb-4">
        <div class="p-3 rounded-xl" style="background: #fff5f5; border: 1px solid #fdeaea;">
          <div class="text-xs mb-1" style="color: var(--brown-faint)">严重程度</div>
          <div class="text-sm font-bold" style="color: #dc2626">{{ node.severity || '-' }}</div>
        </div>
        <div class="p-3 rounded-xl" style="background: #f0f9eb; border: 1px solid #e5f3dc;">
          <div class="text-xs mb-1" style="color: var(--brown-faint)">高发季节</div>
          <div class="text-sm font-bold" style="color: #16a34a">{{ node.season || '-' }}</div>
        </div>
      </div>

      <div v-if="node.type === 'Drug'" class="space-y-2 mb-4">
        <div class="p-3 rounded-xl" style="background: #eff6ff; border: 1px solid #dbeafe;">
          <div class="text-xs mb-1" style="color: var(--brown-faint)">使用方法</div>
          <div class="text-sm" style="color: var(--brown-soft)">{{ node.usage || '按产品说明使用' }}</div>
        </div>
        <div class="p-3 rounded-xl" style="background: #f5f3ff; border: 1px solid #ede9fe;">
          <div class="text-xs mb-1" style="color: var(--brown-faint)">稀释倍数</div>
          <div class="text-sm font-bold" style="color: #7c3aed">{{ node.dilution || '按说明书' }}</div>
        </div>
      </div>

      <!-- 病害用药指导 -->
      <div v-if="node.type === 'Disease' && drugGuides.length" class="mb-4">
        <div class="text-sm font-bold mb-2" style="color: var(--brown)">用药指导</div>
        <div class="space-y-2">
          <div v-for="d in drugGuides" :key="d.name" class="p-3 rounded-xl border cursor-pointer transition-colors hover:bg-blue-50" style="background: #fff; border-color: #e8e0d4;" @click="$emit('navigate', d.name)">
            <div class="flex items-center justify-between mb-1">
              <span class="text-sm font-bold" style="color: #2563eb">{{ d.name }}</span>
              <span class="text-xs" style="color: var(--brown-faint)">{{ d.dilution || '按说明书' }}</span>
            </div>
            <p class="text-xs leading-relaxed" style="color: var(--brown-faint)">{{ d.usage || '按产品说明使用' }}</p>
          </div>
        </div>
      </div>

      <!-- 关联实体 -->
      <div>
        <div class="text-sm font-bold mb-2" style="color: var(--brown)">关联实体</div>
        <div v-if="relationSections.length" class="space-y-4">
          <div v-for="sec in relationSections" :key="sec.type">
            <div class="flex items-center gap-2 mb-2">
              <span class="text-xs px-2 py-0.5 rounded-full font-medium" style="background: var(--green-mist); color: var(--green);">{{ RELATION_LABELS[sec.type] }}</span>
              <span class="text-xs" style="color: var(--brown-faint)">{{ sec.items.length }} 个</span>
            </div>
            <div class="flex flex-wrap gap-1.5">
              <el-tag
                v-for="item in sec.items"
                :key="item"
                class="cursor-pointer kg-rel-tag"
                effect="plain"
                @click="$emit('navigate', item)"
              >{{ item }}</el-tag>
            </div>
          </div>
        </div>
        <el-empty v-else description="暂无关联实体" :image-size="70" />
      </div>
    </div>

    <div v-else class="py-20">
      <el-empty description="请点击图谱中的节点查看详情" :image-size="90" />
    </div>
  </el-drawer>
</template>

<script setup>
import { computed } from 'vue'
import { NODE_COLORS, NODE_LABELS, RELATION_LABELS, RELATION_ORDER } from '@/utils/knowledgeGraph'

const props = defineProps({
  visible: { type: Boolean, default: false },
  node: { type: Object, default: null },
  graph: { type: Object, default: () => ({ nodes: [], links: [] }) }
})

defineEmits(['close', 'navigate'])

const nodeMap = computed(() => {
  const map = {}
  for (const n of props.graph.nodes || []) map[n.name] = n
  return map
})

const groups = computed(() => {
  if (!props.node) return {}
  const result = {}
  for (const link of props.graph.links || []) {
    if (link.source === props.node.name) {
      ;(result[link.type] ||= []).push(link.target)
    } else if (link.target === props.node.name) {
      ;(result[link.type] ||= []).push(link.source)
    }
  }
  for (const key of Object.keys(result)) result[key] = [...new Set(result[key])]
  return result
})

const relationSections = computed(() =>
  RELATION_ORDER.filter(t => groups.value[t]?.length).map(t => ({ type: t, items: groups.value[t] }))
)

const drugGuides = computed(() => {
  if (props.node?.type !== 'Disease') return []
  return (groups.value.TREATED_BY || []).map(name => nodeMap.value[name]).filter(Boolean)
})
</script>

<style scoped>
.kg-rel-tag {
  border-radius: 999px;
}
.kg-rel-tag:hover {
  color: var(--green-deep);
  border-color: var(--green);
  background: var(--green-mist);
}
</style>
