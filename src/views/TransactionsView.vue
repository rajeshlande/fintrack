<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useFinanceStore } from '@/stores/finance'
import TransactionList from '@/components/TransactionList.vue'
import TransactionAnalytics from '@/components/TransactionAnalytics.vue'
import AddTransaction from '@/components/AddTransaction.vue'
import { 
  ArrowLeftIcon,
  PlusIcon,
  ChartBarIcon,
  FunnelIcon,
  TableCellsIcon,
  ChartPieIcon,
  DocumentArrowUpIcon
} from '@heroicons/vue/24/outline'

const router = useRouter()
const financeStore = useFinanceStore()

// State
const loading = ref(false)
const showAddModal = ref(false)
const editingTransaction = ref(null)
const activeTab = ref('list') // 'list' or 'analytics'

// Computed
const totalTransactions = computed(() => financeStore.transactions.length)
const totalIncome = computed(() => financeStore.totalIncome)
const totalExpenses = computed(() => financeStore.totalExpenses)
const currentBalance = computed(() => financeStore.currentBalance)

// Analytics
const monthlyTrend = computed(() => {
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  const monthTransactions = financeStore.getTransactionsByMonth(currentYear, currentMonth)
  
  let income = 0
  let expenses = 0
  
  monthTransactions.forEach(t => {
    if (t.type === 'income') income += t.amount
    else if (t.type === 'expense') expenses += t.amount
  })
  
  return { income, expenses, balance: income - expenses }
})

const topCategories = computed(() => {
  const categoryTotals = {}
  
  financeStore.transactions.forEach(t => {
    if (t.type === 'expense') {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount
    }
  })
  
  return Object.entries(categoryTotals)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: (amount / totalExpenses.value * 100).toFixed(1)
    }))
})

// Actions
const handleAddTransaction = () => {
  editingTransaction.value = null
  showAddModal.value = true
}

const handleEditTransaction = (transaction) => {
  editingTransaction.value = transaction
  showAddModal.value = true
}

const handleDeleteTransaction = (transactionId) => {
  financeStore.deleteTransaction(transactionId)
}

const handleDuplicateTransaction = (transaction) => {
  financeStore.addTransaction(transaction)
}

const handleSaveTransaction = (transactionData) => {
  if (editingTransaction.value) {
    financeStore.updateTransaction(editingTransaction.value.id, transactionData)
  } else {
    financeStore.addTransaction(transactionData)
  }
  showAddModal.value = false
  editingTransaction.value = null
}

const handleCloseModal = () => {
  showAddModal.value = false
  editingTransaction.value = null
}

