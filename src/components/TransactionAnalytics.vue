<script setup>
import { ref, computed, onMounted } from 'vue'
import { useFinanceStore } from '@/stores/finance'
import { 
  ChartBarIcon, 
  ArrowTrendingUpIcon, 
  ArrowTrendingDownIcon,
  CalendarIcon,
  BanknotesIcon,
  TagIcon,
  CreditCardIcon
} from '@heroicons/vue/24/outline'

const financeStore = useFinanceStore()

// Time period selection
const selectedPeriod = ref('month') // month, quarter, year
const selectedMonth = ref(new Date().getMonth())
const selectedYear = ref(new Date().getFullYear())

// Computed analytics
const periodTransactions = computed(() => {
  if (selectedPeriod.value === 'month') {
    return financeStore.getTransactionsByMonth(selectedYear.value, selectedMonth.value)
  } else if (selectedPeriod.value === 'quarter') {
    const quarterStart = Math.floor(selectedMonth.value / 3) * 3
    const allQuarterTransactions = []
    for (let i = 0; i < 3; i++) {
      const monthTransactions = financeStore.getTransactionsByMonth(selectedYear.value, quarterStart + i)
      allQuarterTransactions.push(...monthTransactions)
    }
    return allQuarterTransactions
  } else {
    // Year
    let allYearTransactions = []
    for (let i = 0; i < 12; i++) {
      const monthTransactions = financeStore.getTransactionsByMonth(selectedYear.value, i)
      allYearTransactions.push(...monthTransactions)
    }
    return allYearTransactions
  }
})

const incomeTransactions = computed(() => 
  periodTransactions.value.filter(t => t.type === 'income' && t.status === 'completed')
)

const expenseTransactions = computed(() => 
  periodTransactions.value.filter(t => t.type === 'expense' && t.status === 'completed')
)

const transferTransactions = computed(() => 
  periodTransactions.value.filter(t => t.type === 'transfer' && t.status === 'completed')
)

// Financial summary
const totalIncome = computed(() => 
  incomeTransactions.value.reduce((sum, t) => sum + t.amount, 0)
)

const totalExpenses = computed(() => 
  expenseTransactions.value.reduce((sum, t) => sum + t.amount, 0)
)

const totalTransfers = computed(() => 
  transferTransactions.value.reduce((sum, t) => sum + t.amount, 0)
)

const netSavings = computed(() => totalIncome.value - totalExpenses.value)

const savingsRate = computed(() => 
  totalIncome.value > 0 ? (netSavings.value / totalIncome.value) * 100 : 0
)

// Category analysis
const categorySpending = computed(() => {
  const spending = {}
  expenseTransactions.value.forEach(transaction => {
    const category = transaction.category || 'other'
    if (!spending[category]) {
      spending[category] = {
        amount: 0,
        count: 0,
        category: getCategoryInfo(category, 'expense')
      }
    }
    spending[category].amount += transaction.amount
    spending[category].count += 1
  })
  
  return Object.values(spending).sort((a, b) => b.amount - a.amount)
})

const categoryIncome = computed(() => {
  const income = {}
  incomeTransactions.value.forEach(transaction => {
    const category = transaction.category || 'other'
    if (!income[category]) {
      income[category] = {
        amount: 0,
        count: 0,
        category: getCategoryInfo(category, 'income')
      }
    }
    income[category].amount += transaction.amount
    income[category].count += 1
  })
  
  return Object.values(income).sort((a, b) => b.amount - a.amount)
})

// Payment method analysis
const paymentMethodUsage = computed(() => {
  const usage = {}
  periodTransactions.value.forEach(transaction => {
    const method = transaction.payment_method || 'cash'
    if (!usage[method]) {
      usage[method] = {
        amount: 0,
        count: 0,
        method: getPaymentMethodInfo(method)
      }
    }
    usage[method].amount += transaction.amount
    usage[method].count += 1
  })
  
  return Object.values(usage).sort((a, b) => b.amount - a.amount)
})

