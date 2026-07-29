"use strict";
const api_request = require("./request.js");
function calculateBudget(area, costPerMu, yieldPerMu, pricePerUnit) {
  return api_request.post("/api/farm/calculate", {
    area,
    cost_per_mu: costPerMu,
    yield_per_mu: yieldPerMu,
    price_per_unit: pricePerUnit
  });
}
function matchRecommendation(region, farmingType, season) {
  return api_request.post("/api/farm/match", {
    region,
    farming_type: farmingType,
    season
  });
}
exports.calculateBudget = calculateBudget;
exports.matchRecommendation = matchRecommendation;
