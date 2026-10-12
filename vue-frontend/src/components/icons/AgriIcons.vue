<template>
  <!-- 智能问答 - 对话框+稻穗 -->
  <svg v-if="name==='chat'" :width="size" :height="size" viewBox="0 0 24 24" :fill="color" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" :fill="bg ? 'none' : color" :stroke="bg ? 'none' : color" stroke-width="1.5"/>
    <path v-if="!bg" d="M7 9h10M7 13h7" :stroke="color" stroke-width="1.5" stroke-linecap="round"/>
    <path v-else d="M7 9h10M7 13h7" :stroke="color" stroke-width="1.5" stroke-linecap="round"/>
    <!-- 稻穗装饰 -->
    <path d="M12 2v1.5M10.5 3.5l1.5-1 1.5 1" stroke="none" :fill="color" opacity="0.6"/>
  </svg>

  <!-- 知识库 - 书本+叶子 -->
  <svg v-else-if="name==='book'" :width="size" :height="size" viewBox="0 0 24 24" :fill="color" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" :stroke="color" stroke-width="1.5" fill="none" stroke-linecap="round"/>
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" :stroke="color" stroke-width="1.5" fill="none"/>
    <path d="M12 6v6M9 9h6" :stroke="color" stroke-width="1.3" stroke-linecap="round" opacity="0.6"/>
  </svg>

  <!-- 图片诊断 - 相机+叶子 -->
  <svg v-else-if="name==='camera'" :width="size" :height="size" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2v11z" :stroke="color" stroke-width="1.5"/>
    <circle cx="12" cy="13" r="4" :stroke="color" stroke-width="1.5"/>
    <path d="M12 10v-2" :stroke="color" stroke-width="1.3" stroke-linecap="round" opacity="0.6"/>
  </svg>

  <!-- 种植匹配 - 幼苗/发芽 -->
  <svg v-else-if="name==='sprout'" :width="size" :height="size" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 22v-8M12 14c-2.5 0-5-2-5-5C7 4.5 12 2 12 2s5 2.5 5 7c0 3-2.5 5-5 5z" :stroke="color" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M7 12c1.5 1 3 1.5 5 1.5s3.5-.5 5-1.5" :stroke="color" stroke-width="1.3" opacity="0.5"/>
  </svg>

  <!-- 收益计算 - 图表+硬币 -->
  <svg v-else-if="name==='chart'" :width="size" :height="size" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="12" width="4" height="9" rx="1" :fill="color" opacity="0.6"/>
    <rect x="10" y="7" width="4" height="14" rx="1" :fill="color" opacity="0.8"/>
    <rect x="17" y="2" width="4" height="19" rx="1" :fill="color"/>
    <circle cx="12" cy="4" r="2" :fill="color" opacity="0.4"/>
    <path d="M8 22h10" :stroke="color" stroke-width="1.5" stroke-linecap="round"/>
  </svg>

  <!-- 农业资讯 - 报纸+稻穗 -->
  <svg v-else-if="name==='news'" :width="size" :height="size" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-4 0v-9" :stroke="color" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M10 7h6M10 11h6M10 15h4" :stroke="color" stroke-width="1.5" stroke-linecap="round" opacity="0.6"/>
  </svg>

  <!-- 首页 - 房子+叶子 -->
  <svg v-else-if="name==='home'" :width="size" :height="size" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 12l9-9 9 9" :stroke="color" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M5 10v10a1 1 0 0 0 1 1h3v-5h6v5h3a1 1 0 0 0 1-1V10" :stroke="color" stroke-width="1.5"/>
    <path d="M12 3l1.5 1.5" :stroke="color" stroke-width="1.3" opacity="0.5"/>
  </svg>

  <!-- 水稻/农作物 -->
  <svg v-else-if="name==='rice'" :width="size" :height="size" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2v14M8 6c0 3 1.5 5 4 5s4-2 4-5" :stroke="color" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M6 18c0 2 2.5 4 6 4s6-2 6-4" :stroke="color" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M9 16c-2-1-4-1-6 0M15 16c2-1 4-1 6 0" :stroke="color" stroke-width="1.3" opacity="0.5"/>
  </svg>

  <!-- 用户 - 人物+稻穗 -->
  <svg v-else-if="name==='user'" :width="size" :height="size" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="8" r="4" :stroke="color" stroke-width="1.5"/>
    <path d="M4 22c0-4 3.5-7 8-7s8 3 8 7" :stroke="color" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M8 10l1-1M15 10l1-1" :stroke="color" stroke-width="1.3" opacity="0.5"/>
  </svg>

  <!-- 设置/管理 - 齿轮 -->
  <svg v-else-if="name==='settings'" :width="size" :height="size" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="3" :stroke="color" stroke-width="1.5"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" :stroke="color" stroke-width="1.5"/>
  </svg>

  <!-- 叶子装饰 -->
  <svg v-else-if="name==='leaf'" :width="size" :height="size" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M11 20A7 7 0 0 1 9.8 6.7C11 5.5 13 5 17 5c0 4-.5 6-1.7 7.2A7 7 0 0 1 11 20z" :stroke="color" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M17 5l-6 6" :stroke="color" stroke-width="1.5" stroke-linecap="round"/>
  </svg>

  <!-- 知识图谱 - 节点网络 -->
  <svg v-else-if="name==='graph'" :width="size" :height="size" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="6" cy="6" r="2.4" :fill="color" :stroke="color"/>
    <circle cx="18" cy="5" r="2.4" :fill="color" :stroke="color"/>
    <circle cx="17" cy="17" r="2.4" :fill="color" :stroke="color"/>
    <circle cx="6" cy="19" r="2.4" :fill="color" :stroke="color"/>
    <path d="M8.2 7.3l7.5-1.9M18.2 7.2l-1.6 7.7M14.8 15.9l-8.4 1.8M8.2 8.3l-1.7 8.6" :stroke="color" stroke-width="1.2" stroke-linecap="round" opacity="0.7"/>
  </svg>

  <!--
    ===== 对话操作栏图标 =====
    Element Plus 图标集（294 个）里**没有**喇叭/声波图标，也没有点赞/点踩图标，
    因此这 4 个必须自绘。统一 24×24 视框、1.7 描边、round 端点，与上面既有图标风格一致。
    路径取自 lucide（MIT）的 volume / thumbs 系列，保证图形语义是被用户认得的形状。
  -->

  <!-- 语音朗读 · 待播（静默喇叭：只有喇叭本体，没有声波） -->
  <svg v-else-if="name==='speaker'" :width="size" :height="size" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M11 4.7a.7.7 0 0 0-1.2-.5L6.4 7.6a1.4 1.4 0 0 1-1 .4H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.4a1.4 1.4 0 0 1 1 .4l3.4 3.4a.7.7 0 0 0 1.2-.5V4.7z" :fill="color" :stroke="color" stroke-width="1.4" stroke-linejoin="round"/>
  </svg>

  <!-- 语音朗读 · 播放中（喇叭 + 两道声波，与待播态形成"图标变形"） -->
  <svg v-else-if="name==='speaker-wave'" :width="size" :height="size" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M11 4.7a.7.7 0 0 0-1.2-.5L6.4 7.6a1.4 1.4 0 0 1-1 .4H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.4a1.4 1.4 0 0 1 1 .4l3.4 3.4a.7.7 0 0 0 1.2-.5V4.7z" :fill="color" :stroke="color" stroke-width="1.4" stroke-linejoin="round"/>
    <path d="M15.6 8.9a4.4 4.4 0 0 1 0 6.2" :stroke="color" stroke-width="1.7" stroke-linecap="round"/>
    <path d="M18.7 5.8a8.8 8.8 0 0 1 0 12.4" :stroke="color" stroke-width="1.7" stroke-linecap="round"/>
  </svg>

  <!-- 赞（图标名沿用 lucide thumbs-up 的形状：拇指上竖 + 手掌） -->
  <svg v-else-if="name==='thumb-up'" :width="size" :height="size" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M7 10v12" :stroke="color" stroke-width="1.7" stroke-linecap="round"/>
    <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z" :stroke="color" stroke-width="1.7" stroke-linejoin="round"/>
  </svg>

  <!-- 踩（thumbs-up 的 180° 镜像，保证两个图标成套） -->
  <svg v-else-if="name==='thumb-down'" :width="size" :height="size" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M17 14V2" :stroke="color" stroke-width="1.7" stroke-linecap="round"/>
    <path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88Z" :stroke="color" stroke-width="1.7" stroke-linejoin="round"/>
  </svg>

  <!-- 默认 Fallback -->
  <svg v-else :width="size" :height="size" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" :stroke="color" stroke-width="1.5"/>
    <path d="M12 8v4M12 16h.01" :stroke="color" stroke-width="2" stroke-linecap="round"/>
  </svg>
</template>

<script setup>
defineProps({
  name: { type: String, default: 'leaf' },
  size: { type: [Number, String], default: 24 },
  color: { type: String, default: 'currentColor' },
  bg: { type: Boolean, default: false }
})
</script>
