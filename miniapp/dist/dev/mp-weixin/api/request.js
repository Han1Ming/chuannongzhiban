"use strict";
const common_vendor = require("../common/vendor.js");
const utils_auth = require("../utils/auth.js");
const utils_constants = require("../utils/constants.js");
const BASE_URL = utils_constants.API_BASE;
function request(config) {
  const token = utils_auth.getToken();
  const header = { "Content-Type": "application/json" };
  if (!config.skipAuth && token)
    header["Authorization"] = `Bearer ${token}`;
  return new Promise((resolve, reject) => {
    common_vendor.index.request({
      url: BASE_URL + config.url,
      method: config.method || "GET",
      data: config.data,
      header: { ...header, ...config.header },
      timeout: config.timeout || 3e4,
      success: (res) => {
        if (res.statusCode === 401) {
          if (config.skipAuthRedirect) {
            resolve(null);
            return;
          }
          utils_auth.removeToken();
          utils_auth.removeUser();
          common_vendor.index.reLaunch({ url: "/pages/login/login" });
          reject(new Error("登录已过期"));
          return;
        }
        const d = res.data;
        if (d && d.code === 200) {
          resolve(d.data !== void 0 ? d.data : d);
        } else if (d && d.msg) {
          reject(new Error(d.msg));
        } else {
          reject(new Error("请求失败"));
        }
      },
      fail: (err) => {
        const msg = err.errMsg || "";
        if (msg.includes("timeout")) {
          reject(new Error("连接超时，请检查网络或后端服务是否启动"));
        } else {
          reject(new Error(msg || "网络错误"));
        }
      }
    });
  });
}
function optionalGet(url, params) {
  return request({ url, data: params, skipAuthRedirect: true });
}
function get(url, params) {
  return request({ url, data: params });
}
function post(url, data) {
  return request({ url, method: "POST", data });
}
function uploadFile(url, filePath, name = "file", formData = {}) {
  const token = utils_auth.getToken();
  return new Promise((resolve, reject) => {
    common_vendor.index.uploadFile({
      url: BASE_URL + url,
      filePath,
      name,
      formData,
      header: token ? { Authorization: `Bearer ${token}` } : {},
      success: (res) => {
        try {
          const d = JSON.parse(res.data);
          if (d && d.code === 200) {
            resolve(d.data !== void 0 ? d.data : d);
          } else {
            reject(new Error((d == null ? void 0 : d.msg) || "上传失败"));
          }
        } catch (e) {
          reject(new Error("解析响应失败"));
        }
      },
      fail: (err) => {
        reject(new Error(err.errMsg || "上传失败"));
      }
    });
  });
}
exports.get = get;
exports.optionalGet = optionalGet;
exports.post = post;
exports.uploadFile = uploadFile;
