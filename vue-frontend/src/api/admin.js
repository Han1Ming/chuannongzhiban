import req from './request'
// ===== 用户管理 =====
export const getAdminUserList = (role) => req.get('/api/admin/user/list', { params: { role: role || undefined } })
/**
 * 分页用户列表。
 * @param {number} page
 * @param {number} pageSize
 * @param {string} [keyword] 手机号/用户名模糊搜索
 * @param {string} [role] 角色过滤：USER / ADMIN / GOV；留空表示全部角色
 * 返回项含 role 字段（修复前缺失，导致管理端角色列渲染不出标签）
 */
export const getAdminUserListPaginated = (page = 1, pageSize = 20, keyword = '', role = '') =>
  req.get('/api/admin/user/list-paginated', {
    params: { page, page_size: pageSize, keyword: keyword || undefined, role: role || undefined }
  })
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
export const searchKnowledgeAdmin = (query, topK = 3, mode = 'auto') =>
  req.post('/api/admin/knowledge/search', null, { params: { query, top_k: topK, mode } })
/** 知识库与检索通道状态：条目数、当前检索通道、嵌入服务是否可用 */
export const getKnowledgeStats = () => req.get('/api/admin/knowledge/stats')

// ===== 三个数据表（管理员） =====
export const getFarmRecords = (page=1, pageSize=20, userId) =>
  req.get('/api/admin/farm-records', { params: { page, page_size: pageSize, user_id: userId || undefined } })
export const getAdminKnowledgeItems = (page=1, pageSize=20, category='') =>
  req.get('/api/admin/knowledge-items', { params: { page, page_size: pageSize, category: category || undefined } })
export const getRecommendations = (page=1, pageSize=20, region='') =>
  req.get('/api/admin/recommendations', { params: { page, page_size: pageSize, region: region || undefined } })
