<script setup>
import { ref, computed, onMounted } from 'vue'
import { useFinanceStore } from '@/stores/finance'
import { useCategoriesStore } from '@/stores/categories'
import { usePaymentMethodsStore } from '@/stores/paymentMethods'
import { CurrencyRupeeIcon, CalendarIcon, TagIcon, DocumentTextIcon, CreditCardIcon } from '@heroicons/vue/24/outline'

const props = defineProps({
  type: {
    type: String,
    default: 'expense',
    validator: (value) => ['income', 'expense'].includes(value)
  }
})

const emit = defineEmits(['submit', 'close'])

const financeStore = useFinanceStore()
const categoriesStore = useCategoriesStore()
const paymentMethodsStore = usePaymentMethodsStore()

// Form data
const amount = ref('')
const category = ref('')
const description = ref('')
const date = ref(new Date().toISOString().split('T')[0])
const paymentMethod = ref('')

// UI state
const activeTab = ref(props.type)
const isSubmitting = ref(false)
const submitMessage = ref('')
const submitError = ref('')
const showMessage = ref(false)

// Categories based on active tab - fetch from database
// Filtered categories based on active tab
const filteredCategories = computed(() => {
  const allCategories = categoriesStore.categories
  const currentTab = activeTab.value
  
  if (!allCategories || !allCategories.length) {
    return []
  }
  
  return allCategories.filter(cat => {
    if (currentTab === 'income') {
      return cat.type === 'income'
    } else {
      // For expense, show only user-created categories (is_default = false)
      return cat.type === 'expense' && cat.is_default === false
    }
  })
})

// Payment methods
const paymentMethods = computed(() => paymentMethodsStore.paymentMethods)

// Fetch data on component mount
onMounted(async () => {
  try {
    await Promise.all([
      categoriesStore.fetchCategories(),
      paymentMethodsStore.fetchPaymentMethods()
    ])
  } catch (error) {
    console.error('Error fetching data:', error)
  }
})

// Amount formatting
const formatAmount = (value) => {
  if (!value) return ''
  return financeStore.formatIndianCurrency(parseFloat(value))
}

// Tab switching
const switchTab = (tab) => {
  activeTab.value = tab
  category.value = '' // Reset category when switching tabs
}

// Keyboard navigation for tabs
const handleTabKeydown = (event, tab) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    switchTab(tab)
  } else if (event.key === 'ArrowRight' && tab === 'income') {
    event.preventDefault()
    document.querySelector('[aria-controls="expense-panel"]').focus()
  } else if (event.key === 'ArrowLeft' && tab === 'expense') {
    event.preventDefault()
    document.querySelector('[aria-controls="income-panel"]').focus()
  }
}

// Form submission
const handleSubmit = async () => {
  if (!amount.value || !category.value || !paymentMethod.value) {
    submitError.value = 'Please fill in all required fields'
    showMessage.value = true
    setTimeout(() => {
      showMessage.value = false
      submitError.value = ''
    }, 3000)
    return
  }

  isSubmitting.value = true
  submitMessage.value = ''
  submitError.value = ''

  try {
    const transactionData = {
      amount: parseFloat(amount.value),
      category_id: category.value,
      payment_method: paymentMethod.value,
      title: description.value || 'Transaction',
      description: description.value,
      date: date.value,
      type: activeTab.value
    }

    await new Promise((resolve, reject) => {
      emit('submit', transactionData)
      // Wait for parent to handle the submission
      setTimeout(() => {
        // Check if parent handled successfully (no error thrown)
        if (!submitError.value) {
          const transactionType = activeTab.value === 'income' ? 'Income' : 'Expense'
          submitMessage.value = `${transactionType} transaction added successfully!`
          showMessage.value = true
          
          // Reset form after successful submission
          amount.value = ''
          category.value = ''
          description.value = ''
          date.value = new Date().toISOString().split('T')[0]
          paymentMethod.value = ''
          
          // Hide success message after 3 seconds
          setTimeout(() => {
            showMessage.value = false
            submitMessage.value = ''
          }, 3000)
        }
        resolve()
      }, 100)
    })

  } catch (error) {
    submitError.value = `Failed to add ${activeTab.value === 'income' ? 'income' : 'expense'} transaction`
    showMessage.value = true
    console.error('Transaction submission failed:', error)
    
    // Hide error message after 5 seconds
    setTimeout(() => {
      showMessage.value = false
      submitError.value = ''
    }, 5000)
  } finally {
    isSubmitting.value = false
  }
}


</script>

