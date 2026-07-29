"use strict";
const common_vendor = require("../common/vendor.js");
const utils_auth = require("../utils/auth.js");
const useAuthStore = common_vendor.defineStore("auth", () => {
  const token = common_vendor.ref(utils_auth.getToken());
  const userInfo = common_vendor.ref(utils_auth.getUser());
  const isLoggedIn = common_vendor.computed(() => !!token.value);
  const role = common_vendor.computed(() => {
    var _a;
    if ((_a = userInfo.value) == null ? void 0 : _a.role)
      return userInfo.value.role;
    const decoded = utils_auth.decodeJwt(token.value);
    return (decoded == null ? void 0 : decoded.role) || null;
  });
  const isWechatUser = common_vendor.computed(() => {
    return userInfo.value && !userInfo.value.phone && !userInfo.value.password_hash;
  });
  function loginSuccess(data) {
    token.value = data.token;
    userInfo.value = data.user;
    utils_auth.setToken(data.token);
    utils_auth.setUser(data.user);
  }
  function logout() {
    token.value = "";
    userInfo.value = null;
    utils_auth.removeToken();
    utils_auth.removeUser();
    try {
      const keys = common_vendor.index.getStorageInfoSync().keys;
      keys.forEach((key) => {
        if (key.startsWith("cnzb_chats_")) {
          common_vendor.index.removeStorageSync(key);
        }
      });
    } catch (e) {
      console.error("清除聊天记录失败", e);
    }
  }
  return {
    token,
    userInfo,
    isLoggedIn,
    role,
    isWechatUser,
    loginSuccess,
    logout
  };
});
exports.useAuthStore = useAuthStore;
