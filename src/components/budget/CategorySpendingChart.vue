<script setup>
import { ref, computed, onMounted } from 'vue'
import { useBudgetStore } from '@/stores/budget'
import { useFinanceStore } from '@/stores/finance'

const budgetStore = useBudgetStore()
const financeStore = useFinanceStore()

const chartType = ref('pie') // 'pie' or 'bar'
const timeRange = ref('current') // 'current', 'ytd', 'annual'

const spendingData = computed(() => {
  const performance = budgetStore.budgetPerformance.filter(p => p.categories?.type === 'expense')
  
  return performance.map(item => ({
    category: item.categories?.name || 'Unknown',
    icon: item.categories?.icon || '📊',
    amount: item.actual_amount,
    budget: item.budget_amount,
    percentage: 0 // Will be calculated
  }))
})

const totalSpending = computed(() => {
  return spendingData.value.reduce((total, item) => total + item.amount, 0)
})

const chartDataWithPercentage = computed(() => {
  const total = totalSpending.value
  return spendingData.value.map(item => ({
    ...item,
    percentage: total > 0 ? (item.amount / total * 100).toFixed(1) : 0
  })).sort((a, b) => b.amount - a.amount)
})

const topCategories = computed(() => {
  return chartDataWithPercentage.value.slice(0, 6)
})

const otherCategoriesTotal = computed(() => {
  const topTotal = topCategories.value.reduce((total, item) => total + item.amount, 0)
  return totalSpending.value - topTotal
})

const pieChartData = computed(() => {
  const data = [...topCategories.value]
  if (otherCategoriesTotal.value > 0) {
    data.push({
      category: 'Others',
      icon: '📦',
      amount: otherCategoriesTotal.value,
      percentage: ((otherCategoriesTotal.value / totalSpending.value) * 100).toFixed(1),
      budget: 0
    })
  }
  return data
})

const chartColors = [
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#f43f5e', // rose
  '#f97316', // orange
  '#eab308', // yellow
  '#84cc16', // lime
  '#22c55e', // green
  '#14b8a6', // teal
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#6366f1'  // indigo (repeat if needed)
]

const getChartColor = (index) => {
  return chartColors[index % chartColors.length]
}

const toggleChartType = () => {
  chartType.value = chartType.value === 'pie' ? 'bar' : 'pie'
}

onMounted(() => {
  // Data is loaded by parent component
})
</script>

