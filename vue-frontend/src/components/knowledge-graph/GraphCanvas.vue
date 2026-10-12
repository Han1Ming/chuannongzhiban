<template>
  <div class="graph-canvas relative w-full h-full min-h-[720px]">
    <div ref="$chart" class="absolute inset-0"></div>

    <!-- 图例 -->
    <div class="kg-legend absolute left-4 top-4 z-10 rounded-xl px-4 py-3 bg-white/90 backdrop-blur border border-[#e8e0d4] shadow-sm">
      <div class="text-xs font-bold mb-2" style="color: var(--brown)">图例</div>
      <div class="grid grid-cols-2 gap-x-4 gap-y-1.5">
        <div v-for="t in legendItems" :key="t.type" class="flex items-center gap-2 text-xs" style="color: var(--brown-soft)">
          <span class="w-2.5 h-2.5 rounded-full shrink-0" :style="{ background: t.color }"></span>
          {{ t.label }}
        </div>
      </div>
    </div>

    <button class="kg-reset-btn absolute right-4 top-4 z-10" @click="reset">重置布局</button>

    <div v-if="loading" class="kg-loading absolute inset-0 z-20 flex items-center justify-center bg-white/70 backdrop-blur-sm">
      <div class="flex items-center gap-3 rounded-xl px-5 py-3 bg-white border border-[#e8e0d4] shadow-md">
        <el-icon class="is-loading" :size="18"><Loading /></el-icon>
        <span class="text-sm" style="color: var(--brown-soft)">图谱数据加载中...</span>
      </div>
    </div>

    <div v-if="!loading && !graph.nodes.length" class="absolute inset-0 flex items-center justify-center">
      <div class="text-center">
        <div class="text-4xl mb-3 opacity-30">🕸️</div>
        <p class="text-sm" style="color: var(--brown-faint)">暂无图谱数据</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import * as echarts from 'echarts'
import {
  NODE_COLORS,
  NODE_LABELS,
  NODE_SIZES,
  RELATION_LABELS,
  TYPE_ORDER,
  buildNodeKey
} from '@/utils/knowledgeGraph'

const props = defineProps({
  graph: { type: Object, default: () => ({ nodes: [], links: [] }) },
  highlight: { type: Object, default: null },
  loading: { type: Boolean, default: false }
})

const emit = defineEmits(['node-click'])
const $chart = ref(null)
let chart = null
let resizeObserver = null

const legendItems = TYPE_ORDER.map(t => ({
  type: t,
  label: NODE_LABELS[t] || t,
  color: NODE_COLORS[t] || '#888'
}))

function buildOption() {
  const highlightNodes = new Set(props.highlight?.nodes || [])
  const highlightLinks = new Set(props.highlight?.links || [])
  const hasHighlight = !!props.highlight && (highlightNodes.size > 0 || highlightLinks.size > 0)

  const nodes = (props.graph.nodes || []).map(n => {
    const color = NODE_COLORS[n.type] || '#888'
    const isHighlighted = highlightNodes.has(n.name)
    const dimmed = hasHighlight && !isHighlighted
    return {
      id: n.name,
      name: n.name,
      value: n.name,
      symbolSize: NODE_SIZES[n.type] || 30,
      itemStyle: {
        color,
        borderColor: '#fff',
        borderWidth: isHighlighted ? 3 : 1.5,
        shadowBlur: isHighlighted ? 26 : 0,
        shadowColor: color,
        opacity: dimmed ? 0.3 : 1
      },
      label: {
        show: true,
        formatter: n.name,
        fontSize: isHighlighted ? 16 : 13,
        color: dimmed ? '#c9c1b4' : '#3c2f24',
        fontWeight: isHighlighted ? 700 : 400
      },
      _raw: n
    }
  })

  const links = (props.graph.links || []).map(l => {
    const isHighlighted = highlightLinks.has(buildNodeKey(l.source, l.target))
    const dimmed = hasHighlight && !isHighlighted
    return {
      source: l.source,
      target: l.target,
      value: RELATION_LABELS[l.type] || l.type,
      lineStyle: {
        color: isHighlighted ? '#E8B84B' : '#cfc4b4',
        width: isHighlighted ? 3.5 : 1.2,
        curveness: 0.15,
        opacity: dimmed ? 0.15 : 0.75
      },
      label: {
        show: true,
        formatter: RELATION_LABELS[l.type] || l.type,
        fontSize: 11,
        color: isHighlighted ? '#B8860B' : '#9a8b78',
        opacity: dimmed ? 0.15 : 0.85
      }
    }
  })

  return {
    animationDurationUpdate: 600,
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(255,255,255,0.96)',
      borderColor: '#e8e0d4',
      textStyle: { color: '#3c2f24' },
      formatter: p => {
        if (p.dataType === 'node') {
          const raw = p.data?._raw || {}
          return `<div style="max-width:260px"><strong>${raw.name || ''}</strong><br/><span style="color:${NODE_COLORS[raw.type] || '#888'}">${NODE_LABELS[raw.type] || raw.type || ''}</span><br/>${raw.description || '暂无描述'}</div>`
        }
        return p.data?.value || ''
      }
    },
    series: [
      {
        type: 'graph',
        layout: 'force',
        roam: true,
        draggable: true,
        data: nodes,
        links,
        categories: TYPE_ORDER.map(t => ({ name: t })),
        force: {
          repulsion: 560,
          edgeLength: [130, 280],
          gravity: 0.08,
          friction: 0.6,
          layoutAnimation: true
        },
        emphasis: {
          focus: 'adjacency',
          lineStyle: { width: 2.4, opacity: 1 },
          label: { show: true, fontSize: 16, fontWeight: 700 }
        },
        label: { position: 'right' }
      }
    ]
  }
}

function render() {
  if (!chart) return
  chart.setOption(buildOption(), true)
}

function reset() {
  render()
}

function onChartClick(params) {
  if (params.dataType === 'node' && params.data?._raw) {
    emit('node-click', params.data._raw)
  }
}

watch(
  () => [props.graph, props.highlight, props.loading],
  () => render(),
  { deep: true }
)

onMounted(() => {
  if (!$chart.value) return
  chart = echarts.init($chart.value)
  chart.on('click', onChartClick)
  render()
  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => chart?.resize())
    resizeObserver.observe($chart.value)
  }
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  chart?.dispose()
  chart = null
})

defineExpose({ reset })
</script>

<style scoped>
.kg-legend {
  box-shadow: 0 6px 24px rgba(10, 92, 51, 0.08);
}
.kg-reset-btn {
  padding: 7px 14px;
  border-radius: 10px;
  border: 1px solid #e8e0d4;
  background: rgba(255, 255, 255, 0.92);
  color: var(--brown-soft);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
}
.kg-reset-btn:hover {
  color: var(--green);
  border-color: var(--green);
}
</style>
