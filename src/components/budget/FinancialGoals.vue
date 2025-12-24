<script setup>
import { ref, computed, onMounted } from 'vue'
import { useBudgetStore } from '@/stores/budget'
import { useFinanceStore } from '@/stores/finance'
import { 
  PlusIcon,
  FlagIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/vue/24/outline'
import { 
  Dialog, 
  DialogPanel, 
  DialogTitle,
  TransitionRoot,
  TransitionChild
} from '@headlessui/vue'

const budgetStore = useBudgetStore()
const financeStore = useFinanceStore()

const showGoalModal = ref(false)
const editingGoal = ref(null)
const loading = ref(false)
const error = ref(null)

// Form state
const goalForm = ref({
  title: '',
  description: '',
  targetAmount: '',
  currentAmount: '',
  targetDate: '',
  goalType: 'other',
  priority: 'medium',
  monthlyContribution: '',
  linkedInvestmentType: ''
})

const goalTypes = [
  { value: 'emergency_fund', name: 'Emergency Fund', icon: '🛡️', description: '3-6 months of expenses' },
  { value: 'home', name: 'Home Purchase', icon: '🏠', description: 'Buy a house or apartment' },
  { value: 'education', name: 'Education', icon: '📚', description: 'Higher education or courses' },
  { value: 'retirement', name: 'Retirement', icon: '👴', description: 'Retirement planning' },
  { value: 'travel', name: 'Travel', icon: '✈️', description: 'Vacation and travel' },
  { value: 'vehicle', name: 'Vehicle', icon: '🚗', description: 'Car or bike purchase' },
  { value: 'investment', name: 'Investment', icon: '💹', description: 'Investment portfolio' },
  { value: 'other', name: 'Other', icon: '🎯', description: 'Custom goal' }
]

const priorities = [
  { value: 'low', name: 'Low', color: 'gray' },
  { value: 'medium', name: 'Medium', color: 'yellow' },
  { value: 'high', name: 'High', color: 'red' }
]

const investmentTypes = [
  { value: '', name: 'None' },
  { value: 'fd', name: 'Fixed Deposit (FD)' },
  { value: 'rd', name: 'Recurring Deposit (RD)' },
  { value: 'sip', name: 'Systematic Investment Plan (SIP)' },
  { value: 'equity_mf', name: 'Equity Mutual Fund' },
  { value: 'debt_mf', name: 'Debt Mutual Fund' },
  { value: 'stock', name: 'Direct Stocks' },
  { value: 'ppf', name: 'Public Provident Fund (PPF)' },
  { value: 'epf', name: 'Employee Provident Fund (EPF)' }
]

// Computed
const goalsWithProgress = computed(() => {
  return budgetStore.goalsProgress.map(goal => ({
    ...goal,
    progressPercentage: Math.min((goal.current_amount / goal.target_amount) * 100, 100),
    remainingAmount: Math.max(goal.target_amount - goal.current_amount, 0),
    monthsRemaining: Math.max(Math.ceil((new Date(goal.target_date) - new Date()) / (1000 * 60 * 60 * 24 * 30)), 0),
    isOverdue: new Date(goal.target_date) < new Date(),
    monthlyRequired: goal.monthly_contribution || Math.ceil(goal.remaining_amount / Math.max(goal.months_remaining, 1))
  }))
})

const totalGoalsTarget = computed(() => {
  return goalsWithProgress.value.reduce((total, goal) => total + goal.target_amount, 0)
})

const totalGoalsCurrent = computed(() => {
  return goalsWithProgress.value.reduce((total, goal) => total + goal.current_amount, 0)
})

const overallProgress = computed(() => {
  return totalGoalsTarget.value > 0 ? (totalGoalsCurrent.value / totalGoalsTarget.value * 100).toFixed(1) : 0
})

const goalsByStatus = computed(() => {
  const completed = goalsWithProgress.value.filter(goal => goal.progressPercentage >= 100)
  const onTrack = goalsWithProgress.value.filter(goal => 
    goal.progressPercentage < 100 && !goal.isOverdue
  )
  const overdue = goalsWithProgress.value.filter(goal => goal.isOverdue)
  
  return { completed, onTrack, overdue }
})

// Methods
const openGoalModal = (goal = null) => {
  editingGoal.value = goal
  if (goal) {
    goalForm.value = {
      title: goal.title,
      description: goal.description || '',
      targetAmount: goal.target_amount.toString(),
      currentAmount: goal.current_amount.toString(),
      targetDate: goal.target_date,
      goalType: goal.goal_type,
      priority: goal.priority,
      monthlyContribution: goal.monthly_contribution?.toString() || '',
      linkedInvestmentType: goal.linked_investment_type || ''
    }
  } else {
    resetForm()
  }
  showGoalModal.value = true
}

const closeGoalModal = () => {
  showGoalModal.value = false
  editingGoal.value = null
  resetForm()
}

const resetForm = () => {
  goalForm.value = {
    title: '',
    description: '',
    targetAmount: '',
    currentAmount: '',
    targetDate: '',
    goalType: 'other',
    priority: 'medium',
    monthlyContribution: '',
    linkedInvestmentType: ''
  }
  error.value = null
}

const handleSubmit = async () => {
  try {
    loading.value = true
    error.value = null

    const goalData = {
      title: goalForm.value.title,
      description: goalForm.value.description,
      targetAmount: parseFloat(goalForm.value.targetAmount),
      currentAmount: parseFloat(goalForm.value.currentAmount) || 0,
      targetDate: goalForm.value.targetDate,
      goalType: goalForm.value.goalType,
      priority: goalForm.value.priority,
      monthlyContribution: parseFloat(goalForm.value.monthlyContribution) || 0,
      linkedInvestmentType: goalForm.value.linkedInvestmentType || null
    }

    if (editingGoal.value) {
      await budgetStore.updateFinancialGoal(editingGoal.value.id, goalData)
    } else {
      await budgetStore.createFinancialGoal(goalData)
    }

    closeGoalModal()
  } catch (err) {
    error.value = err.message || 'Failed to save goal'
  } finally {
    loading.value = false
  }
}

const deleteGoal = async (goalId) => {
  if (!confirm('Are you sure you want to delete this goal?')) return
  
  try {
    await budgetStore.deleteFinancialGoal(goalId)
  } catch (err) {
    console.error('Error deleting goal:', err)
  }
}

const formatCurrencyInput = (field, event) => {
  let value = event.target.value.replace(/[^\d.]/g, '')
  const parts = value.split('.')
  if (parts.length > 2) {
    value = parts[0] + '.' + parts.slice(1).join('')
  }
  if (parts[1] && parts[1].length > 2) {
    value = parts[0] + '.' + parts[1].substring(0, 2)
  }
  
  goalForm.value[field] = value
}

const getGoalTypeInfo = (type) => {
  return goalTypes.find(t => t.value === type) || goalTypes[goalTypes.length - 1]
}

const getPriorityInfo = (priority) => {
  return priorities.find(p => p.value === priority) || priorities[1]
}

const getProgressColor = (percentage) => {
  if (percentage >= 100) return 'green'
  if (percentage >= 75) return 'blue'
  if (percentage >= 50) return 'yellow'
  if (percentage >= 25) return 'orange'
  return 'red'
}

onMounted(async () => {
  await budgetStore.fetchFinancialGoals()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Goals Summary Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <FlagIcon class="h-8 w-8 text-indigo-600" />
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600">Total Goals</p>
            <p class="text-2xl font-bold text-gray-900">{{ goalsWithProgress.length }}</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <CurrencyDollarIcon class="h-8 w-8 text-green-600" />
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600">Total Target</p>
            <p class="text-2xl font-bold text-gray-900">
              {{ financeStore.formatIndianCurrency(totalGoalsTarget) }}
            </p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <ArrowTrendingUpIcon class="h-8 w-8 text-purple-600" />
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600">Current Progress</p>
            <p class="text-2xl font-bold text-gray-900">
              {{ financeStore.formatIndianCurrency(totalGoalsCurrent) }}
            </p>
            <p class="text-sm text-gray-500">{{ overallProgress }}% complete</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <CheckCircleIcon class="h-8 w-8 text-orange-600" />
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600">Completed</p>
            <p class="text-2xl font-bold text-gray-900">{{ goalsByStatus.completed.length }}</p>
            <p class="text-sm text-gray-500">{{ goalsByStatus.onTrack.length }} on track</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Goal Button -->
    <div class="flex justify-end">
      <button
        @click="openGoalModal()"
        class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        <PlusIcon class="h-4 w-4 mr-2" />
        Add Goal
      </button>
    </div>

    <!-- Goals List -->
    <div class="bg-white rounded-lg shadow">
      <div class="px-6 py-4 border-b border-gray-200">
        <h3 class="text-lg font-medium text-gray-900">Financial Goals</h3>
      </div>
      
      <div v-if="goalsWithProgress.length === 0" class="p-12 text-center">
        <FlagIcon class="mx-auto h-12 w-12 text-gray-400" />
        <h3 class="mt-2 text-sm font-medium text-gray-900">No goals yet</h3>
        <p class="mt-1 text-sm text-gray-500">Start by creating your first financial goal.</p>
        <div class="mt-6">
          <button
            @click="openGoalModal()"
            class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <PlusIcon class="h-4 w-4 mr-2" />
            Create Your First Goal
          </button>
        </div>
      </div>

      <div v-else class="divide-y divide-gray-200">
        <div v-for="goal in goalsWithProgress" :key="goal.id" class="p-6">
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="flex items-center">
                <span class="text-2xl mr-3">{{ getGoalTypeInfo(goal.goal_type).icon }}</span>
                <div>
                  <h4 class="text-lg font-medium text-gray-900">{{ goal.title }}</h4>
                  <p v-if="goal.description" class="text-sm text-gray-600 mt-1">{{ goal.description }}</p>
                </div>
              </div>

              <!-- Progress Bar -->
              <div class="mt-4">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-sm font-medium text-gray-700">Progress</span>
                  <span class="text-sm text-gray-500">{{ goal.progressPercentage.toFixed(1) }}%</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    class="h-2 rounded-full transition-all duration-300"
                    :class="`bg-${getProgressColor(goal.progressPercentage)}-500`"
                    :style="{ width: `${goal.progressPercentage}%` }"
                  ></div>
                </div>
              </div>

              <!-- Goal Details -->
              <div class="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p class="text-gray-500">Target Amount</p>
                  <p class="font-medium text-gray-900">
                    {{ financeStore.formatIndianCurrency(goal.target_amount) }}
                  </p>
                </div>
                <div>
                  <p class="text-gray-500">Current Amount</p>
                  <p class="font-medium text-gray-900">
                    {{ financeStore.formatIndianCurrency(goal.current_amount) }}
                  </p>
                </div>
                <div>
                  <p class="text-gray-500">Target Date</p>
                  <p class="font-medium" :class="goal.isOverdue ? 'text-red-600' : 'text-gray-900'">
                    {{ new Date(goal.target_date).toLocaleDateString() }}
                  </p>
                </div>
                <div>
                  <p class="text-gray-500">Monthly Required</p>
                  <p class="font-medium text-gray-900">
                    {{ financeStore.formatIndianCurrency(goal.monthlyRequired) }}
                  </p>
                </div>
              </div>

              <!-- Tags -->
              <div class="mt-4 flex items-center space-x-2">
                <span 
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                  :class="`bg-${getPriorityInfo(goal.priority).color}-100 text-${getPriorityInfo(goal.priority).color}-800`"
                >
                  {{ getPriorityInfo(goal.priority).name }} Priority
                </span>
                
                <span v-if="goal.linked_investment_type" 
                      class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {{ investmentTypes.find(t => t.value === goal.linked_investment_type)?.name }}
                </span>

                <span v-if="goal.isOverdue" 
                      class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  <ClockIcon class="h-3 w-3 mr-1" />
                  Overdue
                </span>
                
                <span v-else-if="goal.progressPercentage >= 100" 
                      class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <CheckCircleIcon class="h-3 w-3 mr-1" />
                  Completed
                </span>
              </div>
            </div>

            <!-- Actions -->
            <div class="ml-4 flex space-x-2">
              <button
                @click="openGoalModal(goal)"
                class="text-gray-400 hover:text-gray-600"
                title="Edit Goal"
              >
                <PencilIcon class="h-5 w-5" />
              </button>
              <button
                @click="deleteGoal(goal.id)"
                class="text-gray-400 hover:text-red-600"
                title="Delete Goal"
              >
                <TrashIcon class="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Goal Modal -->
    <TransitionRoot appear :show="showGoalModal" as="template">
      <Dialog as="div" @close="closeGoalModal" class="relative z-10">
        <TransitionChild
          as="template"
          enter="duration-300 ease-out"
          enter-from="opacity-0"
          enter-to="opacity-100"
          leave="duration-200 ease-in"
          leave-from="opacity-100"
          leave-to="opacity-0"
        >
          <div class="fixed inset-0 bg-black bg-opacity-25" />
        </TransitionChild>

        <div class="fixed inset-0 overflow-y-auto">
          <div class="flex min-h-full items-center justify-center p-4 text-center">
            <TransitionChild
              as="template"
              enter="duration-300 ease-out"
              enter-from="opacity-0 scale-95"
              enter-to="opacity-100 scale-100"
              leave="duration-200 ease-in"
              leave-from="opacity-100 scale-100"
              leave-to="opacity-0 scale-95"
            >
              <DialogPanel class="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <DialogTitle as="h3" class="text-lg font-medium leading-6 text-gray-900 mb-6">
                  {{ editingGoal ? 'Edit Goal' : 'Create New Goal' }}
                </DialogTitle>

                <form @submit.prevent="handleSubmit" class="space-y-6">
                  <!-- Error Message -->
                  <div v-if="error" class="rounded-md bg-red-50 p-4">
                    <div class="text-sm text-red-700">{{ error }}</div>
                  </div>

                  <!-- Basic Info -->
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label for="title" class="block text-sm font-medium text-gray-700">
                        Goal Title *
                      </label>
                      <input
                        id="title"
                        v-model="goalForm.title"
                        type="text"
                        required
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        placeholder="e.g., Buy a House"
                      />
                    </div>

                    <div>
                      <label for="goalType" class="block text-sm font-medium text-gray-700">
                        Goal Type *
                      </label>
                      <select
                        id="goalType"
                        v-model="goalForm.goalType"
                        required
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      >
                        <option v-for="type in goalTypes" :key="type.value" :value="type.value">
                          {{ type.icon }} {{ type.name }}
                        </option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label for="description" class="block text-sm font-medium text-gray-700">
                      Description
                    </label>
                    <textarea
                      id="description"
                      v-model="goalForm.description"
                      rows="3"
                      class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      placeholder="Describe your goal..."
                    ></textarea>
                  </div>

                  <!-- Financial Details -->
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label for="targetAmount" class="block text-sm font-medium text-gray-700">
                        Target Amount (₹) *
                      </label>
                      <div class="mt-1 relative rounded-md shadow-sm">
                        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span class="text-gray-500 sm:text-sm">₹</span>
                        </div>
                        <input
                          id="targetAmount"
                          v-model="goalForm.targetAmount"
                          @input="formatCurrencyInput('targetAmount', $event)"
                          type="text"
                          required
                          class="block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    <div>
                      <label for="currentAmount" class="block text-sm font-medium text-gray-700">
                        Current Amount (₹)
                      </label>
                      <div class="mt-1 relative rounded-md shadow-sm">
                        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span class="text-gray-500 sm:text-sm">₹</span>
                        </div>
                        <input
                          id="currentAmount"
                          v-model="goalForm.currentAmount"
                          @input="formatCurrencyInput('currentAmount', $event)"
                          type="text"
                          class="block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  </div>

                  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label for="targetDate" class="block text-sm font-medium text-gray-700">
                        Target Date *
                      </label>
                      <input
                        id="targetDate"
                        v-model="goalForm.targetDate"
                        type="date"
                        required
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>

                    <div>
                      <label for="priority" class="block text-sm font-medium text-gray-700">
                        Priority
                      </label>
                      <select
                        id="priority"
                        v-model="goalForm.priority"
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      >
                        <option v-for="priority in priorities" :key="priority.value" :value="priority.value">
                          {{ priority.name }}
                        </option>
                      </select>
                    </div>
                  </div>

                  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label for="monthlyContribution" class="block text-sm font-medium text-gray-700">
                        Monthly Contribution (₹)
                      </label>
                      <div class="mt-1 relative rounded-md shadow-sm">
                        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span class="text-gray-500 sm:text-sm">₹</span>
                        </div>
                        <input
                          id="monthlyContribution"
                          v-model="goalForm.monthlyContribution"
                          @input="formatCurrencyInput('monthlyContribution', $event)"
                          type="text"
                          class="block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    <div>
                      <label for="linkedInvestmentType" class="block text-sm font-medium text-gray-700">
                        Linked Investment Type
                      </label>
                      <select
                        id="linkedInvestmentType"
                        v-model="goalForm.linkedInvestmentType"
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      >
                        <option v-for="type in investmentTypes" :key="type.value" :value="type.value">
                          {{ type.name }}
                        </option>
                      </select>
                    </div>
                  </div>

                  <!-- Form Actions -->
                  <div class="flex justify-end space-x-3 pt-6 border-t">
                    <button
                      type="button"
                      @click="closeGoalModal"
                      class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      :disabled="loading"
                      class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span v-if="loading">Saving...</span>
                      <span v-else>{{ editingGoal ? 'Update Goal' : 'Create Goal' }}</span>
                    </button>
                  </div>
                </form>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </TransitionRoot>
  </div>
</template>
