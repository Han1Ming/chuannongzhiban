<template>
  <div class="kg-page flex-1 flex flex-col min-h-0" style="background: var(--cream)">
    <SearchBar
      :recommendations="recommendations"
      :loading="loading"
      @search="handleSearch"
      @reset="loadOverview"
    />

    <div class="kg-canvas-wrap flex-1 relative p-4">
      <div class="h-full rounded-xl bg-white border border-[#e8e0d4] overflow-hidden shadow-sm">
        <GraphCanvas
          :graph="graph"
          :highlight="highlight"
          :loading="loading"
          @node-click="openDetail"
        />
      </div>
    </div>

    <NodeDetail
      :visible="detailVisible"
      :node="detailNode"
      :graph="graph"
      @close="detailVisible = false"
      @navigate="handleSearch"
    />
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  fetchGraphNode,
  fetchGraphOverview,
  fetchGraphRecommend
} from '@/api/knowledgeGraph'
import { buildNodeKey } from '@/utils/knowledgeGraph'
import SearchBar from '@/components/knowledge-graph/SearchBar.vue'
import GraphCanvas from '@/components/knowledge-graph/GraphCanvas.vue'
import NodeDetail from '@/components/knowledge-graph/NodeDetail.vue'

const route = useRoute()
const graph = ref({ nodes: [], links: [] })
const recommendations = ref([])
const loading = ref(false)
const highlight = ref(null)
const detailVisible = ref(false)
const detailNode = ref(null)

async function loadOverview() {
  loading.value = true
  try {
    graph.value = await fetchGraphOverview()
    highlight.value = null
  } catch {
    // 请求拦截器已提示
  } finally {
    loading.value = false
  }
}

async function loadRecommendations() {
  try {
    recommendations.value = await fetchGraphRecommend()
  } catch {
    recommendations.value = []
  }
}

function computeHighlight(node, g) {
  const nodes = new Set([node.name])
  const links = new Set()
  const addLink = (a, b) => links.add(buildNodeKey(a, b))

  if (node.type === 'Disease') {
    const drugs = (g.links || [])
      .filter(l => l.source === node.name && l.type === 'TREATED_BY')
      .map(l => l.target)
    for (const drug of drugs) {
      const channels = (g.links || [])
        .filter(l => l.source === drug && l.type === 'AVAILABLE_AT')
        .map(l => l.target)
      if (!channels.length) continue
      nodes.add(drug)
      addLink(node.name, drug)
      for (const ch of channels) {
        nodes.add(ch)
        addLink(drug, ch)
      }
    }
  } else if (node.type === 'Drug') {
    const diseases = (g.links || [])
      .filter(l => l.target === node.name && l.type === 'TREATED_BY')
      .map(l => l.source)
    const channels = (g.links || [])
      .filter(l => l.source === node.name && l.type === 'AVAILABLE_AT')
      .map(l => l.target)
    for (const d of diseases) {
      nodes.add(d)
      addLink(d, node.name)
    }
    for (const c of channels) {
      nodes.add(c)
      addLink(node.name, c)
    }
  }
  return { nodes: [...nodes], links: [...links] }
}

async function handleSearch(name) {
  const keyword = (name || '').trim()
  if (!keyword) return
  loading.value = true
  try {
    const data = await fetchGraphNode(keyword)
    graph.value = data.graph
    highlight.value = computeHighlight(data.node, data.graph)
    detailNode.value = data.node
    detailVisible.value = true
  } catch {
    ElMessage.warning('未找到相关节点')
  } finally {
    loading.value = false
  }
}

function openDetail(node) {
  detailNode.value = node
  detailVisible.value = true
}

onMounted(async () => {
  await Promise.all([loadRecommendations(), loadOverview()])
  const hl = route.query.highlight
  if (hl) handleSearch(String(hl))
})

watch(
  () => route.query.highlight,
  val => {
    if (val) handleSearch(String(val))
  }
)
</script>

<style scoped>
.kg-canvas-wrap {
  min-height: 700px;
  height: calc(100vh - 200px);
  max-height: none;
  box-shadow: 0 8px 32px rgba(26, 74, 46, 0.04);
}

@media (min-width: 768px) {
  .kg-canvas-wrap {
    min-height: 920px;
    height: calc(100vh - 170px);
    max-height: 1400px;
  }
}

.kg-page {
  height: calc(100vh - 68px);
}

@media (max-width: 767px) {
  .kg-page {
    height: auto;
  }
}
</style>
