"use strict";
const common_vendor = require("../common/vendor.js");
const utils_constants = require("../utils/constants.js");
const _sfc_main = {
  __name: "KnowledgeCard",
  props: {
    item: { type: Object, required: true }
  },
  emits: ["tap"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const emit = __emit;
    const categoryLabel = common_vendor.computed(() => {
      const cat = utils_constants.KNOWLEDGE_CATEGORIES.find((c) => c.value === props.item.category);
      return cat ? cat.label : "🌾 农业";
    });
    const icon = common_vendor.computed(() => {
      const cat = utils_constants.KNOWLEDGE_CATEGORIES.find((c) => c.value === props.item.category);
      return cat ? cat.icon : "📚";
    });
    const catBg = common_vendor.computed(() => {
      const map = { rice: "#E8F5E9", citrus: "#FEF3C7", tea: "#E0F2FE", livestock: "#FCE7F3" };
      return map[props.item.category] || "#F5EDE0";
    });
    const reads = common_vendor.computed(() => {
      return Math.floor(Math.random() * 2e3) + 100;
    });
    function onTap() {
      emit("tap", props.item);
    }
    return (_ctx, _cache) => {
      return {
        a: common_vendor.t(icon.value),
        b: common_vendor.t(__props.item.title),
        c: common_vendor.t(__props.item.content),
        d: common_vendor.t(categoryLabel.value),
        e: catBg.value,
        f: common_vendor.t(reads.value),
        g: common_vendor.o(onTap, "82")
      };
    };
  }
};
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-5db7687f"]]);
wx.createComponent(Component);
