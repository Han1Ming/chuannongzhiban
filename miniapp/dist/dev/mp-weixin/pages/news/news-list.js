"use strict";
const common_vendor = require("../../common/vendor.js");
const store_auth = require("../../store/auth.js");
const api_news = require("../../api/news.js");
const utils_error = require("../../utils/error.js");
if (!Math) {
  (NavBar + NewsCard + EmptyState + LoadingSkeleton)();
}
const NavBar = () => "../../components/NavBar.js";
const NewsCard = () => "../../components/NewsCard.js";
const LoadingSkeleton = () => "../../components/LoadingSkeleton.js";
const EmptyState = () => "../../components/EmptyState.js";
const _sfc_main = {
  __name: "news-list",
  setup(__props) {
    const authStore = store_auth.useAuthStore();
    const newsList = common_vendor.ref([]);
    const loading = common_vendor.ref(true);
    const refreshing = common_vendor.ref(false);
    const page = common_vendor.ref(1);
    const hasMore = common_vendor.ref(true);
    const keyword = common_vendor.ref("");
    const showSearch = common_vendor.ref(false);
    const isSearching = common_vendor.ref(false);
    const isRequireLogin = common_vendor.ref(false);
    common_vendor.onMounted(async () => {
      await loadNews(true);
    });
    async function loadNews(reset = false) {
      if (reset) {
        page.value = 1;
        newsList.value = [];
      }
      loading.value = true;
      isRequireLogin.value = false;
      try {
        const result = authStore.isLoggedIn ? await api_news.getNewsList(page.value, 15) : await api_news.getNewsListOptional(page.value, 15);
        if (result === null) {
          isRequireLogin.value = true;
          return;
        }
        const items = (result == null ? void 0 : result.items) || [];
        if (reset) {
          newsList.value = items;
        } else {
          newsList.value = [...newsList.value, ...items];
        }
        hasMore.value = items.length >= 15;
      } catch (e) {
        utils_error.handleError(e, { fallbackMsg: "加载新闻失败" });
      } finally {
        loading.value = false;
      }
    }
    async function doSearch() {
      if (!keyword.value.trim())
        return;
      isSearching.value = true;
      loading.value = true;
      try {
        const results = await api_news.searchNews(keyword.value, 20);
        newsList.value = Array.isArray(results) ? results : [];
      } catch (e) {
        utils_error.handleError(e, { fallbackMsg: "搜索失败" });
      } finally {
        loading.value = false;
      }
    }
    function cancelSearch() {
      showSearch.value = false;
      keyword.value = "";
      isSearching.value = false;
      loadNews(true);
    }
    function onRefresh() {
      refreshing.value = true;
      (isSearching.value ? doSearch() : loadNews(true)).then(() => {
        refreshing.value = false;
      });
    }
    function loadMore() {
      if (!hasMore.value || loading.value || isSearching.value)
        return;
      page.value++;
      loadNews();
    }
    function goToDetail(item) {
      common_vendor.index.navigateTo({ url: `/pages/news/news-detail?id=${item.id}` });
    }
    function goToLogin() {
      getApp().globalData.redirectPage = "/pages/news/news-list";
      common_vendor.index.navigateTo({ url: "/pages/login/login" });
    }
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.o(($event) => showSearch.value = true, "0a"),
        b: common_vendor.p({
          title: "农业新闻",
          ["show-back"]: true
        }),
        c: showSearch.value
      }, showSearch.value ? {
        d: common_vendor.o(doSearch, "ac"),
        e: keyword.value,
        f: common_vendor.o(($event) => keyword.value = $event.detail.value, "9e"),
        g: common_vendor.o(cancelSearch, "ba")
      } : {}, {
        h: isSearching.value
      }, isSearching.value ? common_vendor.e({
        i: common_vendor.t(newsList.value.length),
        j: common_vendor.f(newsList.value, (item, k0, i0) => {
          return {
            a: item.id,
            b: common_vendor.o(($event) => goToDetail(item), item.id),
            c: "33e24ea1-1-" + i0,
            d: common_vendor.p({
              item,
              ["show-image"]: true
            })
          };
        }),
        k: !newsList.value.length && !loading.value
      }, !newsList.value.length && !loading.value ? {
        l: common_vendor.p({
          icon: "🔍",
          title: "未找到相关新闻",
          desc: "换个关键词试试"
        })
      } : {}) : common_vendor.e({
        m: common_vendor.f(newsList.value, (item, k0, i0) => {
          return {
            a: item.id,
            b: common_vendor.o(($event) => goToDetail(item), item.id),
            c: "33e24ea1-3-" + i0,
            d: common_vendor.p({
              item,
              ["show-image"]: true
            })
          };
        }),
        n: loading.value
      }, loading.value ? {
        o: common_vendor.p({
          count: 4,
          type: "card"
        })
      } : {}, {
        p: isRequireLogin.value && !loading.value
      }, isRequireLogin.value && !loading.value ? {
        q: common_vendor.o(goToLogin, "3c"),
        r: common_vendor.p({
          icon: "🔐",
          title: "登录后可查看新闻",
          desc: "登录后获取最新农业资讯",
          ["action-text"]: "去登录"
        })
      } : {}, {
        s: hasMore.value && !loading.value
      }, hasMore.value && !loading.value ? {} : {}, {
        t: !hasMore.value && newsList.value.length
      }, !hasMore.value && newsList.value.length ? {} : {}), {
        v: refreshing.value,
        w: common_vendor.o(onRefresh, "40"),
        x: common_vendor.o(loadMore, "3f")
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-33e24ea1"]]);
wx.createPage(MiniProgramPage);
