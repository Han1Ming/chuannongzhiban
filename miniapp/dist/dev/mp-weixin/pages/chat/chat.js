"use strict";
const common_vendor = require("../../common/vendor.js");
const store_chat = require("../../store/chat.js");
const store_auth = require("../../store/auth.js");
const api_chat = require("../../api/chat.js");
const api_multimodal = require("../../api/multimodal.js");
const utils_constants = require("../../utils/constants.js");
const utils_format = require("../../utils/format.js");
const utils_error = require("../../utils/error.js");
if (!Math) {
  (NavBar + MarkdownRender)();
}
const NavBar = () => "../../components/NavBar.js";
const MarkdownRender = () => "../../components/MarkdownRender.js";
const _sfc_main = {
  __name: "chat",
  setup(__props) {
    const chat = store_chat.useChatStore();
    const authStore = store_auth.useAuthStore();
    const inputText = common_vendor.ref("");
    const previewImage = common_vendor.ref("");
    const pendingImage = common_vendor.ref(null);
    const showSessions = common_vendor.ref(false);
    const scrollToId = common_vendor.ref("");
    const quickQuestions = utils_constants.QUICK_QUESTIONS;
    const isRecording = common_vendor.ref(false);
    let recorder = null;
    common_vendor.onMounted(async () => {
      if (!authStore.isLoggedIn) {
        common_vendor.index.navigateTo({ url: "/pages/login/login" });
        return;
      }
      await loadServerSession();
      if (!chat.currentId && !chat.conversations.length) {
        chat.newConversation();
      }
      recorder = common_vendor.index.getRecorderManager();
      recorder.onStop(async (res) => {
        if (!res.tempFilePath)
          return;
        common_vendor.index.showLoading({ title: "识别中..." });
        try {
          const result = await api_multimodal.voiceToText(res.tempFilePath);
          const text = (result == null ? void 0 : result.text) || result || "";
          if (text)
            inputText.value = text;
        } catch (err) {
          utils_error.handleError(err, { fallbackMsg: "语音识别失败" });
        }
        common_vendor.index.hideLoading();
      });
      common_vendor.index.$on("quick-question", (q) => {
        send(q);
      });
    });
    common_vendor.onUnmounted(() => {
      common_vendor.index.$off("quick-question");
    });
    async function loadServerSession() {
      try {
        const sessions = await api_chat.fetchSessions(1, 0);
        if (sessions == null ? void 0 : sessions.length) {
          const latest = sessions[0];
          const messages = await api_chat.fetchSessionMessages(latest.id);
          if (messages == null ? void 0 : messages.length) {
            chat.hydrateFromServer(latest.id, latest.title, messages);
          }
        }
      } catch {
      }
    }
    common_vendor.watch(() => chat.currentMessages.length, () => {
      scrollToBottom();
    });
    common_vendor.watch(() => {
      const msgs = chat.currentMessages;
      return msgs.length ? msgs[msgs.length - 1].content : "";
    }, () => {
      scrollToBottom();
    });
    function formatTime(time) {
      return utils_format.relativeTime(time);
    }
    function scrollToBottom() {
      const msgs = chat.currentMessages;
      if (!msgs.length)
        return;
      common_vendor.nextTick$1(() => {
        scrollToId.value = "msg-" + (msgs.length - 1);
      });
    }
    async function send(text) {
      const msg = (text || inputText.value || "").trim();
      if (!msg && !pendingImage.value)
        return;
      if (chat.isStreaming)
        return;
      if (pendingImage.value) {
        await doDiagnose();
        return;
      }
      inputText.value = "";
      chat.isStreaming = true;
      if (!chat.currentId)
        chat.newConversation();
      chat.addMessage("user", msg);
      chat.addMessage("assistant", "", { loading: true });
      try {
        const result = await api_chat.chatSync(msg, chat.currentSessionId);
        chat.updateLastMessage(result.response || "抱歉，未获取到回答");
        if (result.session_id)
          chat.updateSessionId(result.session_id);
      } catch (err) {
        const { message } = utils_error.handleError(err, { fallbackMsg: "请求失败，请检查网络", showToast: false });
        chat.updateLastMessage(message);
        chat.currentMessages[chat.currentMessages.length - 1].isError = true;
      } finally {
        chat.isStreaming = false;
      }
    }
    function stopStream() {
      chat.isStreaming = false;
    }
    function chooseImage() {
      common_vendor.index.chooseImage({
        count: 1,
        sizeType: ["compressed"],
        sourceType: ["album", "camera"],
        success: (res) => {
          pendingImage.value = res.tempFilePaths[0];
          previewImage.value = res.tempFilePaths[0];
        }
      });
    }
    async function doDiagnose() {
      var _a;
      if (!pendingImage.value)
        return;
      chat.isStreaming = true;
      chat.addMessage("user", "[图片诊断]", { type: "image" });
      chat.addMessage("assistant", "", { loading: true });
      try {
        const result = await api_multimodal.diagnoseImage(pendingImage.value);
        let response = "🔬 图片诊断完成\n\n";
        if (result.summary)
          response += result.summary + "\n\n";
        if ((_a = result.results) == null ? void 0 : _a.length) {
          result.results.forEach((r, i) => {
            response += `**${i + 1}. ${r.filename || "图片"}**
`;
            response += `- 诊断：${r.diagnosis || "无法识别"}
`;
            if (r.severity)
              response += `- 严重程度：${r.severity}
`;
            if (r.confidence)
              response += `- 置信度：${(r.confidence * 100).toFixed(1)}%
`;
            if (r.advice)
              response += `- 建议：${r.advice}
`;
            response += "\n";
          });
        }
        chat.updateLastMessage(response.trim());
      } catch {
        chat.updateLastMessage("⚠️ 图片诊断失败，请重试");
      } finally {
        clearPreview();
        chat.isStreaming = false;
      }
    }
    function clearPreview() {
      previewImage.value = "";
      pendingImage.value = null;
    }
    function onMicTouchStart() {
      if (!recorder)
        return;
      isRecording.value = true;
      recorder.start({ format: "mp3", sampleRate: 16e3, duration: 6e4 });
    }
    function onMicTouchEnd() {
      if (!recorder)
        return;
      isRecording.value = false;
      recorder.stop();
    }
    async function playTTS(content) {
      const clean = content.replace(/<[^>]*>/g, "").replace(/\*\*/g, "").slice(0, 500);
      common_vendor.index.showLoading({ title: "生成语音..." });
      try {
        const res = await api_multimodal.textToSpeech(clean);
        if (res == null ? void 0 : res.audio_base64) {
          const ctx = common_vendor.index.createInnerAudioContext();
          ctx.src = `data:audio/${res.format || "mp3"};base64,${res.audio_base64}`;
          ctx.play();
        } else {
          common_vendor.index.showToast({ title: "语音合成失败", icon: "none" });
        }
      } catch {
        common_vendor.index.showToast({ title: "语音合成失败", icon: "none" });
      }
      common_vendor.index.hideLoading();
    }
    function copyText(content) {
      const clean = content.replace(/<[^>]*>/g, "").replace(/\*\*/g, "");
      common_vendor.index.setClipboardData({ data: clean, success: () => common_vendor.index.showToast({ title: "已复制", icon: "success" }) });
    }
    function startNew() {
      chat.newConversation();
      showSessions.value = false;
    }
    function switchSession(id) {
      chat.switchConversation(id);
      showSessions.value = false;
    }
    function deleteSession(id) {
      common_vendor.index.showModal({
        title: "确认删除",
        content: "删除后无法恢复",
        success: (res) => {
          if (res.confirm)
            chat.deleteConversation(id);
        }
      });
    }
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.o(($event) => showSessions.value = true, "d1"),
        b: common_vendor.o(startNew, "7b"),
        c: common_vendor.p({
          title: "AI智能问答"
        }),
        d: !common_vendor.unref(chat).currentMessages.length && !common_vendor.unref(chat).isStreaming
      }, !common_vendor.unref(chat).currentMessages.length && !common_vendor.unref(chat).isStreaming ? {
        e: common_vendor.f(common_vendor.unref(quickQuestions), (q, i, i0) => {
          return {
            a: common_vendor.t(q),
            b: i,
            c: common_vendor.o(($event) => send(q), i)
          };
        })
      } : {}, {
        f: common_vendor.unref(chat).currentMessages.length
      }, common_vendor.unref(chat).currentMessages.length ? {
        g: common_vendor.f(common_vendor.unref(chat).currentMessages, (m, i, i0) => {
          return common_vendor.e({
            a: m.role === "assistant"
          }, m.role === "assistant" ? {} : {}, {
            b: m.role === "user"
          }, m.role === "user" ? {
            c: common_vendor.t(m.content)
          } : common_vendor.e({
            d: m.content && !m.loading
          }, m.content && !m.loading ? {
            e: "a041b13f-1-" + i0,
            f: common_vendor.p({
              content: m.content
            })
          } : m.loading ? {} : m.isError ? {
            i: common_vendor.t(m.content || "请求失败")
          } : {}, {
            g: m.loading,
            h: m.isError,
            j: m.content && !m.loading
          }, m.content && !m.loading ? {
            k: common_vendor.o(($event) => playTTS(m.content), i),
            l: common_vendor.o(($event) => copyText(m.content), i)
          } : {}), {
            m: m.time
          }, m.time ? {
            n: common_vendor.t(formatTime(m.time))
          } : {}, {
            o: m.role === "user"
          }, m.role === "user" ? {} : {}, {
            p: i,
            q: "msg-" + i,
            r: common_vendor.n(m.role === "user" ? "msg-row-user" : "msg-row-ai")
          });
        })
      } : {}, {
        h: scrollToId.value,
        i: common_vendor.o(scrollToBottom, "c6"),
        j: previewImage.value
      }, previewImage.value ? {
        k: previewImage.value,
        l: common_vendor.o(clearPreview, "89")
      } : {}, {
        m: common_vendor.o(chooseImage, "d4"),
        n: isRecording.value ? 1 : "",
        o: common_vendor.o(onMicTouchStart, "26"),
        p: common_vendor.o(onMicTouchEnd, "4d"),
        q: common_vendor.o(($event) => send(inputText.value), "3e"),
        r: common_vendor.unref(chat).isStreaming,
        s: inputText.value,
        t: common_vendor.o(($event) => inputText.value = $event.detail.value, "5d"),
        v: !common_vendor.unref(chat).isStreaming
      }, !common_vendor.unref(chat).isStreaming ? {
        w: !inputText.value.trim() && !previewImage.value ? 1 : "",
        x: common_vendor.o(($event) => send(inputText.value), "1e")
      } : {
        y: common_vendor.o(stopStream, "ea")
      }, {
        z: showSessions.value
      }, showSessions.value ? {
        A: common_vendor.o(($event) => showSessions.value = false, "35")
      } : {}, {
        B: common_vendor.o(($event) => showSessions.value = false, "b1"),
        C: common_vendor.f(common_vendor.unref(chat).conversations, (c, k0, i0) => {
          return {
            a: common_vendor.t(c.title),
            b: common_vendor.t(formatTime(c.createdAt)),
            c: common_vendor.o(($event) => deleteSession(c.id), c.id),
            d: c.id,
            e: c.id === common_vendor.unref(chat).currentId ? 1 : "",
            f: common_vendor.o(($event) => switchSession(c.id), c.id)
          };
        }),
        D: showSessions.value ? 1 : ""
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-a041b13f"]]);
wx.createPage(MiniProgramPage);
