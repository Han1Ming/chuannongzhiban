"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_constants = require("../../utils/constants.js");
const api_knowledge = require("../../api/knowledge.js");
if (!Math) {
  (KnowledgeCard + LoadingSkeleton + EmptyState)();
}
const KnowledgeCard = () => "../../components/KnowledgeCard.js";
const LoadingSkeleton = () => "../../components/LoadingSkeleton.js";
const EmptyState = () => "../../components/EmptyState.js";
const _sfc_main = {
  __name: "knowledge",
  setup(__props) {
    const categories = utils_constants.KNOWLEDGE_CATEGORIES;
    const activeCategory = common_vendor.ref("");
    const knowledgeList = common_vendor.ref([]);
    const searchQuery = common_vendor.ref("");
    const searchResults = common_vendor.ref([]);
    const loading = common_vendor.ref(true);
    const refreshing = common_vendor.ref(false);
    common_vendor.onMounted(async () => {
      await loadData();
    });
    async function loadData() {
      loading.value = true;
      try {
        knowledgeList.value = await api_knowledge.getKnowledgeList(activeCategory.value);
      } catch (e) {
        console.error("加载知识库失败", e);
      } finally {
        loading.value = false;
      }
    }
    async function switchCategory(value) {
      activeCategory.value = value;
      searchQuery.value = "";
      searchResults.value = [];
      await loadData();
    }
    async function doSearch() {
      if (!searchQuery.value.trim())
        return;
      searchResults.value = [];
      loading.value = true;
      try {
        const results = await api_knowledge.searchKnowledge(searchQuery.value, 5);
        searchResults.value = Array.isArray(results) ? results : [];
      } catch (e) {
        common_vendor.index.showToast({ title: "搜索失败", icon: "none" });
      } finally {
        loading.value = false;
      }
    }
    function clearSearch() {
      searchQuery.value = "";
      searchResults.value = [];
    }
    async function onRefresh() {
      refreshing.value = true;
      await loadData();
      refreshing.value = false;
    }
    function loadMore() {
    }
    function showDetail(item) {
      var _a;
      common_vendor.index.showModal({
        title: item.title,
        content: ((_a = item.content) == null ? void 0 : _a.slice(0, 500)) || "暂无详情",
        showCancel: false
      });
    }
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.o(doSearch, "5f"),
        b: searchQuery.value,
        c: common_vendor.o(($event) => searchQuery.value = $event.detail.value, "18"),
        d: searchQuery.value
      }, searchQuery.value ? {
        e: common_vendor.o(clearSearch, "4f")
      } : {}, {
        f: common_vendor.f(common_vendor.unref(categories), (cat, k0, i0) => {
          return {
            a: common_vendor.t(cat.label),
            b: cat.value,
            c: activeCategory.value === cat.value ? 1 : "",
            d: common_vendor.o(($event) => switchCategory(cat.value), cat.value)
          };
        }),
        g: searchResults.value.length
      }, searchResults.value.length ? {
        h: common_vendor.f(searchResults.value, (r, i, i0) => {
          var _a, _b;
          return common_vendor.e({
            a: common_vendor.t(r.content),
            b: (_a = r.metadata) == null ? void 0 : _a.source
          }, ((_b = r.metadata) == null ? void 0 : _b.source) ? {
            c: common_vendor.t(r.metadata.source)
          } : {}, {
            d: i
          });
        })
      } : common_vendor.e({
        i: common_vendor.f(knowledgeList.value, (item, k0, i0) => {
          return {
            a: item.id,
            b: common_vendor.o(($event) => showDetail(item), item.id),
            c: "3d5fb6e9-0-" + i0,
            d: common_vendor.p({
              item
            })
          };
        }),
        j: loading.value
      }, loading.value ? {
        k: common_vendor.p({
          count: 4,
          type: "card"
        })
      } : {}, {
        l: !loading.value && !knowledgeList.value.length
      }, !loading.value && !knowledgeList.value.length ? {
        m: common_vendor.p({
          title: "暂无知识内容",
          desc: "选择其他分类试试"
        })
      } : {}), {
        n: refreshing.value,
        o: common_vendor.o(onRefresh, "29"),
        p: common_vendor.o(loadMore, "fd")
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-3d5fb6e9"]]);
wx.createPage(MiniProgramPage);
