<script setup>
import { ref, computed, onMounted } from 'vue'
import { useBudgetStore } from '@/stores/budget'
import { useFinanceStore } from '@/stores/finance'
import { categoriesService } from '@/services/budgetService'

const props = defineProps({
  budgetId: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['close', 'created', 'updated'])

const budgetStore = useBudgetStore()
const financeStore = useFinanceStore()

// Form state
const loading = ref(false)
const error = ref(null)
const categories = ref([])
const selectedCategory = ref('')
const budgetAmount = ref('')
const selectedMonth = ref(new Date().getMonth() + 1)
const selectedFinancialYear = ref(budgetStore.getCurrentFinancialYear())
const alertThreshold80 = ref(true)
const alertThreshold100 = ref(true)
const notes = ref('')

// Computed
const months = [
  { value: 1, name: 'January' },
  { value: 2, name: 'February' },
  { value: 3, name: 'March' },
  { value: 4, name: 'April' },
  { value: 5, name: 'May' },
  { value: 6, name: 'June' },
  { value: 7, name: 'July' },
  { value: 8, name: 'August' },
  { value: 9, name: 'September' },
  { value: 10, name: 'October' },
  { value: 11, name: 'November' },
  { value: 12, name: 'December' }
]

const filteredCategories = computed(() => {
  return categories.value.filter(cat => cat.type === 'expense')
})

const isFormValid = computed(() => {
  return selectedCategory.value && 
         budgetAmount.value && 
         parseFloat(budgetAmount.value) > 0 &&
         selectedMonth.value &&
         selectedFinancialYear.value
})

// Methods
const loadCategories = async () => {
  try {
    categories.value = await categoriesService.getCategories('expense')
  } catch (err) {
    console.error('Error loading categories:', err)
    error.value = 'Failed to load categories'
  }
}

const handleSubmit = async () => {
  if (!isFormValid.value) return

  try {
    loading.value = true
    error.value = null

    const budgetData = {
      categoryId: selectedCategory.value,
      budgetAmount: parseFloat(budgetAmount.value),
      month: selectedMonth.value,
      financialYear: selectedFinancialYear.value,
      alertThreshold80: alertThreshold80.value,
      alertThreshold100: alertThreshold100.value,
      notes: notes.value
    }

    if (props.budgetId) {
      await budgetStore.updateMonthlyBudget(props.budgetId, budgetData)
      emit('updated')
    } else {
      await budgetStore.createMonthlyBudget(budgetData)
      emit('created')
    }

    emit('close')
    resetForm()
  } catch (err) {
    error.value = err.message || 'Failed to save budget'
  } finally {
    loading.value = false
  }
}

const resetForm = () => {
  selectedCategory.value = ''
  budgetAmount.value = ''
  selectedMonth.value = new Date().getMonth() + 1
  selectedFinancialYear.value = budgetStore.getCurrentFinancialYear()
  alertThreshold80.value = true
  alertThreshold100.value = true
  notes.value = ''
  error.value = null
}

const formatCurrencyInput = (event) => {
  let value = event.target.value.replace(/[^\d.]/g, '')
  const parts = value.split('.')
  if (parts.length > 2) {
    value = parts[0] + '.' + parts.slice(1).join('')
  }
  if (parts[1] && parts[1].length > 2) {
    value = parts[0] + '.' + parts[1].substring(0, 2)
  }
  budgetAmount.value = value
}

onMounted(async () => {
  await loadCategories()
  
  // Load existing budget data if editing
  if (props.budgetId) {
    await loadBudgetData()
  }
})

const loadBudgetData = async () => {
  try {
    const budget = budgetStore.monthlyBudgets.find(b => b.id === props.budgetId)
    if (budget) {
      selectedCategory.value = budget.category_id
      budgetAmount.value = budget.budget_amount.toString()
      selectedMonth.value = budget.month
      selectedFinancialYear.value = budget.year
      alertThreshold80.value = budget.alert_threshold_80 !== false
      alertThreshold100.value = budget.alert_threshold_100 !== false
      notes.value = budget.notes || ''
    }
  } catch (err) {
    console.error('Error loading budget data:', err)
    error.value = 'Failed to load budget data'
  }
}
</script>

<template>
  <form @submit.prevent="handleSubmit" class="space-y-6">
    <!-- Error Message -->
    <div v-if="error" class="rounded-md bg-red-50 p-4">
      <div class="flex">
        <div class="ml-3">
          <h3 class="text-sm font-medium text-red-800">Error</h3>
          <div class="mt-2 text-sm text-red-700">
            {{ error }}
          </div>
        </div>
      </div>
    </div>

    <!-- Category Selection -->
    <div>
      <label for="category" class="block text-sm font-medium text-gray-700">
        Category *
      </label>
      <select
        id="category"
        v-model="selectedCategory"
        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        required
      >
        <option value="">Select a category</option>
        <option v-for="category in filteredCategories" 
                :key="category.id" 
                :value="category.id">
          {{ category.icon }} {{ category.name }}
        </option>
      </select>
    </div>

    <!-- Budget Amount -->
    <div>
      <label for="amount" class="block text-sm font-medium text-gray-700">
        Budget Amount (₹) *
      </label>
      <div class="mt-1 relative rounded-md shadow-sm">
        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <span class="text-gray-500 sm:text-sm">₹</span>
        </div>
        <input
          id="amount"
          v-model="budgetAmount"
          @input="formatCurrencyInput"
          type="text"
          class="block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="0.00"
          required
        />
      </div>
      <p class="mt-1 text-sm text-gray-500">
        Enter the monthly budget amount for this category
      </p>
    </div>

    <!-- Month Selection -->
    <div class="grid grid-cols-2 gap-4">
      <div>
        <label for="month" class="block text-sm font-medium text-gray-700">
          Month *
        </label>
        <select
          id="month"
          v-model="selectedMonth"
          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          required
        >
          <option v-for="month in months" :key="month.value" :value="month.value">
            {{ month.name }}
          </option>
        </select>
      </div>

      <div>
        <label for="financialYear" class="block text-sm font-medium text-gray-700">
          Financial Year *
        </label>
        <select
          id="financialYear"
          v-model="selectedFinancialYear"
          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          required
        >
          <option v-for="year in [2022, 2023, 2024, 2025, 2026]" 
                  :key="year" :value="year">
            FY {{ year }}-{{ year + 1 }}
          </option>
        </select>
      </div>
    </div>

    <!-- Alert Settings -->
    <div class="space-y-3">
      <label class="block text-sm font-medium text-gray-700">
        Budget Alerts
      </label>
      
      <div class="space-y-2">
        <div class="flex items-center">
          <input
            id="alert80"
            v-model="alertThreshold80"
            type="checkbox"
            class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <label for="alert80" class="ml-2 block text-sm text-gray-700">
            Alert when 80% of budget is used
          </label>
        </div>
        
        <div class="flex items-center">
          <input
            id="alert100"
            v-model="alertThreshold100"
            type="checkbox"
            class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <label for="alert100" class="ml-2 block text-sm text-gray-700">
            Alert when budget is exceeded
          </label>
        </div>
      </div>
    </div>

    <!-- Notes -->
    <div>
      <label for="notes" class="block text-sm font-medium text-gray-700">
        Notes
      </label>
      <textarea
        id="notes"
        v-model="notes"
        rows="3"
        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        placeholder="Add any notes about this budget..."
      ></textarea>
    </div>

    <!-- Form Actions -->
    <div class="flex justify-end space-x-3 pt-4 border-t">
      <button
        type="button"
        @click="$emit('close')"
        class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        Cancel
      </button>
      <button
        type="submit"
        :disabled="!isFormValid || loading"
        class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span v-if="loading">Saving...</span>
        <span v-else>{{ props.budgetId ? 'Update Budget' : 'Create Budget' }}</span>
      </button>
    </div>
  </form>
</template>
