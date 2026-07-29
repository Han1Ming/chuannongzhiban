import req from './request'
export const getLatestNews = (l=10) => req.get('/api/news/latest', { params: { limit: l } })
export const getNewsList = (page=1, pageSize=15, keyword='') => req.get('/api/news/list', { params: { page, page_size: pageSize, keyword: keyword || undefined } })
export const searchNews = (kw, l=20) => req.get('/api/news/search', { params: { keyword: kw, limit: l } })
export const getNewsDetail = id => req.get(`/api/news/${id}`)
export const syncNews = (n=10, p=1) => req.post('/api/news/sync', null, { params: { num: n, page: p } })
export const deleteNews = id => req.delete(`/api/news/${id}`)
export const toggleNewsTop = id => req.post(`/api/news/${id}/top`)
