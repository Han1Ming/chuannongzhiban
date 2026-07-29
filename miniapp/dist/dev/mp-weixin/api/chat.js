"use strict";
const api_request = require("./request.js");
function chatSync(query, sessionId) {
  const data = { query };
  if (sessionId)
    data.session_id = sessionId;
  return api_request.post("/chat/sync", data);
}
function fetchSessions(limit = 50, offset = 0) {
  return api_request.get("/chat/sessions", { limit, offset });
}
function fetchSessionMessages(sessionId) {
  return api_request.get(`/chat/sessions/${sessionId}/messages`);
}
exports.chatSync = chatSync;
exports.fetchSessionMessages = fetchSessionMessages;
exports.fetchSessions = fetchSessions;