<template>
  <div class="min-h-screen bg-gray-50 py-4 sm:py-8">
    <div class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">
          Add Transaction
        </h1>
        <p class="text-lg text-gray-600">
          Track your income and expenses
        </p>
      </div>

      <!-- Success/Error Messages -->
      <div v-if="showMessage" class="mb-6">
        <!-- Success Message -->
        <div v-if="submitMessage" class="bg-green-50 border border-green-200 rounded-md p-4">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="ml-3">
              <h3 class="text-sm font-medium text-green-800">
                Success
              </h3>
              <div class="mt-2 text-sm text-green-700">
                <p>{{ submitMessage }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Error Message -->
        <div v-if="submitError" class="bg-red-50 border border-red-200 rounded-md p-4">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="ml-3">
              <h3 class="text-sm font-medium text-red-800">
                Error
              </h3>
              <div class="mt-2 text-sm text-red-700">
                <p>{{ submitError }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tab Switcher -->
      <div class="bg-white rounded-2xl shadow-lg border border-gray-200 mb-8 overflow-hidden">
        <div class="grid grid-cols-2">
          <button
            @click="switchTab('income')"
            @keydown="handleTabKeydown($event, 'income')"
            :class="[
              'py-4 px-6 text-center font-semibold text-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2',
              activeTab === 'income' 
                ? 'bg-green-50 text-green-700 border-b-2 border-green-500' 
                : 'bg-white text-gray-600 hover:bg-gray-50 border-b-2 border-transparent'
            ]"
            role="tab"
            :aria-selected="activeTab === 'income'"
            :tabindex="activeTab === 'income' ? 0 : -1"
            aria-controls="income-panel"
            id="income-tab"
          >
            <div class="flex items-center justify-center space-x-2">
              <div class="w-3 h-3 bg-green-500 rounded-full" aria-hidden="true"></div>
              <span class="text-base">Income</span>
            </div>
          </button>
          <button
            @click="switchTab('expense')"
            @keydown="handleTabKeydown($event, 'expense')"
            :class="[
              'py-4 px-6 text-center font-semibold text-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2',
              activeTab === 'expense' 
                ? 'bg-red-50 text-red-700 border-b-2 border-red-500' 
                : 'bg-white text-gray-600 hover:bg-gray-50 border-b-2 border-transparent'
            ]"
            role="tab"
            :aria-selected="activeTab === 'expense'"
            :tabindex="activeTab === 'expense' ? 0 : -1"
            aria-controls="expense-panel"
            id="expense-tab"
          >
            <div class="flex items-center justify-center space-x-2">
              <div class="w-3 h-3 bg-red-500 rounded-full" aria-hidden="true"></div>
              <span class="text-base">Expense</span>
            </div>
          </button>
        </div>
      </div>

      <!-- Form Card -->
      <div class="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 sm:p-8 mb-8" :id="activeTab + '-panel'" role="tabpanel" :aria-labelledby="activeTab + '-tab'">
        <form @submit.prevent="handleSubmit" class="space-y-8" aria-label="Transaction form">
          <!-- Amount Field -->
          <div>
            <label for="amount" class="block text-lg font-semibold text-gray-900 mb-3">
              <CurrencyRupeeIcon class="h-6 w-6 inline mr-3 text-gray-500" aria-hidden="true" />
              Amount (₹) <span class="text-red-500" aria-label="required">*</span>
            </label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <CurrencyRupeeIcon class="h-6 w-6 text-gray-400" />
              </div>
              <input
                id="amount"
                v-model="amount"
                type="number"
                step="0.01"
                min="0"
                required
                :class="[
                  'w-full px-4 pl-12 py-4 text-lg border-2 rounded-xl transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-opacity-50',
                  activeTab === 'income' 
                    ? 'border-green-300 focus:border-green-500 focus:ring-green-200 text-green-900' 
                    : 'border-red-300 focus:border-red-500 focus:ring-red-200 text-red-900'
                ]"
                placeholder="Enter amount"
                aria-describedby="amount-help"
                aria-required="true"
              />
            </div>
            <p v-if="amount" class="mt-3 text-base text-gray-700 font-medium" id="amount-help">
              {{ formatAmount(amount) }}
            </p>
            <p v-else class="mt-3 text-base text-gray-500" id="amount-help">
              Enter the transaction amount
            </p>
          </div>

          <!-- Category Field -->
          <div>
            <label for="category" class="block text-lg font-semibold text-gray-900 mb-3">
              <TagIcon class="h-6 w-6 inline mr-3 text-gray-500" aria-hidden="true" />
              Category <span class="text-red-500" aria-label="required">*</span>
            </label>
            <select
              id="category"
              v-model="category"
              required
              :class="[
                'w-full px-4 py-4 text-lg border-2 rounded-xl transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-opacity-50',
                activeTab === 'income' 
                  ? 'border-green-300 focus:border-green-500 focus:ring-green-200 text-green-900' 
                  : 'border-red-300 focus:border-red-500 focus:ring-red-200 text-red-900'
              ]"
              aria-describedby="category-help"
              aria-required="true"
            >
              <option value="" disabled>Select category</option>
              <option v-for="cat in filteredCategories" :key="cat.id" :value="cat.id">
                {{ cat.icon }} {{ cat.name }}
              </option>
            </select>
            <p class="mt-3 text-base text-gray-500" id="category-help">
              Select a category for this transaction
            </p>
          </div>

          <!-- Payment Method Field -->
          <div>
            <label for="payment-method" class="block text-lg font-semibold text-gray-900 mb-3">
              <CreditCardIcon class="h-6 w-6 inline mr-3 text-gray-500" aria-hidden="true" />
              Payment Method <span class="text-red-500" aria-label="required">*</span>
            </label>
            <select
              id="payment-method"
              v-model="paymentMethod"
              required
              :class="[
                'w-full px-4 py-4 text-lg border-2 rounded-xl transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-opacity-50',
                activeTab === 'income'
                  ? 'border-green-300 focus:border-green-500 focus:ring-green-200 text-green-900'
                  : 'border-red-300 focus:border-red-500 focus:ring-red-200 text-red-900'
              ]"
              aria-describedby="payment-method-help"
              aria-required="true"
            >
              <option value="" disabled>Select payment method</option>
              <option v-for="method in paymentMethods" :key="method.id" :value="method.name">
                {{ method.name }}
              </option>
            </select>
            <p class="mt-3 text-base text-gray-500" id="payment-method-help">
              How did you pay for this transaction?
            </p>
          </div>

          <!-- Date Field -->
          <div>
            <label for="date" class="block text-lg font-semibold text-gray-900 mb-3">
              <CalendarIcon class="h-6 w-6 inline mr-3 text-gray-500" aria-hidden="true" />
              Date <span class="text-red-500" aria-label="required">*</span>
            </label>
            <input
              id="date"
              v-model="date"
              type="date"
              required
              :class="[
                'w-full px-4 py-4 text-lg border-2 rounded-xl transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-opacity-50',
                activeTab === 'income' 
                  ? 'border-green-300 focus:border-green-500 focus:ring-green-200 text-green-900' 
                  : 'border-red-300 focus:border-red-500 focus:ring-red-200 text-red-900'
              ]"
              aria-describedby="date-help"
              aria-required="true"
            />
            <p class="mt-3 text-base text-gray-500" id="date-help">
              Select the transaction date
            </p>
          </div>

          <!-- Description Field -->
          <div>
            <label for="description" class="block text-lg font-semibold text-gray-900 mb-3">
              <DocumentTextIcon class="h-6 w-6 inline mr-3 text-gray-500" aria-hidden="true" />
              Description (Optional)
            </label>
            <textarea
              id="description"
              v-model="description"
              rows="4"
              :class="[
                'w-full px-4 py-4 text-lg border-2 rounded-xl transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-opacity-50 resize-none',
                activeTab === 'income' 
                  ? 'border-green-300 focus:border-green-500 focus:ring-green-200 text-green-900' 
                  : 'border-red-300 focus:border-red-500 focus:ring-red-200 text-red-900'
              ]"
              placeholder="Optional description"
              aria-describedby="description-help"
            ></textarea>
            <p class="mt-3 text-base text-gray-500" id="description-help">
              Add any additional details about this transaction (optional)
            </p>
          </div>

          <!-- Action Buttons -->
          <div class="flex flex-col sm:flex-row gap-4 pt-6">
            <button
              type="submit"
              :disabled="isSubmitting || !amount || !category || !paymentMethod"
              :class="[
                'flex-1 py-4 px-6 text-lg font-semibold rounded-xl transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none',
                activeTab === 'income' 
                  ? 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-300' 
                  : 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-300'
              ]"
              :aria-label="'Add ' + activeTab + ' transaction'"
              :aria-busy="isSubmitting"
            >
              <span v-if="isSubmitting" class="flex items-center justify-center">
                <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Adding...
              </span>
              <span v-else>
                Add {{ activeTab === 'income' ? 'Income' : 'Expense' }}
              </span>
            </button>
          </div>
        </form>
      </div>

      <!-- Quick Stats -->
      <div class="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 sm:p-8">
        <h3 class="text-xl font-bold text-gray-900 mb-6 text-center">Quick Stats</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div class="text-center p-6 bg-green-50 rounded-xl border border-green-200">
            <div class="text-3xl font-bold text-green-600 mb-2">
              ₹{{ financeStore.totalIncome.toLocaleString('en-IN') }}
            </div>
            <div class="text-base font-medium text-gray-700">Total Income</div>
          </div>
          <div class="text-center p-6 bg-red-50 rounded-xl border border-red-200">
            <div class="text-3xl font-bold text-red-600 mb-2">
              ₹{{ financeStore.totalExpenses.toLocaleString('en-IN') }}
            </div>
            <div class="text-base font-medium text-gray-700">Total Expenses</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
