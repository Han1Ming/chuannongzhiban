export const NODE_COLORS = {
  Disease: '#E74C3C',
  Symptom: '#F39C12',
  Crop: '#27AE60',
  Drug: '#3498DB',
  Ingredient: '#9B59B6',
  Channel: '#95A5A6'
}

export const NODE_LABELS = {
  Disease: '病害',
  Symptom: '症状',
  Crop: '作物/畜种',
  Drug: '农药/兽药',
  Ingredient: '药物成分',
  Channel: '购买渠道'
}

export const NODE_SIZES = {
  Disease: 58,
  Symptom: 44,
  Crop: 68,
  Drug: 52,
  Ingredient: 36,
  Channel: 42
}

export const RELATION_LABELS = {
  HARMS: '危害',
  MANIFESTS: '表现为',
  TREATED_BY: '可用药',
  HAS_INGREDIENT: '成分为',
  AVAILABLE_AT: '可购买于'
}

export const TYPE_ORDER = ['Disease', 'Symptom', 'Crop', 'Drug', 'Ingredient', 'Channel']
export const RELATION_ORDER = ['HARMS', 'MANIFESTS', 'TREATED_BY', 'HAS_INGREDIENT', 'AVAILABLE_AT']

export function buildNodeKey(a, b) {
  return [a, b].sort().join('::')
}
