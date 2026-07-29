"use strict";
const common_vendor = require("../common/vendor.js");
const _sfc_main = {
  __name: "FunctionGrid",
  props: {
    items: { type: Array, default: () => [] },
    columns: { type: Number, default: 4 }
  },
  emits: ["tap"],
  setup(__props, { emit: __emit }) {
    const emit = __emit;
    function onTap(item) {
      emit("tap", item);
    }
    return (_ctx, _cache) => {
      return {
        a: common_vendor.f(__props.items, (item, k0, i0) => {
          return {
            a: common_vendor.t(item.icon),
            b: item.bgColor || "#E8F5E9",
            c: common_vendor.t(item.label),
            d: common_vendor.t(item.desc),
            e: item.key,
            f: common_vendor.o(($event) => onTap(item), item.key)
          };
        })
      };
    };
  }
};
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-98dda225"]]);
wx.createComponent(Component);
