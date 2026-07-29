"use strict";
const api_request = require("./request.js");
function register(phone, password, username) {
  return api_request.post("/api/user/register", { phone, password, username });
}
function loginSimple(phone, password) {
  return api_request.post("/api/user/login1", { phone, password });
}
function wechatLogin(code) {
  return api_request.post("/api/user/wechat-login", { code });
}
exports.loginSimple = loginSimple;
exports.register = register;
exports.wechatLogin = wechatLogin;
