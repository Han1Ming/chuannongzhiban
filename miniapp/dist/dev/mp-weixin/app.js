"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const common_vendor = require("./common/vendor.js");
if (!Math) {
  "./pages/index/index.js";
  "./pages/login/login.js";
  "./pages/register/register.js";
  "./pages/chat/chat.js";
  "./pages/chat/session-list.js";
  "./pages/profile/profile.js";
  "./pages/knowledge/knowledge.js";
  "./pages/diagnose/diagnose.js";
  "./pages/news/news-list.js";
  "./pages/news/news-detail.js";
  "./pages/farm/farm-calc.js";
  "./pages/farm/farm-match.js";
}
const _sfc_main = {
  __name: "App",
  setup(__props) {
    common_vendor.onLaunch(() => {
      console.log("🌾 川农智伴小程序启动");
      getApp().globalData = {
        redirectPage: null,
        // 登录后跳转的页面
        targetSessionId: null
        // 会话列表指定要打开的会话
      };
    });
    common_vendor.onShow(() => {
    });
    return (_ctx, _cache) => {
      return {};
    };
  }
};
function createApp() {
  const app = common_vendor.createSSRApp(_sfc_main);
  app.use(common_vendor.createPinia());
  return { app };
}
createApp().app.mount("#app");
exports.createApp = createApp;
