import req from './request'
export const calculateBudget = d => req.post('/api/farm/calculate', d)
export const matchRecommendation = d => req.post('/api/farm/match', d)
