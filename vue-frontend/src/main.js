import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import * as icons from '@element-plus/icons-vue'
import App from './App.vue'
import router from './router'
import './assets/styles/main.css'

const app = createApp(App)
for (const [k, v] of Object.entries(icons)) app.component(k, v)
app.use(createPinia()).use(router).use(ElementPlus, { locale: zhCn })
app.mount('#app')
