<script setup>
import { ref, computed } from 'vue'
import { useFinanceStore } from '@/stores/finance'

const financeStore = useFinanceStore()

const annualIncome = ref(0)
const selectedRegime = ref('new') // 'old' or 'new'
const gstAmount = ref(0)
const gstRate = ref(18) // Default GST rate

const taxCalculation = computed(() => {
  return financeStore.calculateIncomeTax(annualIncome.value, selectedRegime.value)
})

const formatCurrency = (amount) => {
  return financeStore.formatIndianCurrency(amount)
}

const formatNumber = (number) => {
  return financeStore.formatIndianNumber(number)
}
</script>

<template>
  <div class="fintrack-card card-padding">
    <h2 class="fintrack-header-title mb-6">Indian Income Tax Calculator</h2>
    
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Input Section -->
      <div class="space-y-4">
        <div>
          <label for="annualIncome" class="fintrack-label">
            Annual Income (₹)
          </label>
          <input
            id="annualIncome"
            v-model.number="annualIncome"
            type="number"
            step="1000"
            min="0"
            class="fintrack-input"
            placeholder="Enter your annual income"
          />
        </div>
        
        <div>
          <label class="fintrack-label">
            Tax Regime
          </label>
          <div class="space-y-2">
            <label class="inline-flex items-center">
              <input
                v-model="selectedRegime"
                type="radio"
                value="new"
                class="form-radio text-indigo-600"
              />
              <span class="ml-2 text-sm text-gray-700">New Regime (Default)</span>
            </label>
            <label class="inline-flex items-center">
              <input
                v-model="selectedRegime"
                type="radio"
                value="old"
                class="form-radio text-indigo-600"
              />
              <span class="ml-2 text-sm text-gray-700">Old Regime (with deductions)</span>
            </label>
          </div>
        </div>
      </div>
      
      <!-- Results Section -->
      <div class="fintrack-card card-padding bg-gray-50">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Tax Calculation</h3>
        
        <div v-if="annualIncome > 0" class="space-y-3">
          <div class="flex justify-between items-center">
            <span class="text-sm text-gray-600">Total Tax:</span>
            <span class="text-lg font-semibold text-red-600">
              {{ formatCurrency(taxCalculation.totalTax) }}
            </span>
          </div>
          
          <div class="flex justify-between items-center">
            <span class="text-sm text-gray-600">Tax Rate:</span>
            <span class="text-sm font-medium text-gray-900">
              {{ taxCalculation.effectiveRate.toFixed(2) }}%
            </span>
          </div>
          
          <div class="flex justify-between items-center">
            <span class="text-sm text-gray-600">Net Income:</span>
            <span class="text-lg font-semibold text-green-600">
              {{ formatCurrency(taxCalculation.netIncome) }}
            </span>
          </div>
        </div>
        
        <div v-else class="text-sm text-gray-500 text-center py-4">
          Enter your annual income to see tax calculation
        </div>
      </div>
    </div>
    
    <!-- Tax Slabs Information -->
    <div class="mt-6 sm:mt-8">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">Tax Slabs for {{ selectedRegime === 'new' ? 'New' : 'Old' }} Regime</h3>
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Income Range (₹)
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tax Rate
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="(slab, index) in financeStore.taxSlabs[selectedRegime]" :key="index">
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ formatNumber(slab.min) }} - {{ slab.max === Infinity ? 'Above' : formatNumber(slab.max) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ slab.rate }}%
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    
    <!-- GST Calculator -->
    <div class="mt-6 sm:mt-8">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">GST Calculator</h3>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label for="gstAmount" class="fintrack-label">
            Amount (₹)
          </label>
          <input
            id="gstAmount"
            v-model.number="gstAmount"
            type="number"
            step="0.01"
            min="0"
            class="fintrack-input"
            placeholder="Enter amount"
          />
        </div>
        <div>
          <label for="gstRate" class="fintrack-label">
            GST Rate (%)
          </label>
          <select
            id="gstRate"
            v-model.number="gstRate"
            class="fintrack-input"
          >
            <option value="5">5%</option>
            <option value="12">12%</option>
            <option value="18">18%</option>
            <option value="28">28%</option>
          </select>
        </div>
        <div class="flex items-end">
          <div class="bg-gray-50 p-3 rounded w-full">
            <div class="text-sm text-gray-600">Total with GST:</div>
            <div class="text-lg font-semibold text-gray-900">
              {{ formatCurrency(gstAmount + (gstAmount * gstRate / 100)) }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>