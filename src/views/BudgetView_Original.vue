<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useBudgetStore } from '@/stores/budget'
import { useFinanceStore } from '@/stores/finance'
import { 
  ArrowLeftIcon,
  PlusIcon,
  ChartBarIcon,
  WalletIcon,
  TrendingUpIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  FunnelIcon,
  CalendarIcon,
  BanknotesIcon,
  PiggyBankIcon,
  TargetIcon
} from '@heroicons/vue/24/outline'
import { 
  Dialog, 
  DialogPanel, 
  DialogTitle, 
  DialogDescription,
  TransitionRoot,
  TransitionChild
} from '@headlessui/vue'

import BudgetSummary from '@/components/budget/BudgetSummary.vue'
import MonthlyBudgetForm from '@/components/budget/MonthlyBudgetForm.vue'
import AnnualBudgetForm from '@/components/budget/AnnualBudgetForm.vue'
import BudgetProgressChart from '@/components/budget/BudgetProgressChart.vue'
import CategorySpendingChart from '@/components/budget/CategorySpendingChart.vue'
import SavingsRecommendations from '@/components/budget/SavingsRecommendations.vue'
import FinancialGoals from '@/components/budget/FinancialGoals.vue'

const router = useRouter()
const authStore = useAuthStore()
const budgetStore = useBudgetStore()
const financeStore = useFinanceStore()

// State
const loading = ref(true)
const activeTab = ref('overview')
const selectedFinancialYear = ref(budgetStore.getCurrentFinancialYear())
const showMonthlyBudgetModal = ref(false)
const showAnnualBudgetModal = ref(false)
const selectedMonth = ref(new Date().getMonth() + 1)

// Computed
const financialYears = computed(() => {
  const currentYear = new Date().getFullYear()
  return Array.from({ length: 5 }, (_, i) => currentYear - 2 + i)
})

const currentMonthName = computed(() => {
  const months = ['January', 'February', 'March', 'April', 'May', 'June',
                  'July', 'August', 'September', 'October', 'November', 'December']
  return months[selectedMonth.value - 1]
})

const budgetAlerts = computed(() => {
  return budgetStore.budgetUtilization.filter(performance => 
    performance.status === 'over_budget' || performance.status === 'warning'
  )
})

const savingsRate = computed(() => {
  const totalIncome = financeStore.totalIncome
  const totalExpenses = financeStore.totalExpenses
  return totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome * 100).toFixed(1) : 0
})

// Methods
const handleFinancialYearChange = async (year) => {
  selectedFinancialYear.value = year
  await loadBudgetData()
}

const handleMonthChange = async (month) => {
  selectedMonth.value = month
  await loadBudgetData()
}

const loadBudgetData = async () => {
  try {
    loading.value = true
    await Promise.all([
      budgetStore.fetchMonthlyBudgets(selectedFinancialYear.value),
      budgetStore.fetchAnnualBudgets(selectedFinancialYear.value),
      budgetStore.fetchFinancialGoals(),
      budgetStore.fetchInvestments(),
      budgetStore.fetchBudgetPerformance(selectedFinancialYear.value, selectedMonth.value)
    ])
  } catch (error) {
    console.error('Error loading budget data:', error)
  } finally {
    loading.value = false
  }
}

const generateSavingsRecommendations = async () => {
  try {
    await budgetStore.generateSavingsRecommendations(
      financeStore.totalIncome,
      financeStore.totalExpenses,
      'moderate' // Could be user preference
    )
  } catch (error) {
    console.error('Error generating recommendations:', error)
  }
}

