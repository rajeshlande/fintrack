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
const annualAmount = ref('')
const selectedFinancialYear = ref(budgetStore.getCurrentFinancialYear())
const useMonthlyBreakdown = ref(false)
const monthlyBreakdown = ref({})
const notes = ref('')

// Initialize monthly breakdown with equal distribution
const initializeMonthlyBreakdown = () => {
  if (annualAmount.value && parseFloat(annualAmount.value) > 0) {
    const monthlyAmount = parseFloat(annualAmount.value) / 12
    monthlyBreakdown.value = {}
    for (let i = 1; i <= 12; i++) {
      monthlyBreakdown.value[i] = monthlyAmount
    }
  }
}

// Computed
const months = [
  { value: 1, name: 'April' },    // Financial year starts in April
  { value: 2, name: 'May' },
  { value: 3, name: 'June' },
  { value: 4, name: 'July' },
  { value: 5, name: 'August' },
  { value: 6, name: 'September' },
  { value: 7, name: 'October' },
  { value: 8, name: 'November' },
  { value: 9, name: 'December' },
  { value: 10, name: 'January' },
  { value: 11, name: 'February' },
  { value: 12, name: 'March' }
]

const filteredCategories = computed(() => {
  return categories.value.filter(cat => cat.type === 'expense')
})

const totalMonthlyBreakdown = computed(() => {
  return Object.values(monthlyBreakdown.value).reduce((sum, amount) => sum + parseFloat(amount || 0), 0)
})

