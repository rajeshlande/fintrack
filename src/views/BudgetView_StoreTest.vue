<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useBudgetStore } from '@/stores/budget'
import { useFinanceStore } from '@/stores/finance'
import { ArrowLeftIcon } from '@heroicons/vue/24/outline'

const router = useRouter()
const authStore = useAuthStore()
const budgetStore = useBudgetStore()
const financeStore = useFinanceStore()
const loading = ref(true)
const error = ref(null)

onMounted(async () => {
  if (!authStore.isAuthenticated) {
    router.push('/login')
    return
  }
  
  try {
    // Test budget store initialization
    console.log('Testing budget store...')
    console.log('Budget store:', budgetStore)
    console.log('Finance store:', financeStore)
    
    // Test computed properties
    console.log('Total Monthly Budget:', budgetStore.totalMonthlyBudget)
    console.log('Total Annual Budget:', budgetStore.totalAnnualBudget)
    console.log('Goals Progress:', budgetStore.goalsProgress)
    console.log('Budget Utilization:', budgetStore.budgetUtilization)
    
  } catch (err) {
    error.value = err.message
    console.error('Error testing budget store:', err)
  } finally {
    loading.value = false
  }
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
            <h1 class="text-xl font-semibold text-gray-900">Budget Store Test</h1>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div v-if="loading" class="text-center py-12">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <p class="mt-2 text-gray-500">Testing budget store...</p>
      </div>
      
      <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-md p-4">
        <h3 class="text-lg font-medium text-red-800">Error</h3>
        <p class="text-red-700">{{ error }}</p>
      </div>
      
      <div v-else class="space-y-6">
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-xl font-bold text-gray-900 mb-4">Budget Store Test Results</h2>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="bg-gray-50 rounded-lg p-4">
              <h3 class="font-semibold text-gray-900 mb-2">Budget Store Properties</h3>
              <ul class="space-y-1 text-sm">
                <li>Total Monthly Budget: {{ budgetStore.totalMonthlyBudget }}</li>
                <li>Total Annual Budget: {{ budgetStore.totalAnnualBudget }}</li>
                <li>Goals Progress: {{ budgetStore.goalsProgress.length }}</li>
                <li>Budget Utilization: {{ budgetStore.budgetUtilization.length }}</li>
              </ul>
            </div>
            
            <div class="bg-gray-50 rounded-lg p-4">
              <h3 class="font-semibold text-gray-900 mb-2">Finance Store Properties</h3>
              <ul class="space-y-1 text-sm">
                <li>Total Income: {{ financeStore.totalIncome }}</li>
                <li>Total Expenses: {{ financeStore.totalExpenses }}</li>
              </ul>
            </div>
          </div>
        </div>
        
        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Store Status</h3>
          <div class="flex items-center space-x-2">
            <div class="w-3 h-3 bg-green-500 rounded-full"></div>
            <span class="text-green-700">Budget store initialized successfully</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
