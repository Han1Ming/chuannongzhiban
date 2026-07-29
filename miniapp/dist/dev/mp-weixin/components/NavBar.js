"use strict";
const common_vendor = require("../common/vendor.js");
const common_assets = require("../common/assets.js");
const _sfc_main = {
  __name: "NavBar",
  props: {
    title: { type: String, default: "川农智伴" },
    showBack: { type: Boolean, default: false },
    bgColor: { type: String, default: "rgba(253, 248, 243, 0.92)" },
    placeholder: { type: Boolean, default: true }
  },
  emits: ["back"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const emit = __emit;
    const statusBarHeight = common_vendor.ref(20);
    common_vendor.onMounted(() => {
      try {
        const sys = common_vendor.index.getSystemInfoSync();
        statusBarHeight.value = sys.statusBarHeight || 20;
      } catch (e) {
        statusBarHeight.value = 20;
      }
    });
    function onBack() {
      if (props.showBack) {
        emit("back") || common_vendor.index.navigateBack();
      }
    }
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: __props.showBack
      }, __props.showBack ? {
        b: common_assets._imports_0$1,
        c: common_vendor.o(onBack, "f2")
      } : {}, {
        d: common_vendor.t(__props.title),
        e: statusBarHeight.value + "px",
        f: __props.bgColor,
        g: __props.placeholder
      }, __props.placeholder ? {
        h: statusBarHeight.value + 44 + "px"
      } : {});
    };
  }
};
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-c3ceb15a"]]);
wx.createComponent(Component);
