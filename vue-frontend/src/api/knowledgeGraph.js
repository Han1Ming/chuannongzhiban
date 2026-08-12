import req from './request'

export const fetchGraphOverview = () => req.get('/api/knowledge-graph/overview')

export const searchGraphNodes = keyword =>
  req.get('/api/knowledge-graph/search', { params: { keyword } })

export const fetchGraphNode = name =>
  req.get(`/api/knowledge-graph/node/${encodeURIComponent(name)}`)

export const fetchGraphRecommend = () => req.get('/api/knowledge-graph/recommend')

export const fetchGraphPath = (fromNode, toNode) =>
  req.post('/api/knowledge-graph/path', { from: fromNode, to: toNode })
