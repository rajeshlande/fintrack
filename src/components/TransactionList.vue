<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useFinanceStore } from '@/stores/finance'
import { useCategoriesStore } from '@/stores/categories'
import { 
  FunnelIcon, 
  MagnifyingGlassIcon, 
  CalendarIcon,
  BanknotesIcon,
  TagIcon,
  CreditCardIcon,
  TrashIcon,
  PencilIcon,
  DocumentDuplicateIcon
} from '@heroicons/vue/24/outline'

const props = defineProps({
  transactions: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['edit', 'delete', 'duplicate'])

const financeStore = useFinanceStore()
const categoriesStore = useCategoriesStore()

// Filter state
const searchQuery = ref('')
const selectedType = ref('')
const selectedCategory = ref('')
const selectedPaymentMethod = ref('')
const dateFrom = ref('')
const dateTo = ref('')
const amountMin = ref('')
const amountMax = ref('')

// UI state
const showFilters = ref(false)
const selectedTransaction = ref(null)

// Filter options
const transactionTypes = [
  { value: '', label: 'All Types' },
  { value: 'income', label: 'Income' },
  { value: 'expense', label: 'Expense' },
  { value: 'transfer', label: 'Transfer' }
]

const allCategories = computed(() => {
  const incomeCats = financeStore.incomeCategories.map(cat => ({ value: cat.id, label: cat.name, type: 'income', icon: cat.icon }))
  const expenseCats = financeStore.expenseCategories.map(cat => ({ value: cat.id, label: cat.name, type: 'expense', icon: cat.icon }))
  return [
    { value: '', label: 'All Categories', icon: '📊' },
    ...incomeCats,
    ...expenseCats
  ]
})

const allPaymentMethods = computed(() => [
  { value: '', label: 'All Payment Methods', icon: '💳' },
  ...financeStore.paymentMethods.map(method => ({ value: method.id, label: method.name, icon: method.icon }))
])

// Filtered transactions
const filteredTransactions = computed(() => {
  if (!props.transactions.length) return []
  
  let filtered = [...props.transactions]
  
  // Apply filters
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(t => 
      t.description.toLowerCase().includes(query) ||
      t.merchant?.toLowerCase().includes(query) ||
      t.notes.toLowerCase().includes(query) ||
      t.tags.some(tag => tag.toLowerCase().includes(query))
    )
  }
  
  if (selectedType.value) {
    filtered = filtered.filter(t => t.type === selectedType.value)
  }
  
  if (selectedCategory.value) {
    filtered = filtered.filter(t => t.category === selectedCategory.value)
  }
  
  if (selectedPaymentMethod.value) {
    filtered = filtered.filter(t => t.payment_method === selectedPaymentMethod.value)
  }
  
  if (dateFrom.value) {
    filtered = filtered.filter(t => t.date >= dateFrom.value)
  }
  
  if (dateTo.value) {
    filtered = filtered.filter(t => t.date <= dateTo.value)
  }
  
  if (amountMin.value) {
    filtered = filtered.filter(t => t.amount >= parseFloat(amountMin.value))
  }
  
  if (amountMax.value) {
    filtered = filtered.filter(t => t.amount <= parseFloat(amountMax.value))
  }
  
  return filtered
})

// Group transactions by date
const groupedTransactions = computed(() => {
  const groups = {}
  
  filteredTransactions.value.forEach(transaction => {
    const date = transaction.date
    if (!groups[date]) {
      groups[date] = {
        date,
        transactions: [],
        totalIncome: 0,
        totalExpense: 0,
        totalTransfer: 0
      }
    }
    
    groups[date].transactions.push(transaction)
    
    if (transaction.type === 'income') {
      groups[date].totalIncome += transaction.amount
    } else if (transaction.type === 'expense') {
      groups[date].totalExpense += transaction.amount
    } else if (transaction.type === 'transfer') {
      groups[date].totalTransfer += transaction.amount
    }
  })
  
  // Sort groups by date (newest first)
  return Object.values(groups).sort((a, b) => new Date(b.date) - new Date(a.date))
})