// Daily spending pattern
const dailySpending = computed(() => {
  const daily = {}
  expenseTransactions.value.forEach(transaction => {
    const date = transaction.date
    if (!daily[date]) {
      daily[date] = 0
    }
    daily[date] += transaction.amount
  })
  
  return Object.entries(daily)
    .map(([date, amount]) => ({ date, amount }))
    .sort((a, b) => new Date(a.date) - new Date(b.date))
})

// Top merchants
const topMerchants = computed(() => {
  const merchants = {}
  expenseTransactions.value.forEach(transaction => {
    const merchant = transaction.merchant
    if (merchant) {
      if (!merchants[merchant]) {
        merchants[merchant] = {
          amount: 0,
          count: 0,
          name: merchant
        }
      }
      merchants[merchant].amount += transaction.amount
      merchants[merchant].count += 1
    }
  })
  
  return Object.values(merchants)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 10)
})

// Trends
const previousPeriodTransactions = computed(() => {
  if (selectedPeriod.value === 'month') {
    const prevMonth = selectedMonth.value === 0 ? 11 : selectedMonth.value - 1
    const prevYear = selectedMonth.value === 0 ? selectedYear.value - 1 : selectedYear.value
    return financeStore.getTransactionsByMonth(prevYear, prevMonth)
  } else if (selectedPeriod.value === 'quarter') {
    const prevQuarterStart = Math.floor((selectedMonth.value - 3) / 3) * 3
    const prevYear = prevQuarterStart < 0 ? selectedYear.value - 1 : selectedYear.value
    const adjustedStart = prevQuarterStart < 0 ? prevQuarterStart + 12 : prevQuarterStart
    
    const allPrevQuarterTransactions = []
    for (let i = 0; i < 3; i++) {
      const monthIndex = (adjustedStart + i) % 12
      const year = prevYear + Math.floor((adjustedStart + i) / 12)
      const monthTransactions = financeStore.getTransactionsByMonth(year, monthIndex)
      allPrevQuarterTransactions.push(...monthTransactions)
    }
    return allPrevQuarterTransactions
  } else {
    // Year
    return financeStore.getTransactionsByMonth(selectedYear.value - 1, 0)
      .concat(financeStore.getTransactionsByMonth(selectedYear.value - 1, 1))
      .concat(financeStore.getTransactionsByMonth(selectedYear.value - 1, 2))
      .concat(financeStore.getTransactionsByMonth(selectedYear.value - 1, 3))
      .concat(financeStore.getTransactionsByMonth(selectedYear.value - 1, 4))
      .concat(financeStore.getTransactionsByMonth(selectedYear.value - 1, 5))
      .concat(financeStore.getTransactionsByMonth(selectedYear.value - 1, 6))
      .concat(financeStore.getTransactionsByMonth(selectedYear.value - 1, 7))
      .concat(financeStore.getTransactionsByMonth(selectedYear.value - 1, 8))
      .concat(financeStore.getTransactionsByMonth(selectedYear.value - 1, 9))
      .concat(financeStore.getTransactionsByMonth(selectedYear.value - 1, 10))
      .concat(financeStore.getTransactionsByMonth(selectedYear.value - 1, 11))
  }
})

const previousIncome = computed(() => 
  previousPeriodTransactions.value
    .filter(t => t.type === 'income' && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0)
)

const previousExpenses = computed(() => 
  previousPeriodTransactions.value
    .filter(t => t.type === 'expense' && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0)
)

const incomeTrend = computed(() => 
  previousIncome.value > 0 ? ((totalIncome.value - previousIncome.value) / previousIncome.value) * 100 : 0
)

const expenseTrend = computed(() => 
  previousExpenses.value > 0 ? ((totalExpenses.value - previousExpenses.value) / previousExpenses.value) * 100 : 0
)

// Helper functions
const getCategoryInfo = (categoryId, type) => {
  const categories = type === 'income' ? financeStore.incomeCategories : financeStore.expenseCategories
  return categories.find(cat => cat.id === categoryId) || { name: 'Other', icon: '❓' }
}

