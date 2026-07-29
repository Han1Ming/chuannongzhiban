"use strict";
const common_vendor = require("../common/vendor.js");
const common_assets = require("../common/assets.js");
const utils_format = require("../utils/format.js");
const _sfc_main = {
  __name: "NewsCard",
  props: {
    item: { type: Object, required: true },
    showImage: { type: Boolean, default: true }
  },
  emits: ["tap"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const emit = __emit;
    function formatTime(time) {
      return utils_format.relativeTime(time);
    }
    function onTap() {
      emit("tap", props.item);
    }
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: __props.showImage
      }, __props.showImage ? {
        b: common_assets._imports_0
      } : {}, {
        c: common_vendor.t(__props.item.title),
        d: __props.item.description
      }, __props.item.description ? {
        e: common_vendor.t(__props.item.description)
      } : {}, {
        f: common_vendor.t(__props.item.source || "农业资讯"),
        g: common_vendor.t(formatTime(__props.item.ctime)),
        h: !__props.showImage ? 1 : "",
        i: common_vendor.o(onTap, "76")
      });
    };
  }
};
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-1d5294f0"]]);
wx.createComponent(Component);