onMounted(async () => {
  if (!authStore.isAuthenticated) {
    router.push('/login')
    return
  }
  
  await loadBudgetData()
})
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <div class="bg-white shadow-sm border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <div class="flex items-center">
            <button
              @click="router.push('/dashboard')"
              class="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 mr-4"
            >
              <ArrowLeftIcon class="h-4 w-4 mr-2" />
              Back
            </button>
            <h1 class="text-xl font-semibold text-gray-900">Budget Management</h1>
          </div>
          
          <div class="flex items-center space-x-4">
            <!-- Financial Year Selector -->
            <div class="flex items-center space-x-2">
              <CalendarIcon class="h-5 w-5 text-gray-400" />
              <select
                v-model="selectedFinancialYear"
                @change="handleFinancialYearChange($event.target.value)"
                class="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option v-for="year in financialYears" :key="year" :value="year">
                  FY {{ year }}-{{ year + 1 }}
                </option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Summary Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <WalletIcon class="h-8 w-8 text-indigo-600" />
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">Monthly Budget</p>
              <p class="text-2xl font-bold text-gray-900">
                {{ financeStore.formatIndianCurrency(budgetStore.totalMonthlyBudget) }}
              </p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <BanknotesIcon class="h-8 w-8 text-green-600" />
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">Annual Budget</p>
              <p class="text-2xl font-bold text-gray-900">
                {{ financeStore.formatIndianCurrency(budgetStore.totalAnnualBudget) }}
              </p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <PiggyBankIcon class="h-8 w-8 text-purple-600" />
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">Savings Rate</p>
              <p class="text-2xl font-bold text-gray-900">{{ savingsRate }}%</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <TargetIcon class="h-8 w-8 text-orange-600" />
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">Goals Progress</p>
              <p class="text-2xl font-bold text-gray-900">
                {{ budgetStore.goalsProgress.length }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Budget Alerts -->
      <div v-if="budgetAlerts.length > 0" class="mb-8">
        <div class="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div class="flex">
            <div class="flex-shrink-0">
              <ExclamationTriangleIcon class="h-5 w-5 text-yellow-400" />
            </div>
            <div class="ml-3">
              <h3 class="text-sm font-medium text-yellow-800">Budget Alerts</h3>
              <div class="mt-2 text-sm text-yellow-700">
                <p>You have {{ budgetAlerts.length }} categor{{ budgetAlerts.length === 1 ? 'y' : 'ies' }} over or near budget limit.</p>
                <ul class="mt-1 list-disc list-inside">
                  <li v-for="alert in budgetAlerts.slice(0, 3)" :key="alert.id">
                    {{ alert.categories?.name }}: {{ financeStore.formatIndianCurrency(alert.actual_amount) }} 
                    ({{ alert.utilization_percentage.toFixed(1) }}% used)
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div class="border-b border-gray-200 mb-8">
        <nav class="-mb-px flex space-x-8">
          <button
            v-for="tab in [
              { key: 'overview', name: 'Overview', icon: ChartBarIcon },
              { key: 'monthly', name: 'Monthly Budget', icon: CalendarIcon },
              { key: 'annual', name: 'Annual Budget', icon: TrendingUpIcon },
              { key: 'goals', name: 'Goals', icon: TargetIcon },
              { key: 'savings', name: 'Savings', icon: PiggyBankIcon }
            ]"
            :key="tab.key"
            @click="activeTab = tab.key"
            :class="[
              activeTab === tab.key
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
              'whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center'
            ]"
          >
            <component :is="tab.icon" class="h-5 w-5 mr-2" />
            {{ tab.name }}
          </button>
        </nav>
      </div>

      <!-- Tab Content -->
      <div class="space-y-8">
        <!-- Overview Tab -->
        <div v-if="activeTab === 'overview'">
          <BudgetSummary />
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
            <BudgetProgressChart />
            <CategorySpendingChart />
          </div>
        </div>

        <!-- Monthly Budget Tab -->
        <div v-if="activeTab === 'monthly'">
          <div class="flex justify-between items-center mb-6">
            <div class="flex items-center space-x-4">
              <select
                v-model="selectedMonth"
                @change="handleMonthChange($event.target.value)"
                class="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option v-for="(month, index) in ['January', 'February', 'March', 'April', 'May', 'June',
                                                'July', 'August', 'September', 'October', 'November', 'December']" 
                        :key="index + 1" :value="index + 1">
                  {{ month }}
                </option>
              </select>
            </div>
            <button
              @click="showMonthlyBudgetModal = true"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <PlusIcon class="h-4 w-4 mr-2" />
              Add Monthly Budget
            </button>
          </div>

          <!-- Monthly Budget List -->
          <div class="bg-white shadow rounded-lg">
            <div class="px-4 py-5 sm:p-6">
              <div v-if="budgetStore.monthlyBudgets.length === 0" class="text-center py-12">
                <PiggyBankIcon class="mx-auto h-12 w-12 text-gray-400" />
                <h3 class="mt-2 text-sm font-medium text-gray-900">No monthly budgets</h3>
                <p class="mt-1 text-sm text-gray-500">Get started by creating your first monthly budget.</p>
                <div class="mt-6">
                  <button
                    @click="showMonthlyBudgetModal = true"
                    class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <PlusIcon class="h-4 w-4 mr-2" />
                    Create Budget
                  </button>
                </div>
              </div>
              <div v-else class="space-y-4">
                <div v-for="budget in budgetStore.monthlyBudgets.filter(b => b.month === selectedMonth)" 
                     :key="budget.id" 
                     class="border border-gray-200 rounded-lg p-4">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center">
                      <span class="text-2xl mr-3">{{ budget.categories?.icon }}</span>
                      <div>
                        <h4 class="text-lg font-medium text-gray-900">{{ budget.categories?.name }}</h4>
                        <p class="text-sm text-gray-500">
                          Budget: {{ financeStore.formatIndianCurrency(budget.budget_amount) }}
                        </p>
                      </div>
                    </div>
                    <div class="text-right">
                      <p class="text-lg font-medium text-gray-900">
                        {{ financeStore.formatIndianCurrency(budget.budget_amount) }}
                      </p>
                      <div class="flex items-center justify-end mt-1">
                        <CheckCircleIcon v-if="budget.alert_threshold_80" class="h-4 w-4 text-green-500 mr-1" />
                        <ExclamationTriangleIcon v-if="budget.alert_threshold_100" class="h-4 w-4 text-yellow-500" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Annual Budget Tab -->
        <div v-if="activeTab === 'annual'">
          <div class="flex justify-end mb-6">
            <button
              @click="showAnnualBudgetModal = true"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <PlusIcon class="h-4 w-4 mr-2" />
              Add Annual Budget
            </button>
          </div>

          <!-- Annual Budget List -->
          <div class="bg-white shadow rounded-lg">
            <div class="px-4 py-5 sm:p-6">
              <div v-if="budgetStore.annualBudgets.length === 0" class="text-center py-12">
                <TrendingUpIcon class="mx-auto h-12 w-12 text-gray-400" />
                <h3 class="mt-2 text-sm font-medium text-gray-900">No annual budgets</h3>
                <p class="mt-1 text-sm text-gray-500">Set your annual financial goals and track progress throughout the year.</p>
                <div class="mt-6">
                  <button
                    @click="showAnnualBudgetModal = true"
                    class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <PlusIcon class="h-4 w-4 mr-2" />
                    Create Annual Budget
                  </button>
                </div>
              </div>
              <div v-else class="space-y-4">
                <div v-for="budget in budgetStore.annualBudgets" :key="budget.id" 
                     class="border border-gray-200 rounded-lg p-4">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center">
                      <span class="text-2xl mr-3">{{ budget.categories?.icon }}</span>
                      <div>
                        <h4 class="text-lg font-medium text-gray-900">{{ budget.categories?.name }}</h4>
                        <p class="text-sm text-gray-500">Annual budget for FY {{ budget.financial_year }}-{{ budget.financial_year + 1 }}</p>
                      </div>
                    </div>
                    <div class="text-right">
                      <p class="text-lg font-medium text-gray-900">
                        {{ financeStore.formatIndianCurrency(budget.annual_amount) }}
                      </p>
                      <p class="text-sm text-gray-500">
                        {{ financeStore.formatIndianCurrency(budget.annual_amount / 12) }}/month
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Goals Tab -->
        <div v-if="activeTab === 'goals'">
          <FinancialGoals />
        </div>

        <!-- Savings Tab -->
        <div v-if="activeTab === 'savings'">
          <SavingsRecommendations @generate-recommendations="generateSavingsRecommendations" />
        </div>
      </div>
    </div>

    <!-- Monthly Budget Modal -->
    <TransitionRoot appear :show="showMonthlyBudgetModal" as="template">
      <Dialog as="div" @close="showMonthlyBudgetModal = false" class="relative z-10">
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
              <DialogPanel class="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <DialogTitle as="h3" class="text-lg font-medium leading-6 text-gray-900 mb-4">
                  Create Monthly Budget
                </DialogTitle>
                <MonthlyBudgetForm 
                  @close="showMonthlyBudgetModal = false"
                  @created="loadBudgetData"
                />
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </TransitionRoot>

    <!-- Annual Budget Modal -->
    <TransitionRoot appear :show="showAnnualBudgetModal" as="template">
      <Dialog as="div" @close="showAnnualBudgetModal = false" class="relative z-10">
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
              <DialogPanel class="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <DialogTitle as="h3" class="text-lg font-medium leading-6 text-gray-900 mb-4">
                  Create Annual Budget
                </DialogTitle>
                <AnnualBudgetForm 
                  @close="showAnnualBudgetModal = false"
                  @created="loadBudgetData"
                />
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </TransitionRoot>
  </div>
</template>