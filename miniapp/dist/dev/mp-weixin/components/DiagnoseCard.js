"use strict";
const common_vendor = require("../common/vendor.js");
if (!Math) {
  SeverityTag();
}
const SeverityTag = () => "./SeverityTag.js";
const _sfc_main = {
  __name: "DiagnoseCard",
  props: {
    result: { type: Object, required: true }
  },
  setup(__props) {
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.t(__props.result.filename || "图片"),
        b: common_vendor.p({
          level: __props.result.severity || "mild"
        }),
        c: __props.result.confidence
      }, __props.result.confidence ? {
        d: __props.result.confidence * 100 + "%",
        e: common_vendor.t((__props.result.confidence * 100).toFixed(1))
      } : {}, {
        f: __props.result.diagnosis
      }, __props.result.diagnosis ? {
        g: common_vendor.t(__props.result.diagnosis)
      } : __props.result.error ? {
        i: common_vendor.t(__props.result.error)
      } : {}, {
        h: __props.result.error,
        j: __props.result.advice
      }, __props.result.advice ? {
        k: common_vendor.t(__props.result.advice)
      } : {});
    };
  }
};
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-070770de"]]);
wx.createComponent(Component);
