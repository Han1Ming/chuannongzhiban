<template>
  <view />
</template>

<script setup>
import { onLaunch, onShow } from '@dcloudio/uni-app'

onLaunch(() => {
  console.log('🌾 川农智伴小程序启动')
  // 全局数据 - 用于跨页面通信
  getApp().globalData = {
    redirectPage: null,   // 登录后跳转的页面
    targetSessionId: null // 会话列表指定要打开的会话
  }
})

onShow(() => {
  // 检查登录状态
})
</script>

<style>
/* 全局样式 - 在 App.vue 中定义会影响所有页面 */
page {
  background-color: #FDF8F3;
  font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  color: #2C1810;
  font-size: 14px;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}

/* 滚动条优化 */
::-webkit-scrollbar {
  width: 0;
  height: 0;
}
</style>
