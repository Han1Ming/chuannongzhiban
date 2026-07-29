"use strict";
const common_vendor = require("../../common/vendor.js");
const api_chat = require("../../api/chat.js");
const utils_format = require("../../utils/format.js");
const utils_error = require("../../utils/error.js");
if (!Math) {
  (NavBar + LoadingSkeleton + EmptyState)();
}
const NavBar = () => "../../components/NavBar.js";
const LoadingSkeleton = () => "../../components/LoadingSkeleton.js";
const EmptyState = () => "../../components/EmptyState.js";
const _sfc_main = {
  __name: "session-list",
  setup(__props) {
    const sessions = common_vendor.ref([]);
    const loading = common_vendor.ref(true);
    common_vendor.onMounted(async () => {
      loading.value = true;
      try {
        sessions.value = await api_chat.fetchSessions(50, 0) || [];
      } catch (err) {
        utils_error.handleError(err, { fallbackMsg: "加载会话失败" });
      } finally {
        loading.value = false;
      }
    });
    function formatTime(time) {
      return utils_format.relativeTime(time);
    }
    function goToChat(id) {
      getApp().globalData.targetSessionId = id;
      common_vendor.index.switchTab({ url: "/pages/chat/chat" });
    }
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.p({
          title: "会话历史",
          ["show-back"]: true
        }),
        b: loading.value
      }, loading.value ? {
        c: common_vendor.p({
          count: 5,
          type: "card"
        })
      } : {}, {
        d: common_vendor.f(sessions.value, (s, k0, i0) => {
          return {
            a: common_vendor.t(s.title || "新对话"),
            b: common_vendor.t(formatTime(s.updated_at)),
            c: s.id,
            d: common_vendor.o(($event) => goToChat(s.id), s.id)
          };
        }),
        e: !sessions.value.length && !loading.value
      }, !sessions.value.length && !loading.value ? {
        f: common_vendor.p({
          icon: "💬",
          title: "暂无对话记录",
          desc: "去首页开始一段新对话吧"
        })
      } : {});
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-19e99d6e"]]);
wx.createPage(MiniProgramPage);
