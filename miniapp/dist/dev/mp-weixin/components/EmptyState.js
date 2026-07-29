"use strict";
const common_vendor = require("../common/vendor.js");
const _sfc_main = {
  __name: "EmptyState",
  props: {
    icon: { type: String, default: "📭" },
    title: { type: String, default: "暂无内容" },
    desc: { type: String, default: "" },
    actionText: { type: String, default: "" }
  },
  emits: ["action"],
  setup(__props) {
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.t(__props.icon),
        b: common_vendor.t(__props.title),
        c: __props.desc
      }, __props.desc ? {
        d: common_vendor.t(__props.desc)
      } : {}, {
        e: __props.actionText
      }, __props.actionText ? {
        f: common_vendor.t(__props.actionText),
        g: common_vendor.o(($event) => _ctx.$emit("action"), "be")
      } : {});
    };
  }
};
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-f262d0f3"]]);
wx.createComponent(Component);