// Format functions
const formatDate = (dateString) => {
  const date = new Date(dateString)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  
  if (dateString === today.toISOString().split('T')[0]) {
    return 'Today'
  } else if (dateString === yesterday.toISOString().split('T')[0]) {
    return 'Yesterday'
  } else {
    return date.toLocaleDateString('en-IN', { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'short' 
    })
  }
}

const formatTime = (timeString) => {
  if (!timeString) return ''
  const [hours, minutes] = timeString.split(':')
  const date = new Date()
  date.setHours(parseInt(hours), parseInt(minutes))
  return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}

const getCategoryInfo = (categoryId, type) => {
  if (!categoryId) {
    return { name: 'No Category', icon: '' }
  }
  
  const categories = categoriesStore.categories
  if (!categories || !categories.length) {
    return { name: 'Unknown', icon: '' }
  }
  
  const foundCategory = categories.find(cat => {
    // Handle both string and UUID comparison
    return cat.id === categoryId || cat.id.toString() === categoryId.toString()
  })
  
  return foundCategory || { name: 'Unknown', icon: '' }
}

const getPaymentMethodInfo = (paymentMethodId) => {
  return financeStore.paymentMethods.find(method => method.id === paymentMethodId) || { name: 'Unknown', icon: '' }
}

const getTransactionColor = (type) => {
  switch (type) {
    case 'income': return 'text-green-600 bg-green-50 border-green-200'
    case 'expense': return 'text-red-600 bg-red-50 border-red-200'
    case 'transfer': return 'text-blue-600 bg-blue-50 border-blue-200'
    default: return 'text-gray-600 bg-gray-50 border-gray-200'
  }
}

// Action handlers
const handleEdit = (transaction) => {
  emit('edit', transaction)
}

const handleDelete = (transaction) => {
  if (confirm(`Are you sure you want to delete this ${transaction.type} of ${financeStore.formatIndianCurrency(transaction.amount)}?`)) {
    emit('delete', transaction.id)
  }
}

