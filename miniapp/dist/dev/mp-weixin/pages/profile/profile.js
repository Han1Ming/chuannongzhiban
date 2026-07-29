"use strict";
const common_vendor = require("../../common/vendor.js");
const store_auth = require("../../store/auth.js");
if (!Math) {
  NavBar();
}
const NavBar = () => "../../components/NavBar.js";
const _sfc_main = {
  __name: "profile",
  setup(__props) {
    const authStore = store_auth.useAuthStore();
    const showAbout = common_vendor.ref(false);
    const avatarText = common_vendor.computed(() => {
      var _a;
      if (!((_a = authStore.userInfo) == null ? void 0 : _a.username))
        return "🌾";
      return authStore.userInfo.username.charAt(0);
    });
    const displayName = common_vendor.computed(() => {
      var _a;
      return ((_a = authStore.userInfo) == null ? void 0 : _a.username) || "农户";
    });
    const displayPhone = common_vendor.computed(() => {
      var _a;
      const phone = (_a = authStore.userInfo) == null ? void 0 : _a.phone;
      if (phone)
        return phone.replace(/(\d{3})\d{4}(\d{4})/, "$1****$2");
      return "未绑定手机号";
    });
    const roleLabel = common_vendor.computed(() => {
      const roleMap = { USER: "🌾 农户", ADMIN: "⚙️ 管理员", GOV: "🏛️ 政府" };
      return roleMap[authStore.role] || "🌾 农户";
    });
    function goToLogin() {
      common_vendor.index.navigateTo({ url: "/pages/login/login" });
    }
    function goToSessions() {
      common_vendor.index.navigateTo({ url: "/pages/chat/session-list" });
    }
    function goToDiagnoses() {
      common_vendor.index.showToast({ title: "功能开发中", icon: "none" });
    }
    function handleLogout() {
      common_vendor.index.showModal({
        title: "确认退出",
        content: "退出后需要重新登录",
        success: (res) => {
          if (res.confirm) {
            authStore.logout();
            common_vendor.index.showToast({ title: "已退出", icon: "success" });
          }
        }
      });
    }
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.p({
          title: "个人中心"
        }),
        b: !common_vendor.unref(authStore).isLoggedIn
      }, !common_vendor.unref(authStore).isLoggedIn ? {
        c: common_vendor.o(goToLogin, "10")
      } : common_vendor.e({
        d: common_vendor.t(avatarText.value),
        e: common_vendor.t(displayName.value),
        f: common_vendor.t(displayPhone.value),
        g: common_vendor.unref(authStore).role
      }, common_vendor.unref(authStore).role ? {
        h: common_vendor.t(roleLabel.value)
      } : {}), {
        i: common_vendor.o(goToSessions, "81"),
        j: common_vendor.o(goToDiagnoses, "e5"),
        k: common_vendor.o(($event) => showAbout.value = true, "33"),
        l: common_vendor.unref(authStore).isLoggedIn
      }, common_vendor.unref(authStore).isLoggedIn ? {
        m: common_vendor.o(handleLogout, "c8")
      } : {}, {
        n: showAbout.value
      }, showAbout.value ? {
        o: common_vendor.o(($event) => showAbout.value = false, "a2")
      } : {}, {
        p: common_vendor.o(($event) => showAbout.value = false, "60"),
        q: showAbout.value ? 1 : ""
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-04d37cba"]]);
wx.createPage(MiniProgramPage);
