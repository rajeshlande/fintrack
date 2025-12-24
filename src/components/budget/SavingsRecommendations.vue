<script setup>
import { ref, computed, onMounted } from 'vue'
import { useBudgetStore } from '@/stores/budget'
import { useFinanceStore } from '@/stores/finance'
import { useAuthStore } from '@/stores/auth'
import { 
  LightBulbIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  ArrowTrendingUpIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon
} from '@heroicons/vue/24/outline'

const emit = defineEmits(['generate-recommendations'])

const budgetStore = useBudgetStore()
const financeStore = useFinanceStore()
const authStore = useAuthStore()

const loading = ref(false)
const selectedRiskProfile = ref('moderate')
const customMonthlyIncome = ref('')
const customMonthlyExpenses = ref('')
const showCustomInputs = ref(false)

const riskProfiles = [
  {
    value: 'conservative',
    name: 'Conservative',
    description: 'Focus on capital preservation with stable returns',
    icon: ShieldCheckIcon,
    color: 'green',
    expectedReturns: '6-8%',
    riskLevel: 'Low'
  },
  {
    value: 'moderate',
    name: 'Moderate',
    description: 'Balanced approach mixing safety and growth',
    icon: ChartBarIcon,
    color: 'blue',
    expectedReturns: '8-12%',
    riskLevel: 'Medium'
  },
  {
    value: 'aggressive',
    name: 'Aggressive',
    description: 'Growth-focused with higher risk and returns',
    icon: ArrowTrendingUpIcon,
    color: 'purple',
    expectedReturns: '12-18%',
    riskLevel: 'High'
  }
]

const currentRecommendations = computed(() => {
  return budgetStore.savingsRecommendations[0] || null
})

const monthlyIncome = computed(() => {
  if (showCustomInputs.value && customMonthlyIncome.value) {
    return parseFloat(customMonthlyIncome.value) || 0
  }
  return financeStore.totalIncome
})

const monthlyExpenses = computed(() => {
  if (showCustomInputs.value && customMonthlyExpenses.value) {
    return parseFloat(customMonthlyExpenses.value) || 0
  }
  return financeStore.totalExpenses
})

const monthlySurplus = computed(() => {
  return monthlyIncome.value - monthlyExpenses.value
})

const currentSavingsRate = computed(() => {
  return monthlyIncome.value > 0 ? (monthlySurplus.value / monthlyIncome.value * 100).toFixed(1) : 0
})

const investmentDescriptions = {
  emergency_fund: 'Emergency fund for unexpected expenses (3-6 months of expenses)',
  fd: 'Fixed Deposit - Safe investment with guaranteed returns',
  rd: 'Recurring Deposit - Monthly savings with fixed returns',
  debt_mf: 'Debt Mutual Funds - Lower risk, stable returns',
  equity_mf: 'Equity Mutual Funds - Higher risk, higher potential returns',
  stock: 'Direct Stocks - High risk, high return potential'
}

const getInvestmentIcon = (type) => {
  const icons = {
    emergency_fund: '🛡️',
    fd: '🏦',
    rd: '💰',
    debt_mf: '📊',
    equity_mf: '📈',
    stock: '💹'
  }
  return icons[type] || '💼'
}

