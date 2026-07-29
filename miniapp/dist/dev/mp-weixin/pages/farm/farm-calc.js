"use strict";
const common_vendor = require("../../common/vendor.js");
const api_farm = require("../../api/farm.js");
const utils_error = require("../../utils/error.js");
if (!Math) {
  NavBar();
}
const NavBar = () => "../../components/NavBar.js";
const _sfc_main = {
  __name: "farm-calc",
  setup(__props) {
    const area = common_vendor.ref("");
    const costPerMu = common_vendor.ref("");
    const yieldPerMu = common_vendor.ref("");
    const pricePerUnit = common_vendor.ref("");
    const calculating = common_vendor.ref(false);
    const result = common_vendor.ref(null);
    function formatMoney(num) {
      if (num == null)
        return "0.00";
      return Number(num).toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    function formatNumber(num) {
      if (num == null)
        return "0";
      return Number(num).toFixed(1);
    }
    async function calculate() {
      const a = parseFloat(area.value) || 0;
      const c = parseFloat(costPerMu.value) || 0;
      const y = parseFloat(yieldPerMu.value) || 0;
      const p = parseFloat(pricePerUnit.value) || 0;
      if (a <= 0) {
        common_vendor.index.showToast({ title: "请输入种植面积", icon: "none" });
        return;
      }
      calculating.value = true;
      result.value = null;
      try {
        const data = await api_farm.calculateBudget(a, c, y, p);
        result.value = data;
      } catch (err) {
        utils_error.handleError(err, { fallbackMsg: "计算失败，请重试" });
      } finally {
        calculating.value = false;
      }
    }
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.p({
          title: "收益计算",
          ["show-back"]: true
        }),
        b: area.value,
        c: common_vendor.o(common_vendor.m(($event) => area.value = $event.detail.value, {
          number: true
        }), "90"),
        d: costPerMu.value,
        e: common_vendor.o(common_vendor.m(($event) => costPerMu.value = $event.detail.value, {
          number: true
        }), "48"),
        f: yieldPerMu.value,
        g: common_vendor.o(common_vendor.m(($event) => yieldPerMu.value = $event.detail.value, {
          number: true
        }), "36"),
        h: pricePerUnit.value,
        i: common_vendor.o(common_vendor.m(($event) => pricePerUnit.value = $event.detail.value, {
          number: true
        }), "10"),
        j: !calculating.value
      }, !calculating.value ? {} : {}, {
        k: !area.value || !costPerMu.value || calculating.value,
        l: common_vendor.o(calculate, "9c"),
        m: result.value
      }, result.value ? {
        n: common_vendor.t(formatMoney(result.value.total_cost)),
        o: common_vendor.t(formatMoney(result.value.total_income)),
        p: common_vendor.t(formatMoney(result.value.net_profit)),
        q: common_vendor.n(result.value.net_profit >= 0 ? "green" : "red"),
        r: common_vendor.t(formatNumber(result.value.roi))
      } : {});
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-8a28524c"]]);
wx.createPage(MiniProgramPage);
