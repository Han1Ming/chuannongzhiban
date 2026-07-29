"use strict";
const common_vendor = require("../common/vendor.js");
function handleError(err, options = {}) {
  const { fallbackMsg = "操作失败，请重试", showToast = true } = options;
  const message = (err == null ? void 0 : err.message) || fallbackMsg;
  const isAuthError = message.includes("登录") || message.includes("token") || message.includes("Token");
  console.error("[AppError]", message, err);
  if (showToast) {
    common_vendor.index.showToast({ title: message, icon: "none", duration: 2e3 });
  }
  return { message, isAuthError };
}
exports.handleError = handleError;
