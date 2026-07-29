import { post } from './request'

// 收益计算
export function calculateBudget(area, costPerMu, yieldPerMu, pricePerUnit) {
  return post('/api/farm/calculate', {
    area,
    cost_per_mu: costPerMu,
    yield_per_mu: yieldPerMu,
    price_per_unit: pricePerUnit
  })
}

// 作物匹配
export function matchRecommendation(region, farmingType, season) {
  return post('/api/farm/match', {
    region,
    farming_type: farmingType,
    season
  })
}
