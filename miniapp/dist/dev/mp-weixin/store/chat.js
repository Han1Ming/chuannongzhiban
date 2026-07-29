"use strict";
const common_vendor = require("../common/vendor.js");
const utils_auth = require("../utils/auth.js");
function storageKey() {
  const token = utils_auth.getToken();
  return token ? `cnzb_chats_${token.slice(-8)}` : "cnzb_chats_anonymous";
}
const useChatStore = common_vendor.defineStore("chat", () => {
  const conversations = common_vendor.ref(loadConversations());
  const currentId = common_vendor.ref(null);
  const isStreaming = common_vendor.ref(false);
  const currentMessages = common_vendor.computed(
    () => {
      var _a;
      return ((_a = conversations.value.find((c) => c.id === currentId.value)) == null ? void 0 : _a.messages) || [];
    }
  );
  const currentTitle = common_vendor.computed(
    () => {
      var _a;
      return ((_a = conversations.value.find((c) => c.id === currentId.value)) == null ? void 0 : _a.title) || "新对话";
    }
  );
  const currentSessionId = common_vendor.computed(
    () => {
      var _a;
      return ((_a = conversations.value.find((c) => c.id === currentId.value)) == null ? void 0 : _a.session_id) || null;
    }
  );
  function newConversation() {
    const id = Date.now().toString();
    conversations.value.unshift({
      id,
      title: "新对话",
      messages: [],
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      session_id: null
    });
    currentId.value = id;
    save();
    return id;
  }
  function addMessage(role, content, extra = {}) {
    let conv = conversations.value.find((c) => c.id === currentId.value);
    if (!conv) {
      currentId.value = newConversation();
      conv = conversations.value.find((c) => c.id === currentId.value);
    }
    conv.messages.push({
      role,
      content,
      time: (/* @__PURE__ */ new Date()).toISOString(),
      ...extra
    });
    if (role === "user" && conv.messages.filter((m) => m.role === "user").length === 1) {
      conv.title = content.slice(0, 28) + (content.length > 28 ? "..." : "");
    }
    save();
    scrollToBottom();
  }
  function updateLastMessage(content) {
    const conv = conversations.value.find((c) => c.id === currentId.value);
    if (!conv || !conv.messages.length)
      return;
    const last = conv.messages[conv.messages.length - 1];
    last.content = content;
    last.loading = false;
    save();
  }
  function updateSessionId(sessionId) {
    const conv = conversations.value.find((c) => c.id === currentId.value);
    if (conv) {
      conv.session_id = sessionId;
      save();
    }
  }
  function hydrateFromServer(sessionId, title, messages) {
    let conv = conversations.value.find((c) => c.session_id === sessionId);
    if (!conv) {
      conv = {
        id: Date.now().toString(),
        title: title || "历史对话",
        messages: [],
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        session_id: sessionId
      };
      conversations.value.unshift(conv);
    }
    conv.messages = messages.map((m) => ({
      role: m.role,
      content: m.content,
      time: m.created_at
    }));
    currentId.value = conv.id;
    save();
  }
  function switchConversation(id) {
    currentId.value = id;
  }
  function deleteConversation(id) {
    var _a;
    conversations.value = conversations.value.filter((c) => c.id !== id);
    if (currentId.value === id) {
      currentId.value = ((_a = conversations.value[0]) == null ? void 0 : _a.id) || null;
    }
    save();
  }
  function clearAll() {
    conversations.value = [];
    currentId.value = null;
    save();
  }
  function loadConversations() {
    try {
      return common_vendor.index.getStorageSync(storageKey()) || [];
    } catch {
      return [];
    }
  }
  function save() {
    try {
      common_vendor.index.setStorageSync(storageKey(), conversations.value.slice(0, 100));
    } catch (e) {
      console.error("保存聊天记录失败", e);
    }
  }
  function scrollToBottom() {
    common_vendor.index.nextTick(() => {
    });
  }
  return {
    conversations,
    currentId,
    isStreaming,
    currentMessages,
    currentTitle,
    currentSessionId,
    newConversation,
    addMessage,
    updateLastMessage,
    updateSessionId,
    hydrateFromServer,
    switchConversation,
    deleteConversation,
    clearAll
  };
});
exports.useChatStore = useChatStore;
