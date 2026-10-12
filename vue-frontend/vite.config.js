/*
 * @Author: Han1Ming 17383731605@163.com
 * @Date: 2026-07-06 08:43:02
 * @LastEditors: Han1Ming 17383731605@163.com
 * @LastEditTime: 2026-07-06 09:25:04
 * @FilePath: \node_modulesd:\Desktop\chuannong_zhiban\vue-frontend\vite.config.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "path";

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: { "@": resolve(__dirname, "src") },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": { target: "http://localhost:8000", changeOrigin: true },
      /*
       * 后端对话接口都在 /chat/ 之下：/chat/stream、/chat/sync、/chat/sessions、/chat/ws。
       *
       * 这里必须写成 "/chat/"（带尾斜杠），不能写成 "/chat"：
       * 代理是按前缀匹配的，而 "/chat" 同时也是**前端路由**（views/chat/ChatView.vue）。
       * 写成 "/chat" 时，直接打开或刷新 http://localhost:5173/chat 会被转发到后端，
       * 后端没有 GET /chat，于是页面变成一行 {"detail":"Not Found"}——点导航进得去、
       * 一刷新就 404，正是这个前缀冲突造成的。
       */
      "/chat/": { target: "http://localhost:8000", changeOrigin: true },
    },
  },
});