const handleDuplicate = (transaction) => {
  const duplicatedTransaction = {
    ...transaction,
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().split(' ')[0].substring(0, 5),
    is_duplicate: true,
    parent_transaction_id: transaction.id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
  emit('duplicate', duplicatedTransaction)
}

const clearFilters = () => {
  searchQuery.value = ''
  selectedType.value = ''
  selectedCategory.value = ''
  selectedPaymentMethod.value = ''
  dateFrom.value = ''
  dateTo.value = ''
  amountMin.value = ''
  amountMax.value = ''
}

const activeFiltersCount = computed(() => {
  let count = 0
  if (searchQuery.value) count++
  if (selectedType.value) count++
  if (selectedCategory.value) count++
  if (selectedPaymentMethod.value) count++
  if (dateFrom.value) count++
  if (dateTo.value) count++
  if (amountMin.value) count++
  if (amountMax.value) count++
  return count
})

// Calculate daily totals
const getDailyTotal = (group, type) => {
  switch (type) {
    case 'income': return group.totalIncome
    case 'expense': return group.totalExpense
    case 'transfer': return group.totalTransfer
    default: return 0
  }
}

onMounted(async () => {
  // Load categories for proper icon display
  await categoriesStore.fetchCategories()
  
  // Load any saved filter preferences
  const savedFilters = localStorage.getItem('transactionFilters')
  if (savedFilters) {
    try {
      const filters = JSON.parse(savedFilters)
      Object.assign({
        searchQuery: searchQuery.value,
        selectedType: selectedType.value,
        selectedCategory: selectedCategory.value,
        selectedPaymentMethod: selectedPaymentMethod.value,
        dateFrom: dateFrom.value,
        dateTo: dateTo.value,
        amountMin: amountMin.value,
        amountMax: amountMax.value
      }, filters)
    } catch (e) {
      console.warn('Failed to load saved filters:', e)
    }
  }
})

// Save filters when they change
watch([searchQuery, selectedType, selectedCategory, selectedPaymentMethod, dateFrom, dateTo, amountMin, amountMax], () => {
  const filters = {
    searchQuery: searchQuery.value,
    selectedType: selectedType.value,
    selectedCategory: selectedCategory.value,
    selectedPaymentMethod: selectedPaymentMethod.value,
    dateFrom: dateFrom.value,
    dateTo: dateTo.value,
    amountMin: amountMin.value,
    amountMax: amountMax.value
  }
  localStorage.setItem('transactionFilters', JSON.stringify(filters))
}, { deep: true })
</script>

<template>
  <div class="space-y-6">
    <!-- Search and Filter Bar -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
      <div class="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <!-- Search Input -->
        <div class="flex-1 relative">
          <MagnifyingGlassIcon class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search transactions..."
            class="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        
        <!-- Filter Toggle -->
        <button
          @click="showFilters = !showFilters"
          class="inline-flex items-center px-3 sm:px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
          :class="{ 'ring-2 ring-indigo-500': showFilters || activeFiltersCount > 0 }"
        >
          <FunnelIcon class="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
          <span class="hidden sm:inline">Filters</span>
          <span class="sm:hidden">Filter</span>
          <span v-if="activeFiltersCount > 0" class="ml-1 sm:ml-2 bg-indigo-100 text-indigo-800 text-xs font-medium px-2 py-1 rounded-full">
            {{ activeFiltersCount }}
          </span>
        </button>
      </div>
      
      <!-- Advanced Filters -->
      <div v-if="showFilters" class="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <!-- Transaction Type -->
          <div>
            <label class="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Type</label>
            <select v-model="selectedType" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
              <option v-for="type in transactionTypes" :key="type.value" :value="type.value">
                {{ type.label }}
              </option>
            </select>
          </div>
          
          <!-- Category -->
          <div>
            <label class="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Category</label>
            <select v-model="selectedCategory" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
              <option v-for="cat in allCategories" :key="cat.value" :value="cat.value">
                {{ cat.icon }} {{ cat.label }}
              </option>
            </select>
          </div>
          
          <!-- Payment Method -->
          <div>
            <label class="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Payment Method</label>
            <select v-model="selectedPaymentMethod" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
              <option v-for="method in allPaymentMethods" :key="method.value" :value="method.value">
                {{ method.icon }} {{ method.label }}
              </option>
            </select>
          </div>
          
          <!-- Date Range -->
          <div>
            <label class="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Date Range</label>
            <div class="flex gap-2">
              <input
                v-model="dateFrom"
                type="date"
                class="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="From"
              />
              <input
                v-model="dateTo"
                type="date"
                class="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="To"
              />
            </div>
          </div>
          
          <!-- Amount Range -->
          <div>
            <label class="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Amount Range</label>
            <div class="flex gap-2">
              <input
                v-model="amountMin"
                type="number"
                step="0.01"
                class="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Min ₹"
              />
              <input
                v-model="amountMax"
                type="number"
                step="0.01"
                class="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Max ₹"
              />
            </div>
          </div>
        </div>
        
        <!-- Clear Filters -->
        <div v-if="activeFiltersCount > 0" class="mt-3 sm:mt-4 flex justify-end">
          <button
            @click="clearFilters"
            class="text-xs sm:text-sm text-indigo-600 hover:text-indigo-800 font-medium"
          >
            Clear all filters
          </button>
        </div>
      </div>
    </div>
    
    <!-- Transaction List -->
    <div class="space-y-4 sm:space-y-6">
      <div v-if="loading" class="text-center py-6 sm:py-8">
        <div class="inline-flex items-center">
          <svg class="animate-spin -ml-1 mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span class="text-sm sm:text-base">Loading transactions...</span>
        </div>
      </div>
      
      <div v-else-if="groupedTransactions.length === 0" class="text-center py-6 sm:py-8 bg-white rounded-lg border border-gray-200">
        <div class="text-gray-500 px-4">
          <BanknotesIcon class="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 text-gray-300" />
          <p class="text-base sm:text-lg font-medium">No transactions found</p>
          <p class="text-xs sm:text-sm mt-1">Try adjusting your filters or add a new transaction</p>
        </div>
      </div>
      
      <div v-else class="space-y-4 sm:space-y-6">
        <!-- Date Groups -->
        <div v-for="group in groupedTransactions" :key="group.date" class="bg-white rounded-lg shadow-sm border border-gray-200">
          <!-- Date Header -->
          <div class="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 bg-gray-50">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div class="flex items-center space-x-2 sm:space-x-3">
                <CalendarIcon class="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 flex-shrink-0" />
                <span class="text-sm sm:text-lg font-semibold text-gray-900">{{ formatDate(group.date) }}</span>
              </div>
              <div class="flex items-center space-x-2 sm:space-x-4 text-xs sm:text-sm">
                <span v-if="group.totalIncome > 0" class="text-green-600 font-medium truncate">
                  +{{ financeStore.formatIndianCurrency(group.totalIncome) }}
                </span>
                <span v-if="group.totalExpense > 0" class="text-red-600 font-medium truncate">
                  -{{ financeStore.formatIndianCurrency(group.totalExpense) }}
                </span>
                <span v-if="group.totalTransfer > 0" class="text-blue-600 font-medium truncate">
                  {{ financeStore.formatIndianCurrency(group.totalTransfer) }}
                </span>
              </div>
            </div>
          </div>
          
          <!-- Transactions -->
          <div class="divide-y divide-gray-200">
            <div
              v-for="transaction in group.transactions"
              :key="transaction.id"
              class="px-4 sm:px-6 py-3 sm:py-4 hover:bg-gray-50 transition-colors duration-150"
              :class="getTransactionColor(transaction.type)"
            >
              <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                <div class="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
                  <!-- Transaction Icon -->
                  <div class="flex-shrink-0">
                    <div class="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center" :class="getTransactionColor(transaction.type)">
                      <span class="text-base sm:text-lg">{{ getCategoryInfo(transaction.category, transaction.type).icon }}</span>
                    </div>
                  </div>
                  
                  <!-- Transaction Details -->
                  <div class="flex-1 min-w-0">
                    <div class="flex flex-col sm:flex-row sm:items-center sm:space-x-2">
                      <h3 class="text-sm font-medium text-gray-900 truncate">
                        {{ transaction.description || getCategoryInfo(transaction.category, transaction.type).name }}
                      </h3>
                      <span v-if="transaction.merchant" class="text-xs text-gray-500 truncate">
                        • {{ transaction.merchant }}
                      </span>
                    </div>
                    <div class="flex flex-wrap items-center gap-2 sm:gap-4 mt-1 text-xs text-gray-500">
                      <span class="flex items-center space-x-1">
                        <TagIcon class="h-3 w-3 flex-shrink-0" />
                        <span class="truncate">{{ getCategoryInfo(transaction.category, transaction.type).name }}</span>
                      </span>
                      <span class="flex items-center space-x-1">
                        <CreditCardIcon class="h-3 w-3 flex-shrink-0" />
                        <span class="truncate">{{ getPaymentMethodInfo(transaction.payment_method).name }}</span>
                      </span>
                      <span v-if="transaction.time" class="flex-shrink-0">{{ formatTime(transaction.time) }}</span>
                    </div>
                    <div v-if="transaction.notes" class="mt-1 text-xs text-gray-600 truncate">
                      {{ transaction.notes }}
                    </div>
                  </div>
                </div>
                
                <!-- Amount and Actions -->
                <div class="flex items-center justify-between sm:justify-end space-x-3">
                  <div class="text-right min-w-0">
                    <div class="text-sm font-semibold truncate" :class="transaction.type === 'income' ? 'text-green-600' : 'text-red-600'">
                      {{ transaction.type === 'income' ? '+' : '-' }}{{ financeStore.formatIndianCurrency(transaction.amount) }}
                    </div>
                    <div v-if="transaction.tags.length > 0" class="text-xs text-gray-500 mt-1 truncate">
                      {{ transaction.tags.join(', ') }}
                    </div>
                  </div>
                  
                  <!-- Action Buttons -->
                  <div class="flex items-center space-x-1 sm:space-x-2">
                    <button
                      @click="handleDuplicate(transaction)"
                      class="p-1 sm:p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                      title="Duplicate transaction"
                    >
                      <DocumentDuplicateIcon class="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                    <button
                      @click="handleEdit(transaction)"
                      class="p-1 sm:p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                      title="Edit transaction"
                    >
                      <PencilIcon class="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                    <button
                      @click="handleDelete(transaction)"
                      class="p-1 sm:p-2 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-50 transition-colors"
                      title="Delete transaction"
                    >
                      <TrashIcon class="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>