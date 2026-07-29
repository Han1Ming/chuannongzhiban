"use strict";
const api_request = require("./request.js");
function getLatestNews(limit = 3) {
  return api_request.get("/api/news/latest", { limit });
}
function getLatestNewsOptional(limit = 3) {
  return api_request.optionalGet("/api/news/latest", { limit });
}
function getNewsList(page = 1, pageSize = 15, keyword = "") {
  const params = { page, page_size: pageSize };
  if (keyword)
    params.keyword = keyword;
  return api_request.get("/api/news/list", params);
}
function getNewsListOptional(page = 1, pageSize = 15, keyword = "") {
  const params = { page, page_size: pageSize };
  if (keyword)
    params.keyword = keyword;
  return api_request.optionalGet("/api/news/list", params);
}
function searchNews(keyword, limit = 20) {
  return api_request.get("/api/news/search", { keyword, limit });
}
function getNewsDetail(id) {
  return api_request.get(`/api/news/${id}`);
}
exports.getLatestNews = getLatestNews;
exports.getLatestNewsOptional = getLatestNewsOptional;
exports.getNewsDetail = getNewsDetail;
exports.getNewsList = getNewsList;
exports.getNewsListOptional = getNewsListOptional;
exports.searchNews = searchNews;
