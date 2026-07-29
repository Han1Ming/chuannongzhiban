"use strict";
const common_vendor = require("../common/vendor.js");
const _sfc_main = {
  __name: "LoadingSkeleton",
  props: {
    count: { type: Number, default: 3 },
    type: { type: String, default: "card" }
    // card, text-only, list
  },
  setup(__props) {
    return (_ctx, _cache) => {
      return {
        a: common_vendor.f(__props.count, (i, k0, i0) => {
          return common_vendor.e(__props.type === "card" ? {} : {}, __props.type !== "text-only" ? {} : {}, {
            a: i
          });
        }),
        b: __props.type === "card",
        c: __props.type !== "text-only"
      };
    };
  }
};
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-e190f9f2"]]);
wx.createComponent(Component);
