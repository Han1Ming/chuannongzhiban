import req from './request'

export const getKnowledgeList = cat => req.get('/api/knowledge/list', { params: cat ? { category: cat } : {} })

/**
 * 检索知识库切片。
 *
 * 返回结构（与 /api/admin/knowledge/search 保持一致）：
 * ```jsonc
 * {
 *   "items": [
 *     { "content": "...", "metadata": {...}, "score": 0.38, "similarity": 0.73,
 *       "source": "四川省植保站", "retrieval": "vector" }
 *   ],
 *   "total": 5,
 *   "source_meta": { "document_count": 10, "retrieval_mode": "keyword",
 *                    "embedding_available": false, "embedding_error": "..." }
 * }
 * ```
 * `retrieval` 为 `vector`（向量检索）或 `keyword`（嵌入不可用时的本地关键词降级）。
 * @param {string} q 查询文本
 * @param {number} [k] 返回条数
 */
export const searchKnowledge = (q, k = 3) =>
  req.get('/api/knowledge/search', { params: { query: q, top_k: k } })

export const createKnowledge = d => req.post('/api/knowledge/create', d)
export const deleteKnowledge = id => req.delete(`/api/knowledge/${id}`)
