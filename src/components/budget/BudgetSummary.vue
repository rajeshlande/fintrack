<script setup>
import { computed, onMounted } from 'vue'
import { useBudgetStore } from '@/stores/budget'
import { useFinanceStore } from '@/stores/finance'
import { 
  ArrowTrendingUpIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/vue/24/outline'

const budgetStore = useBudgetStore()
const financeStore = useFinanceStore()

// Computed properties
const monthlyBudgetTotal = computed(() => budgetStore.totalMonthlyBudget)
const monthlySpent = computed(() => {
  return budgetStore.budgetPerformance
    .filter(p => p.categories?.type === 'expense')
    .reduce((total, performance) => total + performance.actual_amount, 0)
})

const monthlyRemaining = computed(() => monthlyBudgetTotal.value - monthlySpent.value)
const monthlyUtilization = computed(() => {
  return monthlyBudgetTotal.value > 0 
    ? (monthlySpent.value / monthlyBudgetTotal.value * 100).toFixed(1)
    : 0
})

const annualBudgetTotal = computed(() => budgetStore.totalAnnualBudget)
const annualSpent = computed(() => {
  return budgetStore.budgetPerformance
    .filter(p => p.categories?.type === 'expense')
    .reduce((total, performance) => total + performance.actual_amount * 12, 0) // Annualize
})

const annualRemaining = computed(() => annualBudgetTotal.value - annualSpent.value)
const annualUtilization = computed(() => {
  return annualBudgetTotal.value > 0 
    ? (annualSpent.value / annualBudgetTotal.value * 100).toFixed(1)
    : 0
})

const topSpendingCategories = computed(() => {
  return budgetStore.budgetPerformance
    .filter(p => p.categories?.type === 'expense')
    .sort((a, b) => b.actual_amount - a.actual_amount)
    .slice(0, 5)
})

const budgetStatus = computed(() => {
  const utilization = parseFloat(monthlyUtilization.value)
  if (utilization >= 100) return { status: 'critical', color: 'red', icon: ExclamationTriangleIcon }
  if (utilization >= 80) return { status: 'warning', color: 'yellow', icon: ExclamationTriangleIcon }
  if (utilization >= 60) return { status: 'caution', color: 'orange', icon: ArrowTrendingUpIcon }
  return { status: 'good', color: 'green', icon: CheckCircleIcon }
})

const savingsRate = computed(() => {
  const income = financeStore.totalIncome
  const expenses = financeStore.totalExpenses
  return income > 0 ? ((income - expenses) / income * 100).toFixed(1) : 0
})

const budgetAlerts = computed(() => {
  return budgetStore.budgetUtilization.filter(performance => 
    performance.status === 'over_budget' || performance.status === 'warning'
  )
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

onMounted(async () => {
  // Data is loaded by parent component
})
</script>

<template>
  <div class="space-y-6">
    <!-- Budget Status Overview -->
    <div class="bg-white rounded-lg shadow p-6">
      <h2 class="text-lg font-semibold text-gray-900 mb-4">Budget Overview</h2>
      
      <!-- Monthly Summary -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div class="text-center">
          <p class="text-sm font-medium text-gray-600 mb-2">Monthly Budget</p>
          <p class="text-2xl font-bold text-gray-900">
            {{ financeStore.formatIndianCurrency(monthlyBudgetTotal) }}
          </p>
          <div class="mt-2">
            <span :class="`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${budgetStatus.color}-100 text-${budgetStatus.color}-800`">
              <component :is="budgetStatus.icon" class="h-4 w-4 mr-1" />
              {{ monthlyUtilization }}% used
            </span>
          </div>
        </div>
        
        <div class="text-center">
          <p class="text-sm font-medium text-gray-600 mb-2">Monthly Spent</p>
          <p class="text-2xl font-bold" :class="monthlySpent > monthlyBudgetTotal ? 'text-red-600' : 'text-gray-900'">
            {{ financeStore.formatIndianCurrency(monthlySpent) }}
          </p>
          <p class="text-sm text-gray-500 mt-1">
            {{ monthlySpent > monthlyBudgetTotal ? 'Over budget' : 'Within budget' }}
          </p>
        </div>
        
        <div class="text-center">
          <p class="text-sm font-medium text-gray-600 mb-2">Monthly Remaining</p>
          <p class="text-2xl font-bold" :class="monthlyRemaining >= 0 ? 'text-green-600' : 'text-red-600'">
            {{ financeStore.formatIndianCurrency(monthlyRemaining) }}
          </p>
          <p class="text-sm text-gray-500 mt-1">
            {{ monthlyRemaining >= 0 ? 'Available' : 'Deficit' }}
          </p>
        </div>
      </div>

      <!-- Annual Summary -->
      <div class="border-t pt-6">
        <h3 class="text-md font-medium text-gray-900 mb-4">Annual Progress (FY {{ budgetStore.getCurrentFinancialYear() }}-{{ budgetStore.getCurrentFinancialYear() + 1 }})</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="text-center">
            <p class="text-sm font-medium text-gray-600 mb-2">Annual Budget</p>
            <p class="text-xl font-bold text-gray-900">
              {{ financeStore.formatIndianCurrency(annualBudgetTotal) }}
            </p>
          </div>
          
          <div class="text-center">
            <p class="text-sm font-medium text-gray-600 mb-2">YTD Spent</p>
            <p class="text-xl font-bold text-gray-900">
              {{ financeStore.formatIndianCurrency(annualSpent) }}
            </p>
            <p class="text-sm text-gray-500 mt-1">{{ annualUtilization }}% of annual budget</p>
          </div>
          
          <div class="text-center">
            <p class="text-sm font-medium text-gray-600 mb-2">Annual Remaining</p>
            <p class="text-xl font-bold" :class="annualRemaining >= 0 ? 'text-green-600' : 'text-red-600'">
              {{ financeStore.formatIndianCurrency(annualRemaining) }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Key Metrics -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <CurrencyDollarIcon class="h-8 w-8 text-indigo-600" />
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600">Savings Rate</p>
            <p class="text-2xl font-bold text-gray-900">{{ savingsRate }}%</p>
            <div class="flex items-center mt-1">
              <component :is="savingsRate > 20 ? ArrowTrendingUpIcon : ExclamationTriangleIcon" 
                         :class="savingsRate > 20 ? 'text-green-500' : 'text-red-500'" 
                         class="h-4 w-4 mr-1" />
              <span class="text-sm" :class="savingsRate > 20 ? 'text-green-600' : 'text-red-600'">
                {{ savingsRate > 20 ? 'Good' : 'Needs improvement' }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <CheckCircleIcon class="h-8 w-8 text-green-600" />
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600">Goals Progress</p>
            <p class="text-2xl font-bold text-gray-900">
              {{ budgetStore.goalsProgress.length }}
            </p>
            <p class="text-sm text-gray-500 mt-1">Active goals</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <ArrowTrendingUpIcon class="h-8 w-8 text-purple-600" />
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600">Investment Value</p>
            <p class="text-2xl font-bold text-gray-900">
              {{ financeStore.formatIndianCurrency(budgetStore.totalInvestmentValue) }}
            </p>
            <p class="text-sm text-gray-500 mt-1">Total portfolio</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <ExclamationTriangleIcon v-if="budgetAlerts.length > 0" class="h-8 w-8 text-yellow-600" />
            <CheckCircleIcon v-else class="h-8 w-8 text-green-600" />
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600">Budget Alerts</p>
            <p class="text-2xl font-bold text-gray-900">
              {{ budgetStore.budgetUtilization.filter(p => p.status === 'over_budget' || p.status === 'warning').length }}
            </p>
            <p class="text-sm text-gray-500 mt-1">Need attention</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Top Spending Categories -->
    <div class="bg-white rounded-lg shadow p-6">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">Top Spending Categories</h3>
      <div v-if="topSpendingCategories.length === 0" class="text-center py-8">
        <p class="text-gray-500">No spending data available for this period.</p>
      </div>
      <div v-else class="space-y-3">
        <div v-for="(category, index) in topSpendingCategories" :key="category.id" 
             class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div class="flex items-center">
            <span class="text-lg font-medium text-gray-500 mr-3">{{ index + 1 }}</span>
            <span class="text-2xl mr-3">{{ category.categories?.icon }}</span>
            <div>
              <p class="font-medium text-gray-900">{{ category.categories?.name }}</p>
              <p class="text-sm text-gray-500">
                Budget: {{ financeStore.formatIndianCurrency(category.budget_amount) }}
              </p>
            </div>
          </div>
          <div class="text-right">
            <p class="font-medium text-gray-900">
              {{ financeStore.formatIndianCurrency(category.actual_amount) }}
            </p>
            <p class="text-sm" :class="category.utilization_percentage > 100 ? 'text-red-600' : 'text-gray-500'">
              {{ category.utilization_percentage.toFixed(1) }}% of budget
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
