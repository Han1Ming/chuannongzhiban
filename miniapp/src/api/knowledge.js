import { get } from './request'

// 知识库列表
export function getKnowledgeList(category = '') {
  const params = {}
  if (category) params.category = category
  return get('/api/knowledge/list', params)
}

// RAG 检索知识库
// 返回 { items, total, source_meta }：
//   items[].retrieval 为 vector（向量检索）或 keyword（嵌入不可用时的本地关键词降级）
//   source_meta 含 document_count / retrieval_mode / embedding_available
export function searchKnowledge(query, topK = 3) {
  return get('/api/knowledge/search', { query, top_k: topK })
}
