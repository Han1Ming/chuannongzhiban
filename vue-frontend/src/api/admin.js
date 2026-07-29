import req from './request'
// ===== 用户管理 =====
export const getAdminUserList = () => req.get('/api/admin/user/list')
export const getAdminUserListPaginated = (page=1, pageSize=20, keyword='') =>
  req.get('/api/admin/user/list-paginated', { params: { page, page_size: pageSize, keyword: keyword || undefined } })
export const updateAdminUser = (id, p) => req.put(`/api/admin/user/${id}`, p)
export const deleteAdminUser = id => req.delete(`/api/admin/user/${id}`)
export const getUserChatData = userId => req.get(`/api/admin/user/${userId}/chat-data`)

// ===== 子管理员管理 =====
export const createSubAdmin = data => req.post('/api/admin/admin/create', data)
export const getSubAdminList = () => req.get('/api/admin/admin/list')
export const getSubAdminListPaginated = (page=1, pageSize=20) =>
  req.get('/api/admin/admin/list-paginated', { params: { page, page_size: pageSize } })
export const deleteSubAdmin = id => req.delete(`/api/admin/admin/${id}`)

// ===== 公告管理 =====
export const createAnnouncement = d => req.post('/api/admin/announcement', d)
export const getAnnouncementList = () => req.get('/api/admin/announcement/list')
export const getAnnouncementListPaginated = (page=1, pageSize=20, category='') =>
  req.get('/api/admin/announcement/list-paginated', { params: { page, page_size: pageSize, category: category || undefined } })
export const updateAnnouncement = (id, p) => req.put(`/api/admin/announcement/${id}`, p)
export const deleteAnnouncement = id => req.delete(`/api/admin/announcement/${id}`)

// ===== 新闻管理（管理员） =====
export const getAdminNewsList = (page=1, pageSize=50) =>
  req.get('/api/admin/news/all', { params: { page, page_size: pageSize } })

// ===== 知识库管理（管理员） =====
export const getAdminKnowledgeListPaginated = (page=1, pageSize=20, category='') =>
  req.get('/api/admin/knowledge/list-paginated', { params: { page, page_size: pageSize, category: category || undefined } })
export const uploadKnowledgeFile = file => {
  const fd = new FormData(); fd.append('file', file)
  return req.post('/api/admin/knowledge/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
}
export const searchKnowledgeAdmin = (query, topK=3) =>
  req.post('/api/admin/knowledge/search', null, { params: { query, top_k: topK } })

// ===== 三个数据表（管理员） =====
export const getFarmRecords = (page=1, pageSize=20, userId) =>
  req.get('/api/admin/farm-records', { params: { page, page_size: pageSize, user_id: userId || undefined } })
export const getAdminKnowledgeItems = (page=1, pageSize=20, category='') =>
  req.get('/api/admin/knowledge-items', { params: { page, page_size: pageSize, category: category || undefined } })
export const getRecommendations = (page=1, pageSize=20, region='') =>
  req.get('/api/admin/recommendations', { params: { page, page_size: pageSize, region: region || undefined } })
