<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useFinanceStore } from '@/stores/finance'
import { useAuthStore } from '@/stores/auth'
import AddTransaction from '@/components/AddTransaction.vue'
import { ArrowLeftIcon } from '@heroicons/vue/24/outline'

const router = useRouter()
const financeStore = useFinanceStore()
const authStore = useAuthStore()

const isSubmitting = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const handleTransactionSubmit = async (transactionData) => {
  try {
    isSubmitting.value = true
    
    // Add transaction to your data store
    await financeStore.addTransaction(transactionData)
    
    // Stay on same page - child component shows success message
    // No redirect - user can add more transactions
    
  } catch (error) {
    console.error('Failed to add transaction:', error)
    
    // Handle validation errors specifically
    if (error.message.includes('Amount must be greater than 0') ||
        error.message.includes('Category is required') ||
        error.message.includes('Payment method is required')) {
      errorMessage.value = error.message
    } else {
      errorMessage.value = 'Failed to add transaction. Please check your input and try again.'
    }
    
    // Let child component know there was an error
    throw error // Re-throw to let child handle it
  } finally {
    isSubmitting.value = false
  }
}

const handleClose = () => {
  router.push('/dashboard')
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <div class="bg-white shadow-sm border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <div class="flex items-center">
            <button
              @click="handleClose"
              class="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              <ArrowLeftIcon class="h-4 w-4 mr-2" />
              Back
            </button>
          </div>
          <div class="text-center flex-1">
            <h1 class="text-xl font-semibold text-gray-900">
              Add Transaction
            </h1>
          </div>
          <div class="w-24"></div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="py-6">
      <!-- Error Message only (success handled by child component) -->
      <div v-if="errorMessage" class="max-w-3xl mx-auto mb-4">
        <div class="bg-red-50 border border-red-200 rounded-md p-4">
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
                <p>{{ errorMessage }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AddTransaction 
        @submit="handleTransactionSubmit"
        :disabled="isSubmitting"
      />
    </div>
  </div>
</template>