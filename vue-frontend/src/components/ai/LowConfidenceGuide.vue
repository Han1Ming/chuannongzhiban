<template>
  <!--
    低置信度引导：后端在低置信度时会主动拦截处方，
    这里必须只输出「怎么补充信息」，绝不能出现任何措施/药剂，避免误导用药。
  -->
  <div
    class="low-confidence-guide rounded-xl px-3.5 py-3"
    style="background: #FFF7F7; border: 1px solid #FCA5A5"
  >
    <div class="flex items-center gap-2 mb-2">
      <span class="text-base">🌱</span>
      <span class="text-xs font-semibold" style="color: #B91C1C">信息不足，暂不建议用药</span>
    </div>

    <p class="text-xs leading-relaxed mb-2.5" style="color: var(--brown-soft)">
      {{ guide.reason || '本次判断依据不足，为避免误用农药，暂不给出具体处方。' }}
    </p>

    <template v-if="guide.suggestions.length">
      <p class="text-[11px] font-semibold mb-1.5" style="color: var(--brown)">建议补充以下信息：</p>
      <ul class="flex flex-col gap-1.5 mb-2">
        <li
          v-for="(s, i) in guide.suggestions"
          :key="i"
          class="text-xs leading-relaxed flex items-start gap-2"
          style="color: var(--brown-soft)"
        >
          <span
            class="shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-mono mt-[1px]"
            style="background: #FEE2E2; color: #B91C1C"
            >{{ i + 1 }}</span
          >
          <span class="min-w-0 break-words">{{ s }}</span>
        </li>
      </ul>
    </template>

    <div
      v-if="guide.agri_station_tip"
      class="text-[11px] leading-relaxed px-2.5 py-2 rounded-lg flex items-start gap-1.5"
      style="background: #fff; color: var(--green-deep); border: 1px dashed #A7D7B4"
    >
      <span class="shrink-0">🏠</span><span>{{ guide.agri_station_tip }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { toArray, toText } from '@/utils/aiTypes'

const props = defineProps({
  // 已归一化的 need_more_info；为 null 时用兜底文案，保证组件本身不空转
  needMoreInfo: { type: Object, default: null },
})

const guide = computed(() => ({
  reason: toText(props.needMoreInfo?.reason),
  suggestions: toArray(props.needMoreInfo?.suggestions).filter(Boolean),
  agri_station_tip: toText(props.needMoreInfo?.agri_station_tip),
}))
</script>
