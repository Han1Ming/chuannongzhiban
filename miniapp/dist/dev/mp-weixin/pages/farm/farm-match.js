"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_constants = require("../../utils/constants.js");
const api_farm = require("../../api/farm.js");
const utils_error = require("../../utils/error.js");
if (!Math) {
  NavBar();
}
const NavBar = () => "../../components/NavBar.js";
const _sfc_main = {
  __name: "farm-match",
  setup(__props) {
    const regions = utils_constants.REGIONS;
    const farmingTypes = utils_constants.FARMING_TYPES;
    const seasons = utils_constants.SEASONS;
    const selectedRegion = common_vendor.ref("");
    const selectedFarmingType = common_vendor.ref("种植");
    const selectedSeason = common_vendor.ref("");
    const matching = common_vendor.ref(false);
    const matchResult = common_vendor.ref(null);
    function onRegionChange(e) {
      selectedRegion.value = regions[e.detail.value];
    }
    function onFarmingTypeChange(e) {
      selectedFarmingType.value = farmingTypes[e.detail.value];
    }
    function onSeasonChange(e) {
      selectedSeason.value = seasons[e.detail.value];
    }
    async function startMatch() {
      matching.value = true;
      matchResult.value = null;
      try {
        const result = await api_farm.matchRecommendation(
          selectedRegion.value,
          selectedFarmingType.value,
          selectedSeason.value
        );
        if (result) {
          matchResult.value = result;
        } else {
          common_vendor.index.showToast({ title: "暂无匹配方案", icon: "none" });
        }
      } catch (err) {
        utils_error.handleError(err, { fallbackMsg: "匹配失败" });
      } finally {
        matching.value = false;
      }
    }
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.p({
          title: "作物匹配",
          ["show-back"]: true
        }),
        b: common_vendor.t(selectedRegion.value || "请选择地区"),
        c: !selectedRegion.value ? 1 : "",
        d: common_vendor.unref(regions),
        e: common_vendor.o(onRegionChange, "1e"),
        f: common_vendor.t(selectedFarmingType.value || "请选择类型"),
        g: !selectedFarmingType.value ? 1 : "",
        h: common_vendor.unref(farmingTypes),
        i: common_vendor.o(onFarmingTypeChange, "05"),
        j: common_vendor.t(selectedSeason.value || "请选择季节"),
        k: !selectedSeason.value ? 1 : "",
        l: common_vendor.unref(seasons),
        m: common_vendor.o(onSeasonChange, "1e"),
        n: !selectedRegion.value || !selectedSeason.value,
        o: common_vendor.o(startMatch, "ee"),
        p: matching.value
      }, matching.value ? {} : {}, {
        q: matchResult.value
      }, matchResult.value ? {
        r: common_vendor.t(matchResult.value.crop),
        s: common_vendor.t(matchResult.value.plan)
      } : {});
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-be780924"]]);
wx.createPage(MiniProgramPage);
