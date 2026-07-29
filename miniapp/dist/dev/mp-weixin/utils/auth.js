"use strict";
const common_vendor = require("../common/vendor.js");
const TOKEN_KEY = "cnzb_token";
const USER_KEY = "cnzb_user";
function getToken() {
  try {
    return common_vendor.index.getStorageSync(TOKEN_KEY) || "";
  } catch {
    return "";
  }
}
function setToken(token) {
  common_vendor.index.setStorageSync(TOKEN_KEY, token);
}
function removeToken() {
  common_vendor.index.removeStorageSync(TOKEN_KEY);
}
function getUser() {
  try {
    const raw = common_vendor.index.getStorageSync(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
function setUser(user) {
  common_vendor.index.setStorageSync(USER_KEY, JSON.stringify(user));
}
function removeUser() {
  common_vendor.index.removeStorageSync(USER_KEY);
}
function decodeJwt(token) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3)
      return null;
    const payload = parts[1];
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = decodeURIComponent(
      atob(base64).split("").map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)).join("")
    );
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}
exports.decodeJwt = decodeJwt;
exports.getToken = getToken;
exports.getUser = getUser;
exports.removeToken = removeToken;
exports.removeUser = removeUser;
exports.setToken = setToken;
exports.setUser = setUser;
