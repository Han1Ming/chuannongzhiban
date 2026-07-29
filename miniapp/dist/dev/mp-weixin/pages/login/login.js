"use strict";
const common_vendor = require("../../common/vendor.js");
const store_auth = require("../../store/auth.js");
const api_auth = require("../../api/auth.js");
const utils_error = require("../../utils/error.js");
const _sfc_main = {
  __name: "login",
  setup(__props) {
    const tab = common_vendor.ref("wechat");
    const phone = common_vendor.ref("");
    const password = common_vendor.ref("");
    const submitting = common_vendor.ref(false);
    const authStore = store_auth.useAuthStore();
    async function handleWechatLogin(e) {
      if (e.detail.errMsg !== "getUserInfo:ok")
        return;
      if (submitting.value)
        return;
      submitting.value = true;
      common_vendor.index.showLoading({ title: "登录中..." });
      try {
        const loginRes = await new Promise((resolve, reject) => {
          common_vendor.index.login({
            success: (res) => resolve(res),
            fail: (err) => reject(err)
          });
        });
        if (!loginRes.code) {
          common_vendor.index.hideLoading();
          common_vendor.index.showToast({ title: "获取授权失败", icon: "none" });
          return;
        }
        const result = await api_auth.wechatLogin(loginRes.code);
        authStore.loginSuccess(result);
        common_vendor.index.hideLoading();
        common_vendor.index.showToast({ title: "登录成功", icon: "success" });
        navigateAfterLogin();
      } catch (err) {
        common_vendor.index.hideLoading();
        utils_error.handleError(err, { fallbackMsg: "登录失败" });
      } finally {
        submitting.value = false;
      }
    }
    async function handlePasswordLogin() {
      if (submitting.value)
        return;
      if (!phone.value || !password.value)
        return;
      if (!/^1\d{10}$/.test(phone.value)) {
        common_vendor.index.showToast({ title: "请输入正确的手机号", icon: "none" });
        return;
      }
      submitting.value = true;
      common_vendor.index.showLoading({ title: "登录中..." });
      try {
        const result = await api_auth.loginSimple(phone.value, password.value);
        authStore.loginSuccess(result);
        common_vendor.index.hideLoading();
        common_vendor.index.showToast({ title: "登录成功", icon: "success" });
        navigateAfterLogin();
      } catch (err) {
        common_vendor.index.hideLoading();
        utils_error.handleError(err, { fallbackMsg: "登录失败" });
      } finally {
        submitting.value = false;
      }
    }
    function navigateAfterLogin() {
      var _a;
      const redirect = (_a = getApp().globalData) == null ? void 0 : _a.redirectPage;
      if (redirect) {
        getApp().globalData.redirectPage = null;
        common_vendor.index.switchTab({ url: redirect });
      } else {
        common_vendor.index.switchTab({ url: "/pages/index/index" });
      }
    }
    function goRegister() {
      common_vendor.index.navigateTo({ url: "/pages/register/register" });
    }
    return (_ctx, _cache) => {
      return {
        a: tab.value === "wechat" ? 1 : "",
        b: common_vendor.o(($event) => tab.value = "wechat", "79"),
        c: tab.value === "phone" ? 1 : "",
        d: common_vendor.o(($event) => tab.value = "phone", "ee"),
        e: common_vendor.o(handleWechatLogin, "72"),
        f: tab.value === "wechat",
        g: phone.value,
        h: common_vendor.o(($event) => phone.value = $event.detail.value, "5d"),
        i: password.value,
        j: common_vendor.o(($event) => password.value = $event.detail.value, "e2"),
        k: !phone.value || !password.value,
        l: common_vendor.o(handlePasswordLogin, "19"),
        m: common_vendor.o(goRegister, "83"),
        n: tab.value === "phone"
      };
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-cdfe2409"]]);
wx.createPage(MiniProgramPage);
