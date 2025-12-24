<script setup>
import { ref, onMounted } from 'vue'
import { useBudgetStore } from '@/stores/budget'
import {
  CogIcon,
  BellIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  DocumentCheckIcon
} from '@heroicons/vue/24/outline'

const budgetStore = useBudgetStore()

// Form state
const loading = ref(false)
const saving = ref(false)
const error = ref(null)
const success = ref(null)

// Options state
const options = ref({
  defaultAlertThreshold80: true,
  defaultAlertThreshold100: true,
  currencyFormat: 'INR',
  budgetNotificationEnabled: true,
  autoCalculateSavings: true,
  showBudgetProgress: true,
  defaultBudgetPeriod: 'monthly'
})

const currencyFormats = [
  { value: 'INR', name: 'Indian Rupee (₹)' },
  { value: 'USD', name: 'US Dollar ($)' },
  { value: 'EUR', name: 'Euro (€)' }
]

const budgetPeriods = [
  { value: 'monthly', name: 'Monthly' },
  { value: 'quarterly', name: 'Quarterly' },
  { value: 'annual', name: 'Annual' }
]

// Methods
const loadOptions = async () => {
  try {
    loading.value = true
    // Load options from store or localStorage
    const savedOptions = localStorage.getItem('budgetOptions')
    if (savedOptions) {
      options.value = { ...options.value, ...JSON.parse(savedOptions) }
    }
  } catch (err) {
    console.error('Error loading options:', err)
  } finally {
    loading.value = false
  }
}

const saveOptions = async () => {
  try {
    saving.value = true
    error.value = null
    success.value = null

    // Save to localStorage
    localStorage.setItem('budgetOptions', JSON.stringify(options.value))

    // Update store if needed
    // await budgetStore.updateBudgetOptions(options.value)

    success.value = 'Budget options saved successfully!'
    setTimeout(() => success.value = null, 3000)
  } catch (err) {
    error.value = err.message || 'Failed to save options'
  } finally {
    saving.value = false
  }
}

const resetToDefaults = () => {
  options.value = {
    defaultAlertThreshold80: true,
    defaultAlertThreshold100: true,
    currencyFormat: 'INR',
    budgetNotificationEnabled: true,
    autoCalculateSavings: true,
    showBudgetProgress: true,
    defaultBudgetPeriod: 'monthly'
  }
}

onMounted(async () => {
  await loadOptions()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Options Summary Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <BellIcon class="h-8 w-8 text-indigo-600" />
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600">Alert Settings</p>
            <p class="text-lg font-bold text-gray-900">
              {{ options.defaultAlertThreshold80 && options.defaultAlertThreshold100 ? 'Both Enabled' :
                 options.defaultAlertThreshold80 ? '80% Only' :
                 options.defaultAlertThreshold100 ? '100% Only' : 'Disabled' }}
            </p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <CurrencyDollarIcon class="h-8 w-8 text-green-600" />
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600">Currency</p>
            <p class="text-lg font-bold text-gray-900">
              {{ currencyFormats.find(c => c.value === options.currencyFormat)?.name }}
            </p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <ChartBarIcon class="h-8 w-8 text-purple-600" />
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600">Default Period</p>
            <p class="text-lg font-bold text-gray-900">
              {{ budgetPeriods.find(p => p.value === options.defaultBudgetPeriod)?.name }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Options Form -->
    <div class="bg-white rounded-lg shadow">
      <div class="px-6 py-4 border-b border-gray-200">
        <h3 class="text-lg font-medium text-gray-900 flex items-center">
          <CogIcon class="h-5 w-5 mr-2" />
          Budget Options
        </h3>
        <p class="mt-1 text-sm text-gray-600">Configure your budget preferences and default settings.</p>
      </div>

      <div class="p-6">
        <!-- Success/Error Messages -->
        <div v-if="error" class="mb-4 rounded-md bg-red-50 p-4">
          <div class="text-sm text-red-700">{{ error }}</div>
        </div>

        <div v-if="success" class="mb-4 rounded-md bg-green-50 p-4">
          <div class="text-sm text-green-700">{{ success }}</div>
        </div>

        <form @submit.prevent="saveOptions" class="space-y-6">
          <!-- Alert Settings -->
          <div>
            <h4 class="text-sm font-medium text-gray-900 mb-3">Budget Alert Settings</h4>
            <div class="space-y-3">
              <div class="flex items-center">
                <input
                  id="alert80"
                  v-model="options.defaultAlertThreshold80"
                  type="checkbox"
                  class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label for="alert80" class="ml-2 block text-sm text-gray-700">
                  Enable 80% budget utilization alerts by default
                </label>
              </div>

              <div class="flex items-center">
                <input
                  id="alert100"
                  v-model="options.defaultAlertThreshold100"
                  type="checkbox"
                  class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label for="alert100" class="ml-2 block text-sm text-gray-700">
                  Enable budget exceeded alerts by default
                </label>
              </div>
            </div>
          </div>

          <!-- Currency Settings -->
          <div>
            <label for="currency" class="block text-sm font-medium text-gray-700">
              Default Currency Format
            </label>
            <select
              id="currency"
              v-model="options.currencyFormat"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option v-for="format in currencyFormats" :key="format.value" :value="format.value">
                {{ format.name }}
              </option>
            </select>
          </div>

          <!-- Budget Period -->
          <div>
            <label for="period" class="block text-sm font-medium text-gray-700">
              Default Budget Period
            </label>
            <select
              id="period"
              v-model="options.defaultBudgetPeriod"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option v-for="period in budgetPeriods" :key="period.value" :value="period.value">
                {{ period.name }}
              </option>
            </select>
          </div>

          <!-- Feature Toggles -->
          <div>
            <h4 class="text-sm font-medium text-gray-900 mb-3">Feature Settings</h4>
            <div class="space-y-3">
              <div class="flex items-center">
                <input
                  id="notifications"
                  v-model="options.budgetNotificationEnabled"
                  type="checkbox"
                  class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label for="notifications" class="ml-2 block text-sm text-gray-700">
                  Enable budget notifications
                </label>
              </div>

              <div class="flex items-center">
                <input
                  id="autoSavings"
                  v-model="options.autoCalculateSavings"
                  type="checkbox"
                  class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label for="autoSavings" class="ml-2 block text-sm text-gray-700">
                  Auto-calculate savings recommendations
                </label>
              </div>

              <div class="flex items-center">
                <input
                  id="progress"
                  v-model="options.showBudgetProgress"
                  type="checkbox"
                  class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label for="progress" class="ml-2 block text-sm text-gray-700">
                  Show budget progress charts
                </label>
              </div>
            </div>
          </div>

          <!-- Form Actions -->
          <div class="flex justify-between pt-6 border-t">
            <button
              type="button"
              @click="resetToDefaults"
              class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Reset to Defaults
            </button>

            <div class="flex space-x-3">
              <button
                type="submit"
                :disabled="saving"
                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <SaveIcon class="h-4 w-4 mr-2" />
                <span v-if="saving">Saving...</span>
                <span v-else>Save Options</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>