const generateRecommendations = async () => {
  if (monthlySurplus.value <= 0) {
    return
  }

  try {
    loading.value = true
    await budgetStore.generateSavingsRecommendations(
      monthlyIncome.value,
      monthlyExpenses.value,
      selectedRiskProfile.value
    )
    emit('generate-recommendations')
  } catch (error) {
    console.error('Error generating recommendations:', error)
  } finally {
    loading.value = false
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
  
  if (field === 'income') {
    customMonthlyIncome.value = value
  } else {
    customMonthlyExpenses.value = value
  }
}

onMounted(() => {
  // Data is loaded by parent component
})
</script>

<template>
  <div class="space-y-6">
    <!-- Financial Summary Card -->
    <div class="bg-white rounded-lg shadow p-6">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">Financial Overview</h3>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div class="text-center">
          <p class="text-sm font-medium text-gray-600 mb-2">Monthly Income</p>
          <div class="relative">
            <input
              v-if="showCustomInputs"
              v-model="customMonthlyIncome"
              @input="formatCurrencyInput('income', $event)"
              type="text"
              class="text-xl font-bold text-gray-900 bg-transparent border-b-2 border-indigo-500 text-center focus:outline-none"
              placeholder="0.00"
            />
            <p v-else class="text-xl font-bold text-gray-900">
              {{ financeStore.formatIndianCurrency(monthlyIncome) }}
            </p>
          </div>
        </div>
        
        <div class="text-center">
          <p class="text-sm font-medium text-gray-600 mb-2">Monthly Expenses</p>
          <div class="relative">
            <input
              v-if="showCustomInputs"
              v-model="customMonthlyExpenses"
              @input="formatCurrencyInput('expenses', $event)"
              type="text"
              class="text-xl font-bold text-gray-900 bg-transparent border-b-2 border-indigo-500 text-center focus:outline-none"
              placeholder="0.00"
            />
            <p v-else class="text-xl font-bold text-gray-900">
              {{ financeStore.formatIndianCurrency(monthlyExpenses) }}
            </p>
          </div>
        </div>
        
        <div class="text-center">
          <p class="text-sm font-medium text-gray-600 mb-2">Monthly Surplus</p>
          <p class="text-xl font-bold" :class="monthlySurplus >= 0 ? 'text-green-600' : 'text-red-600'">
            {{ financeStore.formatIndianCurrency(monthlySurplus) }}
          </p>
          <p class="text-sm text-gray-500 mt-1">
            {{ currentSavingsRate }}% savings rate
          </p>
        </div>
      </div>

      <div class="flex justify-center">
        <button
          @click="showCustomInputs = !showCustomInputs"
          class="text-sm text-indigo-600 hover:text-indigo-500"
        >
          {{ showCustomInputs ? 'Use actual data' : 'Use custom amounts' }}
        </button>
      </div>
    </div>

    <!-- Risk Profile Selection -->
    <div class="bg-white rounded-lg shadow p-6">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">Select Your Risk Profile</h3>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div v-for="profile in riskProfiles" :key="profile.value" 
             class="relative">
          <input
            :id="`profile-${profile.value}`"
            v-model="selectedRiskProfile"
            :value="profile.value"
            type="radio"
            name="riskProfile"
            class="sr-only"
          />
          <label
            :for="`profile-${profile.value}`"
            :class="[
              'relative rounded-lg border p-4 cursor-pointer hover:bg-gray-50 focus:outline-none',
              selectedRiskProfile === profile.value 
                ? `border-${profile.color}-500 bg-${profile.color}-50` 
                : 'border-gray-300'
            ]"
          >
            <div class="flex items-center mb-2">
              <component :is="profile.icon" 
                         :class="`h-6 w-6 text-${profile.color}-600 mr-2`" />
              <span class="font-medium text-gray-900">{{ profile.name }}</span>
            </div>
            <p class="text-sm text-gray-600 mb-2">{{ profile.description }}</p>
            <div class="flex justify-between text-xs">
              <span class="text-gray-500">Expected Returns:</span>
              <span class="font-medium">{{ profile.expectedReturns }}</span>
            </div>
            <div class="flex justify-between text-xs">
              <span class="text-gray-500">Risk Level:</span>
              <span class="font-medium">{{ profile.riskLevel }}</span>
            </div>
          </label>
        </div>
      </div>
    </div>

    <!-- Generate Recommendations Button -->
    <div class="text-center">
      <button
        @click="generateRecommendations"
        :disabled="monthlySurplus <= 0 || loading"
        class="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <LightBulbIcon class="h-5 w-5 mr-2" />
        <span v-if="loading">Generating Recommendations...</span>
        <span v-else>Generate Savings Recommendations</span>
      </button>
      
      <div v-if="monthlySurplus <= 0" class="mt-4 text-sm text-red-600">
        <ExclamationTriangleIcon class="h-4 w-4 inline mr-1" />
        You need a positive monthly surplus to generate investment recommendations.
      </div>
    </div>

    <!-- Recommendations Display -->
    <div v-if="currentRecommendations" class="bg-white rounded-lg shadow p-6">
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-lg font-semibold text-gray-900">Your Investment Recommendations</h3>
        <span class="text-sm text-gray-500">
          Generated on {{ new Date(currentRecommendations.recommendation_date).toLocaleDateString() }}
        </span>
      </div>

      <!-- Risk Profile Summary -->
      <div class="mb-6 p-4 bg-blue-50 rounded-lg">
        <div class="flex items-center mb-2">
          <InformationCircleIcon class="h-5 w-5 text-blue-600 mr-2" />
          <span class="font-medium text-blue-900">Based on your {{ currentRecommendations.risk_profile }} risk profile:</span>
        </div>
        <p class="text-sm text-blue-800">{{ currentRecommendations.explanation }}</p>
      </div>

      <!-- Investment Allocation -->
      <div class="space-y-4">
        <h4 class="font-medium text-gray-900">Recommended Monthly Allocation</h4>
        
        <div v-for="(recommendation, index) in currentRecommendations.recommendations" 
             :key="index" 
             class="border border-gray-200 rounded-lg p-4">
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center">
              <span class="text-2xl mr-3">{{ getInvestmentIcon(recommendation.type) }}</span>
              <div>
                <h5 class="font-medium text-gray-900 capitalize">
                  {{ recommendation.type.replace('_', ' ') }}
                </h5>
                <p class="text-sm text-gray-600">{{ investmentDescriptions[recommendation.type] }}</p>
              </div>
            </div>
            <div class="text-right">
              <p class="text-lg font-bold text-gray-900">
                {{ financeStore.formatIndianCurrency(recommendation.amount) }}
              </p>
              <p class="text-sm text-gray-500">{{ recommendation.percentage }}% of surplus</p>
            </div>
          </div>
          
          <!-- Progress Bar -->
          <div class="relative">
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div 
                class="h-2 rounded-full bg-indigo-600 transition-all duration-300"
                :style="{ width: `${recommendation.percentage}%` }"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Summary -->
      <div class="mt-6 p-4 bg-gray-50 rounded-lg">
        <div class="flex items-center justify-between">
          <span class="font-medium text-gray-900">Total Monthly Investment:</span>
          <span class="text-lg font-bold text-gray-900">
            {{ financeStore.formatIndianCurrency(monthlySurplus) }}
          </span>
        </div>
        <div class="flex items-center justify-between mt-2">
          <span class="font-medium text-gray-900">Expected Annual Investment:</span>
          <span class="text-lg font-bold text-green-600">
            {{ financeStore.formatIndianCurrency(monthlySurplus * 12) }}
          </span>
        </div>
      </div>

      <!-- Disclaimer -->
      <div class="mt-6 p-4 bg-yellow-50 rounded-lg">
        <div class="flex">
          <ExclamationTriangleIcon class="h-5 w-5 text-yellow-400 mr-2 flex-shrink-0" />
          <div class="text-sm text-yellow-800">
            <p class="font-medium mb-1">Important Disclaimer:</p>
            <p>These recommendations are for informational purposes only and should not be considered financial advice. 
            Please consult with a qualified financial advisor before making investment decisions. 
            Past performance does not guarantee future results.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- No Recommendations State -->
    <div v-else-if="!loading" class="bg-white rounded-lg shadow p-12 text-center">
      <LightBulbIcon class="mx-auto h-12 w-12 text-gray-400" />
      <h3 class="mt-2 text-sm font-medium text-gray-900">No Recommendations Yet</h3>
      <p class="mt-1 text-sm text-gray-500">
        Generate personalized savings and investment recommendations based on your financial profile.
      </p>
    </div>
  </div>
</template>
