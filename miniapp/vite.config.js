import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'

export default defineConfig({
  plugins: [uni()],
  // 编译到微信小程序
  uni: {
    mp: {
      weixin: {
        // 微信小程序配置
        usingComponents: true,
      }
    }
  }
})