const isFormValid = computed(() => {
  if (!selectedCategory.value || !annualAmount.value || !selectedFinancialYear.value) {
    return false
  }
  
  const annualAmountValue = parseFloat(annualAmount.value)
  if (annualAmountValue <= 0) return false
  
  if (useMonthlyBreakdown.value) {
    return Math.abs(totalMonthlyBreakdown.value - annualAmountValue) < 0.01
  }
  
  return true
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

const handleAnnualAmountChange = () => {
  if (useMonthlyBreakdown.value) {
    initializeMonthlyBreakdown()
  }
}

const handleMonthlyBreakdownChange = (month, value) => {
  monthlyBreakdown.value = {
    ...monthlyBreakdown.value,
    [month]: value
  }
}

const equalizeMonthlyBreakdown = () => {
  initializeMonthlyBreakdown()
}

const handleSubmit = async () => {
  if (!isFormValid.value) return

  try {
    loading.value = true
    error.value = null

    const budgetData = {
      categoryId: selectedCategory.value,
      annualAmount: parseFloat(annualAmount.value),
      financialYear: selectedFinancialYear.value,
      monthlyBreakdown: useMonthlyBreakdown.value ? monthlyBreakdown.value : null,
      notes: notes.value
    }

    if (props.budgetId) {
      const updateData = {
        category_id: budgetData.categoryId,
        budget_amount: budgetData.annualAmount
      }
      await budgetStore.updateAnnualBudget(props.budgetId, updateData)
      emit('updated')
    } else {
      await budgetStore.createAnnualBudget(budgetData)
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
  annualAmount.value = ''
  selectedFinancialYear.value = budgetStore.getCurrentFinancialYear()
  useMonthlyBreakdown.value = false
  monthlyBreakdown.value = {}
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
  annualAmount.value = value
}

const formatMonthlyInput = (month, event) => {
  let value = event.target.value.replace(/[^\d.]/g, '')
  const parts = value.split('.')
  if (parts.length > 2) {
    value = parts[0] + '.' + parts.slice(1).join('')
  }
  if (parts[1] && parts[1].length > 2) {
    value = parts[0] + '.' + parts[1].substring(0, 2)
  }
  handleMonthlyBreakdownChange(month, value)
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
    const budget = budgetStore.annualBudgets.find(b => b.id === props.budgetId)
    if (budget) {
      selectedCategory.value = budget.category_id
      annualAmount.value = budget.budget_amount.toString()
      selectedFinancialYear.value = budget.financial_year
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
  class="w-full px-4 py-4 text-lg border-2 rounded-xl transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-opacity-50 border-red-300 focus:border-red-500 focus:ring-red-200 text-red-900"
  required
  aria-describedby="category-help"
  aria-required="true"
      >
        <option value="">Select a category</option>
        <option v-for="category in filteredCategories" 
                :key="category.id" 
                :value="category.id">
          {{ category.icon }} {{ category.name }}
        </option>
      </select>
    </div>

    <!-- Annual Budget Amount -->
    <div>
      <label for="annualAmount" class="block text-sm font-medium text-gray-700">
        Annual Budget Amount (₹) *
      </label>
      <div class="mt-1 relative rounded-md shadow-sm">
        <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <span class="text-gray-500 text-lg">₹</span>
        </div>
        <input
          id="annualAmount"
          v-model="annualAmount"
          @input="formatCurrencyInput"
          type="number"
          step="0.01"
          min="0"
          required
          class="w-full px-4 pl-12 py-4 text-lg border-2 rounded-xl transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-opacity-50 border-red-300 focus:border-red-500 focus:ring-red-200 text-red-900"
          placeholder="Enter amount"
          aria-describedby="annualAmount-help"
          aria-required="true"
        />
      </div>
      <p class="mt-1 text-sm text-gray-500">
        {{ financeStore.formatIndianCurrency(annualAmount || 0) }} per year
        <span v-if="annualAmount">
          ({{ financeStore.formatIndianCurrency(parseFloat(annualAmount || 0) / 12) }}/month)
        </span>
      </p>
    </div>

    <!-- Financial Year -->
    <div>
      <label for="financialYear" class="block text-sm font-medium text-gray-700">
        Financial Year *
      </label>
      <select
  id="financialYear"
  v-model="selectedFinancialYear"
  class="w-full px-4 py-4 text-lg border-2 rounded-xl transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-opacity-50 border-red-300 focus:border-red-500 focus:ring-red-200 text-red-900"
  required
  aria-describedby="financialYear-help"
  aria-required="true"
      >
        <option v-for="year in [2022, 2023, 2024, 2025, 2026]" 
                :key="year" :value="year">
          FY {{ year }}-{{ year + 1 }} (Apr {{ year }} - Mar {{ year + 1 }})
        </option>
      </select>
    </div>

    <!-- Monthly Breakdown Option -->
    <div>
      <div class="flex items-center">
        <input
          id="useMonthlyBreakdown"
          v-model="useMonthlyBreakdown"
          type="checkbox"
          class="h-5 w-5 text-red-600 focus:ring-2 focus:ring-red-200 border-red-300 rounded transition-all duration-200"
        />
        <label for="useMonthlyBreakdown" class="ml-2 block text-sm text-gray-700">
          Set custom monthly allocation (optional)
        </label>
      </div>
      <p class="mt-1 text-sm text-gray-500">
        By default, budget is equally distributed across all months. Enable this to set custom amounts for each month.
      </p>
    </div>

    <!-- Monthly Breakdown Grid -->
    <div v-if="useMonthlyBreakdown" class="space-y-4">
      <div class="flex justify-between items-center">
        <h4 class="text-sm font-medium text-gray-700">Monthly Allocation</h4>
        <button
          type="button"
          @click="equalizeMonthlyBreakdown"
          class="text-sm text-indigo-600 hover:text-indigo-500"
        >
          Equalize All Months
        </button>
      </div>
      
      <div class="grid grid-cols-2 gap-4">
        <div v-for="month in months" :key="month.value" class="space-y-1">
          <label :for="`month-${month.value}`" class="block text-xs font-medium text-gray-600">
            {{ month.name }}
          </label>
          <div class="relative rounded-md shadow-sm">
            <div class="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
              <span class="text-gray-400 text-xs">₹</span>
            </div>
            <input
              :id="`month-${month.value}`"
              :value="monthlyBreakdown[month.value] || ''"
              @input="formatMonthlyInput(month.value, $event)"
              type="number"
              step="0.01"
              min="0"
              class="w-full px-4 pl-8 py-3 text-base border-2 rounded-xl transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-opacity-50 border-red-300 focus:border-red-500 focus:ring-red-200 text-red-900"
              placeholder="Enter amount"
            />
          </div>
        </div>
      </div>
      
      <!-- Monthly Total Validation -->
      <div class="border-t pt-4">
        <div class="flex justify-between items-center">
          <span class="text-sm font-medium text-gray-700">Monthly Total:</span>
          <span class="text-sm font-medium" 
                :class="Math.abs(totalMonthlyBreakdown - parseFloat(annualAmount || 0)) < 0.01 ? 'text-green-600' : 'text-red-600'">
            {{ financeStore.formatIndianCurrency(totalMonthlyBreakdown) }}
          </span>
        </div>
        <div v-if="Math.abs(totalMonthlyBreakdown - parseFloat(annualAmount || 0)) >= 0.01" 
             class="mt-2 text-sm text-red-600">
          Monthly total must equal annual budget amount. Difference: 
          {{ financeStore.formatIndianCurrency(Math.abs(totalMonthlyBreakdown - parseFloat(annualAmount || 0))) }}
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
        class="w-full px-4 py-4 text-lg border-2 rounded-xl transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-opacity-50 border-red-300 focus:border-red-500 focus:ring-red-200 text-red-900"
        placeholder="Add any notes about this annual budget..."
        aria-describedby="notes-help"
        aria-required="false"
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
