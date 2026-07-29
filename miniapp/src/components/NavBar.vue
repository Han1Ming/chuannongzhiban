<template>
  <view class="nav-bar" :style="{ paddingTop: statusBarHeight + 'px', background: bgColor }">
    <view class="nav-inner">
      <view class="nav-left" @tap="onBack" v-if="showBack">
        <image class="nav-back-icon" src="/static/icons/back.svg" mode="aspectFit" />
      </view>
      <view class="nav-left" v-else />
      <text class="nav-title">{{ title }}</text>
      <view class="nav-right">
        <slot name="right" />
      </view>
    </view>
  </view>
  <!-- 占位 -->
  <view class="nav-placeholder" :style="{ height: statusBarHeight + 44 + 'px' }" v-if="placeholder" />
</template>

<script setup>
import { ref, onMounted } from 'vue'

const props = defineProps({
  title: { type: String, default: '川农智伴' },
  showBack: { type: Boolean, default: false },
  bgColor: { type: String, default: 'rgba(253, 248, 243, 0.92)' },
  placeholder: { type: Boolean, default: true }
})

const emit = defineEmits(['back'])
const statusBarHeight = ref(20)

onMounted(() => {
  try {
    const sys = uni.getSystemInfoSync()
    statusBarHeight.value = sys.statusBarHeight || 20
  } catch (e) {
    statusBarHeight.value = 20
  }
})

function onBack() {
  if (props.showBack) {
    emit('back') || uni.navigateBack()
  }
}
</script>

<style scoped>
.nav-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(232, 224, 212, 0.3);
}
.nav-inner {
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
}
.nav-left, .nav-right {
  width: 60px;
  display: flex;
  align-items: center;
}
.nav-left { justify-content: flex-start; }
.nav-right { justify-content: flex-end; }
.nav-back-icon {
  width: 24px;
  height: 24px;
}
.nav-title {
  flex: 1;
  text-align: center;
  font-size: 17px;
  font-weight: 600;
  color: #1A4A2E;
}
.nav-placeholder {
  width: 100%;
}
</style>
