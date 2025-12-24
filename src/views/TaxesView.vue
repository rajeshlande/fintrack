<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useFinanceStore } from '@/stores/finance'
import { ArrowLeftIcon } from '@heroicons/vue/24/outline'
import TaxCalculator from '@/components/TaxCalculator.vue'

const router = useRouter()
const financeStore = useFinanceStore()

// Tax settings
const showCalculator = ref(true)
const showGstCalculator = ref(false)

const goToDashboard = () => {
  router.push('/dashboard')
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Page Header -->
      <div class="mb-8">
        <div class="flex items-center justify-between">
          <button
            @click="goToDashboard"
            class="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition-colors mr-4"
          >
            <ArrowLeftIcon class="h-4 w-4 mr-2" />
            <span class="hidden sm:inline">Back to Dashboard</span>
          </button>
          <div>
            <h1 class="text-3xl font-bold text-gray-900 mb-2">Taxes & GST</h1>
            <p class="text-gray-600">Calculate Indian income tax and GST amounts</p>
          </div>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div class="mb-8">
        <div class="border-b border-gray-200">
          <nav class="-mb-px flex space-x-8">
            <button
              @click="showCalculator = true; showGstCalculator = false"
              :class="[
                'py-4 px-1 border-b-2 font-medium text-sm transition-colors',
                showCalculator
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              ]"
            >
              Income Tax Calculator
            </button>
            <button
              @click="showCalculator = false; showGstCalculator = true"
              :class="[
                'py-4 px-1 border-b-2 font-medium text-sm transition-colors',
                showGstCalculator
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              ]"
            >
              GST Calculator
            </button>
          </nav>
        </div>
      </div>

      <!-- Content Area -->
      <div class="bg-white rounded-lg shadow p-6">
        <!-- Income Tax Calculator -->
        <div v-if="showCalculator">
          <TaxCalculator />
        </div>

        <!-- GST Calculator (Placeholder) -->
        <div v-if="showGstCalculator" class="space-y-6">
          <h2 class="text-2xl font-semibold text-gray-900 mb-4">GST Calculator</h2>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- GST Calculation Form -->
            <div class="space-y-4">
              <div>
                <label for="amount" class="block text-sm font-medium text-gray-700">
                  Amount (₹)
                </label>
                <input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="Enter amount"
                />
              </div>
              
              <div>
                <label for="gstRate" class="block text-sm font-medium text-gray-700">
                  GST Rate (%)
                </label>
                <select
                  id="gstRate"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="5">5%</option>
                  <option value="12">12%</option>
                  <option value="18">18%</option>
                  <option value="28">28%</option>
                </select>
              </div>

              <button
                type="button"
                class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Calculate GST
              </button>
            </div>

            <!-- GST Results -->
            <div class="bg-gray-50 rounded-lg p-6">
              <h3 class="text-lg font-medium text-gray-900 mb-4">GST Calculation Results</h3>
              <div class="space-y-3">
                <div class="flex justify-between">
                  <span class="text-gray-600">Original Amount:</span>
                  <span class="font-medium">₹0.00</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">GST Amount:</span>
                  <span class="font-medium text-red-600">₹0.00</span>
                </div>
                <div class="flex justify-between pt-3 border-t">
                  <span class="text-gray-900 font-medium">Total Amount:</span>
                  <span class="font-bold text-lg">₹0.00</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
