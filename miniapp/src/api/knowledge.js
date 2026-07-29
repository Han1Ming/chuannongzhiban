import { get } from './request'

// 知识库列表
export function getKnowledgeList(category = '') {
  const params = {}
  if (category) params.category = category
  return get('/api/knowledge/list', params)
}

// RAG 检索知识库
export function searchKnowledge(query, topK = 3) {
  return get('/api/knowledge/search', { query, top_k: topK })
}