<template>
  <div class="bg-white rounded-lg shadow p-6">
    <div class="flex items-center justify-between mb-6">
      <h3 class="text-lg font-semibold text-gray-900">Category Spending Breakdown</h3>
      <div class="flex space-x-2">
        <button
          @click="toggleChartType"
          class="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {{ chartType === 'pie' ? 'Bar Chart' : 'Pie Chart' }}
        </button>
      </div>
    </div>

    <div v-if="chartDataWithPercentage.length === 0" class="text-center py-12">
      <div class="mx-auto h-12 w-12 text-gray-400">
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
        </svg>
      </div>
      <h3 class="mt-2 text-sm font-medium text-gray-900">No spending data available</h3>
      <p class="mt-1 text-sm text-gray-500">Add transactions to see your spending breakdown.</p>
    </div>

    <div v-else>
      <!-- Total Spending Summary -->
      <div class="mb-6 p-4 bg-gray-50 rounded-lg">
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium text-gray-600">Total Spending</span>
          <span class="text-xl font-bold text-gray-900">
            {{ financeStore.formatIndianCurrency(totalSpending) }}
          </span>
        </div>
      </div>

      <!-- Pie Chart View -->
      <div v-if="chartType === 'pie'" class="space-y-6">
        <!-- Pie Chart Visualization -->
        <div class="relative h-64 flex items-center justify-center">
          <div class="relative">
            <svg class="w-64 h-64 transform -rotate-90">
              <circle
                cx="128"
                cy="128"
                r="100"
                fill="none"
                stroke="#e5e7eb"
                stroke-width="40"
              />
              <g v-for="(item, index) in pieChartData" :key="item.category">
                <circle
                  v-if="item.percentage > 0"
                  cx="128"
                  cy="128"
                  r="100"
                  fill="none"
                  :stroke="getChartColor(index)"
                  stroke-width="40"
                  :stroke-dasharray="`${(item.percentage / 100) * 628} 628`"
                  :stroke-dashoffset="`${pieChartData.slice(0, index).reduce((sum, prev) => sum + (prev.percentage / 100) * 628, 0)}`"
                  class="transition-all duration-300"
                />
              </g>
            </svg>
            <div class="absolute inset-0 flex items-center justify-center">
              <div class="text-center">
                <p class="text-2xl font-bold text-gray-900">
                  {{ chartDataWithPercentage.length }}
                </p>
                <p class="text-sm text-gray-500">Categories</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Legend -->
        <div class="grid grid-cols-2 gap-3">
          <div v-for="(item, index) in pieChartData" :key="item.category" 
               class="flex items-center space-x-2">
            <div class="w-3 h-3 rounded-full" :style="{ backgroundColor: getChartColor(index) }"></div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-900 truncate">
                {{ item.icon }} {{ item.category }}
              </p>
              <p class="text-xs text-gray-500">
                {{ item.percentage }}% • {{ financeStore.formatIndianCurrency(item.amount) }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Bar Chart View -->
      <div v-else class="space-y-4">
        <div v-for="(item, index) in topCategories" :key="item.category" class="space-y-2">
          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <span class="text-lg mr-2">{{ item.icon }}</span>
              <span class="text-sm font-medium text-gray-900">{{ item.category }}</span>
            </div>
            <div class="text-right">
              <span class="text-sm font-medium text-gray-900">
                {{ financeStore.formatIndianCurrency(item.amount) }}
              </span>
              <span class="text-xs text-gray-500 ml-1">({{ item.percentage }}%)</span>
            </div>
          </div>
          
          <!-- Progress Bar -->
          <div class="relative">
            <div class="w-full bg-gray-200 rounded-full h-4">
              <div 
                class="h-4 rounded-full transition-all duration-300 ease-in-out"
                :style="{
                  width: `${item.percentage}%`,
                  backgroundColor: getChartColor(index)
                }"
              ></div>
            </div>
          </div>

          <!-- Budget Comparison -->
          <div v-if="item.budget > 0" class="flex items-center justify-between text-xs text-gray-500">
            <span>Budget: {{ financeStore.formatIndianCurrency(item.budget) }}</span>
            <span :class="item.amount > item.budget ? 'text-red-600' : 'text-green-600'">
              {{ item.amount > item.budget ? 'Over' : 'Under' }} by 
              {{ financeStore.formatIndianCurrency(Math.abs(item.amount - item.budget)) }}
            </span>
          </div>
        </div>

        <!-- Others Category -->
        <div v-if="otherCategoriesTotal.value > 0" class="space-y-2 pt-4 border-t">
          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <span class="text-lg mr-2">📦</span>
              <span class="text-sm font-medium text-gray-900">Others</span>
            </div>
            <div class="text-right">
              <span class="text-sm font-medium text-gray-900">
                {{ financeStore.formatIndianCurrency(otherCategoriesTotal) }}
              </span>
              <span class="text-xs text-gray-500 ml-1">
                ({{ ((otherCategoriesTotal / totalSpending) * 100).toFixed(1) }}%)
              </span>
            </div>
          </div>
          
          <div class="relative">
            <div class="w-full bg-gray-200 rounded-full h-4">
              <div 
                class="h-4 rounded-full bg-gray-400 transition-all duration-300 ease-in-out"
                :style="{
                  width: `${(otherCategoriesTotal / totalSpending) * 100}%`
                }"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Insights -->
      <div class="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 class="text-sm font-medium text-blue-900 mb-2">💡 Insights</h4>
        <ul class="text-sm text-blue-800 space-y-1">
          <li v-if="topCategories.length > 0">
            <strong>{{ topCategories[0].category }}</strong> is your highest spending category 
            ({{ financeStore.formatIndianCurrency(topCategories[0].amount) }})
          </li>
          <li v-if="topCategories.length > 1">
            <strong>{{ topCategories[0].icon }}{{ topCategories[0].category }} and {{ topCategories[1].icon }}{{ topCategories[1].category }}</strong> 
            account for {{ (parseFloat(topCategories[0].percentage) + parseFloat(topCategories[1].percentage)).toFixed(1) }}% of total spending
          </li>
          <li v-if="chartDataWithPercentage.filter(item => item.amount > item.budget && item.budget > 0).length > 0">
            {{ chartDataWithPercentage.filter(item => item.amount > item.budget && item.budget > 0).length }} 
            categor{{ chartDataWithPercentage.filter(item => item.amount > item.budget && item.budget > 0).length === 1 ? 'y' : 'ies' }} 
            are over budget
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
