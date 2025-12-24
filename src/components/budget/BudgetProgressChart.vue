<script setup>
import { ref, computed, onMounted } from 'vue'
import { useBudgetStore } from '@/stores/budget'
import { useFinanceStore } from '@/stores/finance'

const budgetStore = useBudgetStore()
const financeStore = useFinanceStore()

const chartData = computed(() => {
  const performance = budgetStore.budgetPerformance.filter(p => p.categories?.type === 'expense')
  
  return performance.map(item => ({
    category: item.categories?.name || 'Unknown',
    icon: item.categories?.icon || '📊',
    budget: item.budget_amount,
    actual: item.actual_amount,
    remaining: item.budget_amount - item.actual_amount,
    utilization: item.utilization_percentage,
    status: item.status
  })).sort((a, b) => b.utilization - a.utilization)
})

const chartColors = {
  on_track: '#10b981',      // green
  warning: '#f59e0b',       // yellow
  over_budget: '#ef4444',    // red
  under_budget: '#6366f1'    // indigo
}

const getStatusColor = (status) => {
  return chartColors[status] || '#6b7280'
}

const getBarColor = (utilization) => {
  if (utilization >= 100) return chartColors.over_budget
  if (utilization >= 80) return chartColors.warning
  if (utilization >= 0) return chartColors.on_track
  return chartColors.under_budget
}

onMounted(() => {
  // Data is loaded by parent component
})
</script>

<template>
  <div class="bg-white rounded-lg shadow p-6">
    <h3 class="text-lg font-semibold text-gray-900 mb-6">Budget vs Actual Progress</h3>
    
    <div v-if="chartData.length === 0" class="text-center py-12">
      <div class="mx-auto h-12 w-12 text-gray-400">
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      </div>
      <h3 class="mt-2 text-sm font-medium text-gray-900">No budget data available</h3>
      <p class="mt-1 text-sm text-gray-500">Create budgets to see your spending progress here.</p>
    </div>

    <div v-else class="space-y-4">
      <!-- Chart Summary -->
      <div class="grid grid-cols-3 gap-4 mb-6">
        <div class="text-center p-3 bg-green-50 rounded-lg">
          <p class="text-sm font-medium text-green-800">On Track</p>
          <p class="text-2xl font-bold text-green-900">
            {{ chartData.filter(item => item.status === 'on_track').length }}
          </p>
        </div>
        <div class="text-center p-3 bg-yellow-50 rounded-lg">
          <p class="text-sm font-medium text-yellow-800">Warning</p>
          <p class="text-2xl font-bold text-yellow-900">
            {{ chartData.filter(item => item.status === 'warning').length }}
          </p>
        </div>
        <div class="text-center p-3 bg-red-50 rounded-lg">
          <p class="text-sm font-medium text-red-800">Over Budget</p>
          <p class="text-2xl font-bold text-red-900">
            {{ chartData.filter(item => item.status === 'over_budget').length }}
          </p>
        </div>
      </div>

      <!-- Horizontal Bar Chart -->
      <div class="space-y-3">
        <div v-for="(item, index) in chartData.slice(0, 8)" :key="index" class="space-y-2">
          <!-- Category Header -->
          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <span class="text-lg mr-2">{{ item.icon }}</span>
              <span class="text-sm font-medium text-gray-900">{{ item.category }}</span>
            </div>
            <div class="text-right">
              <span class="text-sm font-medium text-gray-900">
                {{ financeStore.formatIndianCurrency(item.actual) }}
              </span>
              <span class="text-sm text-gray-500 ml-1">
                / {{ financeStore.formatIndianCurrency(item.budget) }}
              </span>
            </div>
          </div>

          <!-- Progress Bar -->
          <div class="relative">
            <div class="w-full bg-gray-200 rounded-full h-6">
              <div 
                class="h-6 rounded-full transition-all duration-300 ease-in-out flex items-center justify-end pr-2"
                :style="{
                  width: `${Math.min(item.utilization, 100)}%`,
                  backgroundColor: getBarColor(item.utilization)
                }"
              >
                <span v-if="item.utilization > 15" class="text-xs font-medium text-white">
                  {{ item.utilization.toFixed(1) }}%
                </span>
              </div>
            </div>
            <span v-if="item.utilization <= 15" class="absolute left-2 top-1/2 transform -translate-y-1/2 text-xs font-medium text-gray-700">
              {{ item.utilization.toFixed(1) }}%
            </span>
          </div>

          <!-- Status Badge -->
          <div class="flex items-center justify-between">
            <span class="text-xs text-gray-500">
              {{ item.remaining >= 0 ? 'Remaining' : 'Over' }}: 
              {{ financeStore.formatIndianCurrency(Math.abs(item.remaining)) }}
            </span>
            <span 
              class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
              :style="{
                backgroundColor: getStatusColor(item.status) + '20',
                color: getStatusColor(item.status)
              }"
            >
              {{ item.status.replace('_', ' ').toUpperCase() }}
            </span>
          </div>
        </div>
      </div>

      <!-- Show More Indicator -->
      <div v-if="chartData.length > 8" class="text-center pt-4 border-t">
        <p class="text-sm text-gray-500">
          Showing 8 of {{ chartData.length }} categories
        </p>
      </div>
    </div>
  </div>
</template>
