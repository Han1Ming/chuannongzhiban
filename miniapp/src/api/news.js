import { get, optionalGet } from './request'

// 最新新闻（可选认证，未登录返回 null）
export function getLatestNews(limit = 3) {
  return get('/api/news/latest', { limit })
}
export function getLatestNewsOptional(limit = 3) {
  return optionalGet('/api/news/latest', { limit })
}

// 分页新闻列表（可选认证，未登录返回 null）
export function getNewsList(page = 1, pageSize = 15, keyword = '') {
  const params = { page, page_size: pageSize }
  if (keyword) params.keyword = keyword
  return get('/api/news/list', params)
}
export function getNewsListOptional(page = 1, pageSize = 15, keyword = '') {
  const params = { page, page_size: pageSize }
  if (keyword) params.keyword = keyword
  return optionalGet('/api/news/list', params)
}

// 搜索新闻
export function searchNews(keyword, limit = 20) {
  return get('/api/news/search', { keyword, limit })
}

// 新闻详情
export function getNewsDetail(id) {
  return get(`/api/news/${id}`)
}
