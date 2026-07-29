"use strict";
const common_vendor = require("../../common/vendor.js");
const api_auth = require("../../api/auth.js");
const utils_error = require("../../utils/error.js");
if (!Math) {
  NavBar();
}
const NavBar = () => "../../components/NavBar.js";
const _sfc_main = {
  __name: "register",
  setup(__props) {
    const phone = common_vendor.ref("");
    const username = common_vendor.ref("");
    const password = common_vendor.ref("");
    const submitting = common_vendor.ref(false);
    async function handleRegister() {
      if (submitting.value)
        return;
      if (!phone.value || phone.value.length !== 11) {
        common_vendor.index.showToast({ title: "请输入正确的手机号", icon: "none" });
        return;
      }
      if (!password.value || password.value.length < 6) {
        common_vendor.index.showToast({ title: "密码不少于6位", icon: "none" });
        return;
      }
      submitting.value = true;
      common_vendor.index.showLoading({ title: "注册中..." });
      try {
        await api_auth.register(phone.value, password.value, username.value || void 0);
        common_vendor.index.hideLoading();
        common_vendor.index.showToast({ title: "注册成功", icon: "success" });
        common_vendor.index.navigateBack();
      } catch (err) {
        common_vendor.index.hideLoading();
        utils_error.handleError(err, { fallbackMsg: "注册失败" });
      } finally {
        submitting.value = false;
      }
    }
    function goLogin() {
      common_vendor.index.navigateBack();
    }
    return (_ctx, _cache) => {
      return {
        a: common_vendor.p({
          title: "注册",
          ["show-back"]: true
        }),
        b: phone.value,
        c: common_vendor.o(($event) => phone.value = $event.detail.value, "37"),
        d: username.value,
        e: common_vendor.o(($event) => username.value = $event.detail.value, "75"),
        f: password.value,
        g: common_vendor.o(($event) => password.value = $event.detail.value, "b5"),
        h: !phone.value || !password.value,
        i: common_vendor.o(handleRegister, "39"),
        j: common_vendor.o(goLogin, "c3")
      };
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-97bb96ad"]]);
wx.createPage(MiniProgramPage);
