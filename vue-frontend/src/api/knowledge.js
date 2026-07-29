import req from './request'
export const getKnowledgeList = cat => req.get('/api/knowledge/list', { params: cat ? { category: cat } : {} })
export const searchKnowledge = (q, k=3) => req.get('/api/knowledge/search', { params: { query: q, top_k: k } })
export const createKnowledge = d => req.post('/api/knowledge/create', d)
export const deleteKnowledge = id => req.delete(`/api/knowledge/${id}`)