const getPaymentMethodInfo = (methodId) => {
  return financeStore.paymentMethods.find(method => method.id === methodId) || { name: 'Cash', icon: '💵' }
}

const formatPercentage = (value) => {
  if (isNaN(value) || !isFinite(value)) return '0%'
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
}

const getPeriodLabel = () => {
  if (selectedPeriod.value === 'month') {
    return new Date(selectedYear.value, selectedMonth.value).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
  } else if (selectedPeriod.value === 'quarter') {
    const quarter = Math.floor(selectedMonth.value / 3) + 1
    return `Q${quarter} ${selectedYear.value}`
  } else {
    return selectedYear.value.toString()
  }
}

// Chart data
const categoryChartData = computed(() => {
  return categorySpending.value.map(item => ({
    name: item.category.name,
    value: item.amount,
    icon: item.category.icon
  }))
})

const paymentMethodChartData = computed(() => {
  return paymentMethodUsage.value.map(item => ({
    name: item.method.name,
    value: item.amount,
    icon: item.method.icon
  }))
})

const dailySpendingChartData = computed(() => {
  return dailySpending.value.map(item => ({
    date: new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    amount: item.amount
  }))
})

// Month names for selection
const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

// Generate year options
const yearOptions = computed(() => {
  const currentYear = new Date().getFullYear()
  return Array.from({ length: 10 }, (_, i) => currentYear - 5 + i)
})

onMounted(() => {
  // Component initialization
})
</script>

