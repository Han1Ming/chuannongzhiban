"use strict";
const common_vendor = require("../../common/vendor.js");
const common_assets = require("../../common/assets.js");
const api_news = require("../../api/news.js");
const utils_error = require("../../utils/error.js");
if (!Math) {
  (NavBar + MarkdownRender + LoadingSkeleton)();
}
const NavBar = () => "../../components/NavBar.js";
const LoadingSkeleton = () => "../../components/LoadingSkeleton.js";
const MarkdownRender = () => "../../components/MarkdownRender.js";
const _sfc_main = {
  __name: "news-detail",
  setup(__props) {
    const news = common_vendor.ref(null);
    const title = common_vendor.ref("新闻详情");
    const loading = common_vendor.ref(true);
    const isError = common_vendor.ref(false);
    const errorMsg = common_vendor.ref("");
    let newsId = null;
    common_vendor.onLoad((options) => {
      newsId = options == null ? void 0 : options.id;
      if (!newsId) {
        isError.value = true;
        errorMsg.value = "缺少新闻ID参数";
        loading.value = false;
        return;
      }
      loadDetail();
    });
    async function loadDetail() {
      loading.value = true;
      isError.value = false;
      try {
        const result = await api_news.getNewsDetail(newsId);
        if (!result) {
          isError.value = true;
          errorMsg.value = "新闻不存在或已删除";
          return;
        }
        news.value = result;
        title.value = (result.title || "新闻详情").slice(0, 20);
        common_vendor.index.setNavigationBarTitle({ title: title.value });
      } catch (err) {
        isError.value = true;
        errorMsg.value = err.message || "加载失败";
        utils_error.handleError(err, { fallbackMsg: "加载失败" });
      } finally {
        loading.value = false;
      }
    }
    function openUrl(url) {
      if (!url)
        return;
      common_vendor.index.showActionSheet({
        itemList: ["复制链接", "在浏览器中打开"],
        success: (res) => {
          if (res.tapIndex === 0) {
            common_vendor.index.setClipboardData({ data: url, success: () => common_vendor.index.showToast({ title: "链接已复制", icon: "success" }) });
          } else if (res.tapIndex === 1) {
            common_vendor.index.setClipboardData({ data: url, success: () => {
              common_vendor.index.showToast({ title: "链接已复制，请粘贴到浏览器打开", icon: "none" });
            } });
          }
        }
      });
    }
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.p({
          title: title.value,
          ["show-back"]: true
        }),
        b: isError.value && !loading.value
      }, isError.value && !loading.value ? {
        c: common_vendor.t(errorMsg.value)
      } : {}, {
        d: news.value
      }, news.value ? common_vendor.e({
        e: common_vendor.t(news.value.title),
        f: common_vendor.t(news.value.source || "农业资讯"),
        g: common_vendor.t(news.value.ctime),
        h: common_assets._imports_0,
        i: news.value.description
      }, news.value.description ? {
        j: common_vendor.p({
          content: news.value.description
        })
      } : {}, {
        k: news.value.url
      }, news.value.url ? {
        l: common_vendor.o(($event) => openUrl(news.value.url), "61")
      } : {}) : {}, {
        m: loading.value
      }, loading.value ? {
        n: common_vendor.p({
          count: 3,
          type: "card"
        })
      } : {});
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-89545dae"]]);
wx.createPage(MiniProgramPage);
