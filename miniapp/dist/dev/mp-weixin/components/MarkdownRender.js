"use strict";
const common_vendor = require("../common/vendor.js");
const utils_markdown = require("../utils/markdown.js");
const _sfc_main = {
  __name: "MarkdownRender",
  props: {
    content: { type: String, default: "" }
  },
  setup(__props) {
    const props = __props;
    const formattedContent = common_vendor.computed(() => utils_markdown.mdToHtml(props.content));
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: formattedContent.value
      }, formattedContent.value ? {
        b: formattedContent.value
      } : {
        c: common_vendor.t(__props.content || "暂无内容")
      });
    };
  }
};
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-ac40a894"]]);
wx.createComponent(Component);
