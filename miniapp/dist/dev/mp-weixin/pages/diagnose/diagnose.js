"use strict";
const common_vendor = require("../../common/vendor.js");
const api_multimodal = require("../../api/multimodal.js");
const utils_error = require("../../utils/error.js");
if (!Math) {
  (NavBar + DiagnoseCard)();
}
const NavBar = () => "../../components/NavBar.js";
const DiagnoseCard = () => "../../components/DiagnoseCard.js";
const _sfc_main = {
  __name: "diagnose",
  setup(__props) {
    const tempFiles = common_vendor.ref([]);
    const diagnosing = common_vendor.ref(false);
    const diagnosisResult = common_vendor.ref(null);
    function chooseImages() {
      common_vendor.index.chooseImage({
        count: 4 - tempFiles.value.length,
        sizeType: ["compressed"],
        sourceType: ["album", "camera"],
        success: (res) => {
          tempFiles.value = [...tempFiles.value, ...res.tempFilePaths];
        }
      });
    }
    function removeImage(index) {
      tempFiles.value.splice(index, 1);
    }
    async function startDiagnose() {
      if (!tempFiles.value.length || diagnosing.value)
        return;
      diagnosing.value = true;
      diagnosisResult.value = null;
      try {
        const result = await api_multimodal.diagnoseImage(tempFiles.value[0]);
        diagnosisResult.value = result;
      } catch (err) {
        utils_error.handleError(err, { fallbackMsg: "诊断失败" });
      } finally {
        diagnosing.value = false;
      }
    }
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.p({
          title: "病虫害诊断",
          ["show-back"]: true
        }),
        b: !tempFiles.value.length
      }, !tempFiles.value.length ? {} : common_vendor.e({
        c: common_vendor.f(tempFiles.value, (file, i, i0) => {
          return {
            a: file,
            b: common_vendor.o(($event) => removeImage(i), i),
            c: i
          };
        }),
        d: tempFiles.value.length < 4
      }, tempFiles.value.length < 4 ? {
        e: common_vendor.o(chooseImages, "d7")
      } : {}), {
        f: tempFiles.value.length
      }, tempFiles.value.length ? {
        g: common_vendor.t(tempFiles.value.length)
      } : {}, {
        h: common_vendor.o(chooseImages, "9c"),
        i: !diagnosing.value
      }, !diagnosing.value ? {} : {}, {
        j: !tempFiles.value.length || diagnosing.value,
        k: common_vendor.o(startDiagnose, "f5"),
        l: diagnosisResult.value
      }, diagnosisResult.value ? common_vendor.e({
        m: diagnosisResult.value.summary
      }, diagnosisResult.value.summary ? {
        n: common_vendor.t(diagnosisResult.value.summary)
      } : {}, {
        o: common_vendor.f(diagnosisResult.value.results || [], (r, i, i0) => {
          return {
            a: i,
            b: "3014a9b4-1-" + i0,
            c: common_vendor.p({
              result: r
            })
          };
        })
      }) : {});
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-3014a9b4"]]);
wx.createPage(MiniProgramPage);
