"use strict";
const api_request = require("./request.js");
function getKnowledgeList(category = "") {
  const params = {};
  if (category)
    params.category = category;
  return api_request.get("/api/knowledge/list", params);
}
function searchKnowledge(query, topK = 3) {
  return api_request.get("/api/knowledge/search", { query, top_k: topK });
}
exports.getKnowledgeList = getKnowledgeList;
exports.searchKnowledge = searchKnowledge;
