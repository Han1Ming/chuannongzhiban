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
      "/chat": { target: "http://localhost:8000", changeOrigin: true },
    },
  },
});
