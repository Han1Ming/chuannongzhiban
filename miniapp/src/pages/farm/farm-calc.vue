<template>
  <view class="farm-calc-page">
    <NavBar title="收益计算" :show-back="true" />

    <scroll-view class="calc-scroll" scroll-y>
      <!-- 输入区域 -->
      <view class="input-card">
        <view class="input-row">
          <text class="input-label">🌾 种植面积</text>
          <view class="input-with-unit">
            <input class="input-field" v-model.number="area" type="digit" placeholder="0" />
            <text class="unit">亩</text>
          </view>
        </view>
        <view class="input-row">
          <text class="input-label">💰 每亩成本</text>
          <view class="input-with-unit">
            <input class="input-field" v-model.number="costPerMu" type="digit" placeholder="0" />
            <text class="unit">元/亩</text>
          </view>
        </view>
        <view class="input-row">
          <text class="input-label">🌱 每亩产量</text>
          <view class="input-with-unit">
            <input class="input-field" v-model.number="yieldPerMu" type="digit" placeholder="0" />
            <text class="unit">斤/亩</text>
          </view>
        </view>
        <view class="input-row">
          <text class="input-label">🏷️ 单价</text>
          <view class="input-with-unit">
            <input class="input-field" v-model.number="pricePerUnit" type="digit" placeholder="0" />
            <text class="unit">元/斤</text>
          </view>
        </view>
      </view>

      <button class="calc-btn" :disabled="!area || !costPerMu || calculating" @tap="calculate">
        <text v-if="!calculating">📊 计算收益</text>
        <text v-else>⏳ 计算中...</text>
      </button>

      <!-- 结果 -->
      <view class="result-card" v-if="result">
        <view class="result-item">
          <text class="result-label">总成本</text>
          <text class="result-value">¥{{ formatMoney(result.total_cost) }}</text>
        </view>
        <view class="result-divider" />
        <view class="result-item">
          <text class="result-label">总收入</text>
          <text class="result-value green">¥{{ formatMoney(result.total_income) }}</text>
        </view>
        <view class="result-divider" />
        <view class="result-item highlight">
          <text class="result-label">净利润</text>
          <text class="result-value" :class="result.net_profit >= 0 ? 'green' : 'red'">
            ¥{{ formatMoney(result.net_profit) }}
          </text>
        </view>
        <view class="result-divider" />
        <view class="result-item">
          <text class="result-label">投资回报率</text>
          <text class="result-value">{{ formatNumber(result.roi) }}倍</text>
        </view>
      </view>

      <view class="bottom-safe" />
    </scroll-view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import NavBar from '@/components/NavBar.vue'
import { calculateBudget } from '@/api/farm'
import { handleError } from '@/utils/error'

const area = ref('')
const costPerMu = ref('')
const yieldPerMu = ref('')
const pricePerUnit = ref('')
const calculating = ref(false)
const result = ref(null)

function formatMoney(num) {
  if (num == null) return '0.00'
  return Number(num).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatNumber(num) {
  if (num == null) return '0'
  return Number(num).toFixed(1)
}

async function calculate() {
  const a = parseFloat(area.value) || 0
  const c = parseFloat(costPerMu.value) || 0
  const y = parseFloat(yieldPerMu.value) || 0
  const p = parseFloat(pricePerUnit.value) || 0

  if (a <= 0) {
    uni.showToast({ title: '请输入种植面积', icon: 'none' })
    return
  }

  calculating.value = true
  result.value = null
  try {
    const data = await calculateBudget(a, c, y, p)
    result.value = data  // 后端返回 {total_cost, total_income, net_profit, roi}
  } catch (err) {
    handleError(err, { fallbackMsg: '计算失败，请重试' })
  } finally {
    calculating.value = false
  }
}
</script>

<style scoped>
.farm-calc-page {
  min-height: 100vh;
  background: #FDF8F3;
}
.calc-scroll {
  padding: 0 16px;
  height: calc(100vh - 44px);
}
.input-card {
  background: #fff;
  border-radius: 16px;
  padding: 20px;
  margin: 16px 0;
}
.input-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #F0ECE4;
}
.input-row:last-child {
  border-bottom: none;
}
.input-label {
  font-size: 15px;
  color: #2C1810;
  font-weight: 500;
}
.input-with-unit {
  display: flex;
  align-items: center;
  gap: 4px;
}
.input-field {
  text-align: right;
  font-size: 15px;
  color: #2D7A4A;
  font-weight: 600;
  width: 80px;
  height: 30px;
  border-bottom: 1px solid #E8E0D4;
  padding: 0 4px;
}
.unit {
  font-size: 12px;
  color: #8B7355;
}
.calc-btn {
  width: 100%;
  padding: 16px;
  background: linear-gradient(135deg, #2D7A4A, #1A4A2E);
  border-radius: 14px;
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  border: none;
  box-shadow: 0 4px 16px rgba(45, 122, 74, 0.3);
}
.calc-btn[disabled] {
  opacity: 0.5;
  box-shadow: none;
}
.result-card {
  background: #fff;
  border-radius: 16px;
  padding: 20px;
  margin: 16px 0;
  border: 1px solid #E8F5E9;
}
.result-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
}
.result-label {
  font-size: 14px;
  color: #8B7355;
}
.result-value {
  font-size: 16px;
  font-weight: 700;
  color: #2C1810;
}
.result-value.green { color: #2D7A4A; }
.result-value.red { color: #DC2626; }
.result-divider {
  height: 1px;
  background: #F0ECE4;
}
.highlight {
  background: #F8F6F2;
  border-radius: 10px;
  padding: 12px 16px;
  margin: 4px -16px;
}
.bottom-safe { height: 30px; }
</style>
