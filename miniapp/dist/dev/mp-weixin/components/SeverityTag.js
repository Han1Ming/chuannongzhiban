"use strict";
const common_vendor = require("../common/vendor.js");
const _sfc_main = {
  __name: "SeverityTag",
  props: {
    level: { type: String, default: "mild" }
  },
  setup(__props) {
    const props = __props;
    const levelMap = {
      mild: { label: "🟢 轻微", cls: "mild" },
      medium: { label: "🟡 中等", cls: "medium" },
      severe: { label: "🔴 严重", cls: "severe" },
      healthy: { label: "✅ 健康", cls: "healthy" }
    };
    const label = common_vendor.computed(() => {
      var _a;
      return ((_a = levelMap[props.level]) == null ? void 0 : _a.label) || props.level;
    });
    return (_ctx, _cache) => {
      return {
        a: common_vendor.t(label.value),
        b: common_vendor.n("severity-" + __props.level)
      };
    };
  }
};
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-840741fe"]]);
wx.createComponent(Component);