// Load initial data
onMounted(async () => {
  try {
    loading.value = true
    // Fetch transactions from database
    await financeStore.fetchTransactions()
  } catch (error) {
    console.error('Failed to load transactions:', error)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
      <!-- Header -->
      <div class="mb-6 sm:mb-8">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <!-- Left Section -->
          <div class="flex items-center gap-3 sm:gap-4">
            <button
              @click="router.push('/dashboard')"
              class="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition-colors"
            >
              <ArrowLeftIcon class="h-4 w-4 mr-2" />
              <span class="hidden sm:inline">Back to Dashboard</span>
              <span class="sm:hidden">Back</span>
            </button>
            <h1 class="text-2xl sm:text-3xl font-bold text-gray-900">Transactions</h1>
          </div>
          
          <!-- Right Section -->
          <div class="flex items-center gap-3">
            <!-- Tab Navigation -->
            <div class="flex bg-gray-100 rounded-lg p-1">
              <button
                @click="activeTab = 'list'"
                :class="[
                  'px-3 py-1 rounded-md text-sm font-medium transition-colors flex items-center gap-1',
                  activeTab === 'list' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                ]"
              >
                <TableCellsIcon class="h-4 w-4" />
                <span class="hidden sm:inline">List</span>
              </button>
              <button
                @click="activeTab = 'analytics'"
                :class="[
                  'px-3 py-1 rounded-md text-sm font-medium transition-colors flex items-center gap-1',
                  activeTab === 'analytics' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                ]"
              >
                <ChartPieIcon class="h-4 w-4" />
                <span class="hidden sm:inline">Analytics</span>
              </button>
            </div>
            
            <button
              @click="handleAddTransaction"
              class="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
            >
              <PlusIcon class="h-4 w-4 mr-2" />
              <span class="hidden sm:inline">Add Transaction</span>
              <span class="sm:hidden">Add</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Summary Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                <ChartBarIcon class="h-5 w-5 text-indigo-600" />
              </div>
            </div>
            <div class="ml-4 min-w-0">
              <p class="text-sm font-medium text-gray-500 truncate">Total Transactions</p>
              <p class="text-xl sm:text-2xl font-semibold text-gray-900">{{ totalTransactions }}</p>
            </div>
          </div>
        </div>
        
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <svg class="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </div>
            </div>
            <div class="ml-4 min-w-0">
              <p class="text-sm font-medium text-gray-500 truncate">Total Income</p>
              <p class="text-xl sm:text-2xl font-semibold text-green-600 truncate">{{ financeStore.formatIndianCurrency(totalIncome) }}</p>
            </div>
          </div>
        </div>
        
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <svg class="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 12h-15" />
                </svg>
              </div>
            </div>
            <div class="ml-4 min-w-0">
              <p class="text-sm font-medium text-gray-500 truncate">Total Expenses</p>
              <p class="text-xl sm:text-2xl font-semibold text-red-600 truncate">{{ financeStore.formatIndianCurrency(totalExpenses) }}</p>
            </div>
          </div>
        </div>
        
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <DocumentArrowUpIcon class="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <div class="ml-4 min-w-0">
              <p class="text-sm font-medium text-gray-500 truncate">Current Balance</p>
              <p class="text-xl sm:text-2xl font-semibold truncate" :class="currentBalance >= 0 ? 'text-green-600' : 'text-red-600'">
                {{ financeStore.formatIndianCurrency(currentBalance) }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Content based on active tab -->
      <div v-if="loading" class="text-center py-12">
        <div class="inline-flex items-center">
          <svg class="animate-spin -ml-1 mr-3 h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span class="text-lg text-gray-600">Loading transactions...</span>
        </div>
      </div>

      <div v-else-if="activeTab === 'list'">
        <!-- Monthly Overview -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div class="lg:col-span-2">
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow">
              <h3 class="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">This Month's Overview</h3>
              <div class="grid grid-cols-3 gap-2 sm:gap-4">
                <div class="text-center">
                  <p class="text-xs sm:text-sm text-gray-500">Income</p>
                  <p class="text-lg sm:text-xl font-semibold text-green-600 truncate">{{ financeStore.formatIndianCurrency(monthlyTrend.income) }}</p>
                </div>
                <div class="text-center">
                  <p class="text-xs sm:text-sm text-gray-500">Expenses</p>
                  <p class="text-lg sm:text-xl font-semibold text-red-600 truncate">{{ financeStore.formatIndianCurrency(monthlyTrend.expenses) }}</p>
                </div>
                <div class="text-center">
                  <p class="text-xs sm:text-sm text-gray-500">Balance</p>
                  <p class="text-lg sm:text-xl font-semibold truncate" :class="monthlyTrend.balance >= 0 ? 'text-green-600' : 'text-red-600'">
                    {{ financeStore.formatIndianCurrency(monthlyTrend.balance) }}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow">
            <h3 class="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Top Categories</h3>
            <div class="space-y-2 sm:space-y-3">
              <div v-for="category in topCategories" :key="category.category" class="flex items-center justify-between">
                <div class="flex items-center space-x-2 min-w-0">
                  <span class="text-xs sm:text-sm text-gray-600 truncate">{{ category.category }}</span>
                </div>
                <div class="text-right min-w-0">
                  <p class="text-xs sm:text-sm font-medium text-gray-900 truncate">{{ financeStore.formatIndianCurrency(category.amount) }}</p>
                  <p class="text-xs text-gray-500">{{ category.percentage }}%</p>
                </div>
              </div>
              <div v-if="topCategories.length === 0" class="text-center text-gray-500 text-xs sm:text-sm">
                No expense data available
              </div>
            </div>
          </div>
        </div>

        <!-- Transaction List -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200">
          <div class="px-6 py-4 border-b border-gray-200">
            <div class="flex items-center justify-between">
              <h2 class="text-lg font-semibold text-gray-900">Recent Transactions</h2>
              <div class="flex items-center space-x-2 text-sm text-gray-500">
                <FunnelIcon class="h-4 w-4" />
                <span>{{ totalTransactions }} transactions</span>
              </div>
            </div>
          </div>
          
          <TransactionList
            :transactions="financeStore.transactions"
            :loading="loading"
            @edit="handleEditTransaction"
            @delete="handleDeleteTransaction"
            @duplicate="handleDuplicateTransaction"
          />
        </div>
      </div>

      <!-- Analytics Tab -->
      <div v-else-if="activeTab === 'analytics'">
        <TransactionAnalytics />
      </div>
    </div>

    <!-- Add/Edit Transaction Modal -->
    <div v-if="showAddModal" class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity z-50">
      <div class="fixed inset-0 z-50 overflow-y-auto">
        <div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <div class="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl">
            <div class="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-semibold text-gray-900">
                  {{ editingTransaction ? 'Edit Transaction' : 'Add New Transaction' }}
                </h3>
                <button
                  @click="handleCloseModal"
                  class="text-gray-400 hover:text-gray-600"
                >
                  <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <AddTransaction
                :initial-data="editingTransaction"
                @submit="handleSaveTransaction"
                @cancel="handleCloseModal"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>