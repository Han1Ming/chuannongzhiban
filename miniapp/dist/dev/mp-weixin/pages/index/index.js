"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_constants = require("../../utils/constants.js");
const api_news = require("../../api/news.js");
const store_auth = require("../../store/auth.js");
const utils_error = require("../../utils/error.js");
if (!Math) {
  (NavBar + FunctionGrid + NewsCard + LoadingSkeleton)();
}
const NavBar = () => "../../components/NavBar.js";
const FunctionGrid = () => "../../components/FunctionGrid.js";
const NewsCard = () => "../../components/NewsCard.js";
const LoadingSkeleton = () => "../../components/LoadingSkeleton.js";
const _sfc_main = {
  __name: "index",
  setup(__props) {
    const authStore = store_auth.useAuthStore();
    const functions = utils_constants.HOME_FUNCTIONS;
    const quickQuestions = utils_constants.QUICK_QUESTIONS;
    const refreshing = common_vendor.ref(false);
    const newsList = common_vendor.ref(null);
    const newsLoading = common_vendor.ref(true);
    const banners = [
      { icon: "🌾", title: "AI智能问答", desc: "农业问题随时问", bg: "linear-gradient(135deg, #E8F5E9, #C8E6C9)" },
      { icon: "📷", title: "拍照识病虫", desc: "一拍即知，精准防治", bg: "linear-gradient(135deg, #FFF3E0, #FFE0B2)" },
      { icon: "📊", title: "收益计算器", desc: "算算今年赚多少", bg: "linear-gradient(135deg, #E3F2FD, #BBDEFB)" }
    ];
    common_vendor.onMounted(async () => {
      await loadNews();
    });
    async function loadNews() {
      newsLoading.value = true;
      try {
        const result = authStore.isLoggedIn ? await api_news.getLatestNews(5) : await api_news.getLatestNewsOptional(5);
        newsList.value = result;
      } catch (e) {
        utils_error.handleError(e, { fallbackMsg: "加载新闻失败" });
      } finally {
        newsLoading.value = false;
      }
    }
    async function onRefresh() {
      refreshing.value = true;
      await loadNews();
      refreshing.value = false;
    }
    function loadMore() {
    }
    function onFuncTap(item) {
      if (!item.page) {
        common_vendor.index.showToast({ title: "功能开发中", icon: "none" });
        return;
      }
      if (item.key === "voice") {
        common_vendor.index.switchTab({ url: "/pages/chat/chat" });
        return;
      }
      if (["chat", "diagnose", "farm-calc", "farm-match"].includes(item.key)) {
        if (!authStore.isLoggedIn) {
          getApp().globalData.redirectPage = item.page;
          common_vendor.index.navigateTo({ url: "/pages/login/login" });
          return;
        }
      }
      common_vendor.index.navigateTo({ url: item.page });
    }
    function askQuestion(q) {
      if (!authStore.isLoggedIn) {
        getApp().globalData.redirectPage = "/pages/chat/chat";
        common_vendor.index.navigateTo({ url: "/pages/login/login" });
        return;
      }
      common_vendor.index.switchTab({ url: "/pages/chat/chat" });
      common_vendor.index.$emit("quick-question", q);
    }
    function goToChat() {
      if (!authStore.isLoggedIn) {
        common_vendor.index.navigateTo({ url: "/pages/login/login" });
        return;
      }
      common_vendor.index.switchTab({ url: "/pages/chat/chat" });
    }
    function goToNews() {
      common_vendor.index.navigateTo({ url: "/pages/news/news-list" });
    }
    function goToNewsDetail(item) {
      common_vendor.index.navigateTo({ url: `/pages/news/news-detail?id=${item.id}` });
    }
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.o(goToChat, "05"),
        b: common_vendor.p({
          title: "川农智伴"
        }),
        c: common_vendor.f(common_vendor.unref(quickQuestions), (q, i, i0) => {
          return {
            a: common_vendor.t(q),
            b: i,
            c: common_vendor.o(($event) => askQuestion(q), i)
          };
        }),
        d: common_vendor.o(onFuncTap, "76"),
        e: common_vendor.p({
          items: common_vendor.unref(functions)
        }),
        f: common_vendor.f(banners, (b, i, i0) => {
          return {
            a: common_vendor.t(b.icon),
            b: common_vendor.t(b.title),
            c: common_vendor.t(b.desc),
            d: b.bg,
            e: i
          };
        }),
        g: common_vendor.o(goToNews, "44"),
        h: newsList.value === null && !newsLoading.value
      }, newsList.value === null && !newsLoading.value ? {
        i: common_vendor.o(goToNews, "a6")
      } : {}, {
        j: common_vendor.f(newsList.value || [], (item, k0, i0) => {
          return {
            a: item.id,
            b: common_vendor.o(($event) => goToNewsDetail(item), item.id),
            c: "83a5a03c-2-" + i0,
            d: common_vendor.p({
              item,
              ["show-image"]: true
            })
          };
        }),
        k: newsLoading.value
      }, newsLoading.value ? {
        l: common_vendor.p({
          count: 2,
          type: "card"
        })
      } : {}, {
        m: refreshing.value,
        n: common_vendor.o(onRefresh, "51"),
        o: common_vendor.o(loadMore, "56")
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-83a5a03c"]]);
wx.createPage(MiniProgramPage);