<template>
  <div class="space-y-6">
    <!-- Period Selection -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 class="text-lg font-semibold text-gray-900">Transaction Analytics</h2>
        <div class="flex items-center space-x-4">
          <!-- Period Selector -->
          <select v-model="selectedPeriod" class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
            <option value="month">Monthly</option>
            <option value="quarter">Quarterly</option>
            <option value="year">Yearly</option>
          </select>
          
          <!-- Month Selector (for monthly view) -->
          <select v-if="selectedPeriod === 'month'" v-model="selectedMonth" class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
            <option v-for="(month, index) in monthNames" :key="index" :value="index">
              {{ month }}
            </option>
          </select>
          
          <!-- Year Selector -->
          <select v-model="selectedYear" class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
            <option v-for="year in yearOptions" :key="year" :value="year">
              {{ year }}
            </option>
          </select>
        </div>
      </div>
      <div class="mt-2 text-sm text-gray-600">
        Showing analytics for: <span class="font-medium">{{ getPeriodLabel() }}</span>
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500">Total Income</p>
            <p class="text-2xl font-bold text-green-600">{{ financeStore.formatIndianCurrency(totalIncome) }}</p>
          </div>
          <div class="flex items-center">
            <ArrowTrendingUpIcon v-if="incomeTrend >= 0" class="h-5 w-5 text-green-500 mr-1" />
            <ArrowTrendingDownIcon v-else class="h-5 w-5 text-red-500 mr-1" />
            <span :class="incomeTrend >= 0 ? 'text-green-600' : 'text-red-600'" class="text-sm font-medium">
              {{ formatPercentage(incomeTrend) }}
            </span>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500">Total Expenses</p>
            <p class="text-2xl font-bold text-red-600">{{ financeStore.formatIndianCurrency(totalExpenses) }}</p>
          </div>
          <div class="flex items-center">
            <ArrowTrendingUpIcon v-if="expenseTrend >= 0" class="h-5 w-5 text-red-500 mr-1" />
            <ArrowTrendingDownIcon v-else class="h-5 w-5 text-green-500 mr-1" />
            <span :class="expenseTrend >= 0 ? 'text-red-600' : 'text-green-600'" class="text-sm font-medium">
              {{ formatPercentage(expenseTrend) }}
            </span>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500">Net Savings</p>
            <p class="text-2xl font-bold" :class="netSavings >= 0 ? 'text-gray-900' : 'text-red-600'">
              {{ financeStore.formatIndianCurrency(netSavings) }}
            </p>
          </div>
          <div class="flex items-center">
            <BanknotesIcon class="h-5 w-5 text-gray-400" />
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500">Savings Rate</p>
            <p class="text-2xl font-bold text-indigo-600">{{ savingsRate.toFixed(1) }}%</p>
          </div>
          <div class="flex items-center">
            <ChartBarIcon class="h-5 w-5 text-gray-400" />
          </div>
        </div>
      </div>
    </div>

    <!-- Category Analysis -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Expense Categories -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-900">Expense Categories</h3>
          <TagIcon class="h-5 w-5 text-gray-400" />
        </div>
        <div class="space-y-3">
          <div v-for="(item, index) in categorySpending.slice(0, 8)" :key="item.category.name" class="flex items-center justify-between">
            <div class="flex items-center">
              <span class="text-lg mr-3">{{ item.category.icon }}</span>
              <div>
                <p class="text-sm font-medium text-gray-900">{{ item.category.name }}</p>
                <p class="text-xs text-gray-500">{{ item.count }} transactions</p>
              </div>
            </div>
            <div class="text-right">
              <p class="text-sm font-semibold text-gray-900">{{ financeStore.formatIndianCurrency(item.amount) }}</p>
              <p class="text-xs text-gray-500">{{ ((item.amount / totalExpenses) * 100).toFixed(1) }}%</p>
            </div>
          </div>
        </div>
        <div v-if="categorySpending.length === 0" class="text-center py-8 text-gray-500">
          No expense data available for this period
        </div>
      </div>

      <!-- Income Categories -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-900">Income Categories</h3>
          <ArrowTrendingUpIcon class="h-5 w-5 text-gray-400" />
        </div>
        <div class="space-y-3">
          <div v-for="(item, index) in categoryIncome.slice(0, 8)" :key="item.category.name" class="flex items-center justify-between">
            <div class="flex items-center">
              <span class="text-lg mr-3">{{ item.category.icon }}</span>
              <div>
                <p class="text-sm font-medium text-gray-900">{{ item.category.name }}</p>
                <p class="text-xs text-gray-500">{{ item.count }} transactions</p>
              </div>
            </div>
            <div class="text-right">
              <p class="text-sm font-semibold text-gray-900">{{ financeStore.formatIndianCurrency(item.amount) }}</p>
              <p class="text-xs text-gray-500">{{ ((item.amount / totalIncome) * 100).toFixed(1) }}%</p>
            </div>
          </div>
        </div>
        <div v-if="categoryIncome.length === 0" class="text-center py-8 text-gray-500">
          No income data available for this period
        </div>
      </div>
    </div>

    <!-- Payment Method Analysis -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-gray-900">Payment Method Usage</h3>
        <CreditCardIcon class="h-5 w-5 text-gray-400" />
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div v-for="(item, index) in paymentMethodUsage" :key="item.method.name" class="bg-gray-50 rounded-lg p-4">
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center">
              <span class="text-lg mr-2">{{ item.method.icon }}</span>
              <span class="text-sm font-medium text-gray-900">{{ item.method.name }}</span>
            </div>
            <span class="text-xs text-gray-500">{{ item.count }} txns</span>
          </div>
          <div class="text-lg font-semibold text-gray-900">{{ financeStore.formatIndianCurrency(item.amount) }}</div>
          <div class="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div 
              class="bg-indigo-600 h-2 rounded-full" 
              :style="{ width: `${(item.amount / Math.max(...paymentMethodUsage.map(m => m.amount))) * 100}%` }"
            ></div>
          </div>
        </div>
      </div>
      <div v-if="paymentMethodUsage.length === 0" class="text-center py-8 text-gray-500">
        No payment method data available for this period
      </div>
    </div>

    <!-- Top Merchants -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-gray-900">Top Merchants</h3>
        <CalendarIcon class="h-5 w-5 text-gray-400" />
      </div>
      <div class="space-y-3">
        <div v-for="(merchant, index) in topMerchants" :key="merchant.name" class="flex items-center justify-between py-2">
          <div class="flex items-center">
            <div class="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
              <span class="text-sm font-medium text-indigo-600">{{ index + 1 }}</span>
            </div>
            <div>
              <p class="text-sm font-medium text-gray-900">{{ merchant.name }}</p>
              <p class="text-xs text-gray-500">{{ merchant.count }} transactions</p>
            </div>
          </div>
          <div class="text-right">
            <p class="text-sm font-semibold text-gray-900">{{ financeStore.formatIndianCurrency(merchant.amount) }}</p>
            <p class="text-xs text-gray-500">{{ ((merchant.amount / totalExpenses) * 100).toFixed(1) }}%</p>
          </div>
        </div>
      </div>
      <div v-if="topMerchants.length === 0" class="text-center py-8 text-gray-500">
        No merchant data available for this period
      </div>
    </div>

    <!-- Daily Spending Pattern -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-gray-900">Daily Spending Pattern</h3>
        <ArrowTrendingDownIcon class="h-5 w-5 text-gray-400" />
      </div>
      <div class="space-y-2">
        <div v-for="(day, index) in dailySpending.slice(-14)" :key="day.date" class="flex items-center justify-between py-1">
          <div class="text-sm text-gray-600 w-24">
            {{ new Date(day.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }) }}
          </div>
          <div class="flex-1 mx-4">
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div 
                class="bg-red-500 h-2 rounded-full" 
                :style="{ width: `${Math.min((day.amount / Math.max(...dailySpending.map(d => d.amount))) * 100, 100)}%` }"
              ></div>
            </div>
          </div>
          <div class="text-sm font-medium text-gray-900 w-20 text-right">
            {{ financeStore.formatIndianCurrency(day.amount) }}
          </div>
        </div>
      </div>
      <div v-if="dailySpending.length === 0" class="text-center py-8 text-gray-500">
        No daily spending data available for this period
      </div>
    </div>

    <!-- Key Insights -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">Key Insights</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="bg-indigo-50 rounded-lg p-4">
          <div class="flex items-center">
            <ArrowTrendingUpIcon class="h-5 w-5 text-indigo-600 mr-2" />
            <div>
              <p class="text-sm font-medium text-indigo-900">Income Trend</p>
              <p class="text-xs text-indigo-700">
                {{ incomeTrend >= 0 ? 'Up' : 'Down' }} by {{ Math.abs(incomeTrend).toFixed(1) }}% from previous period
              </p>
            </div>
          </div>
        </div>
        
        <div class="bg-red-50 rounded-lg p-4">
          <div class="flex items-center">
            <ArrowTrendingDownIcon class="h-5 w-5 text-red-600 mr-2" />
            <div>
              <p class="text-sm font-medium text-red-900">Expense Trend</p>
              <p class="text-xs text-red-700">
                {{ expenseTrend >= 0 ? 'Up' : 'Down' }} by {{ Math.abs(expenseTrend).toFixed(1) }}% from previous period
              </p>
            </div>
          </div>
        </div>
        
        <div class="bg-green-50 rounded-lg p-4">
          <div class="flex items-center">
            <BanknotesIcon class="h-5 w-5 text-green-600 mr-2" />
            <div>
              <p class="text-sm font-medium text-green-900">Savings Rate</p>
              <p class="text-xs text-green-700">
                You're saving {{ savingsRate.toFixed(1) }}% of your income
                {{ savingsRate >= 20 ? ' - Great job!' : savingsRate >= 10 ? ' - Good progress!' : ' - Consider increasing savings.' }}
              </p>
            </div>
          </div>
        </div>
        
        <div class="bg-yellow-50 rounded-lg p-4">
          <div class="flex items-center">
            <TagIcon class="h-5 w-5 text-yellow-600 mr-2" />
            <div>
              <p class="text-sm font-medium text-yellow-900">Top Category</p>
              <p class="text-xs text-yellow-700">
                {{ categorySpending.length > 0 ? categorySpending[0].category.name : 'N/A' }} 
                accounts for {{ categorySpending.length > 0 ? ((categorySpending[0].amount / totalExpenses) * 100).toFixed(1) : '0' }}% of expenses
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>