<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ArrowLeftIcon } from '@heroicons/vue/24/outline'

const router = useRouter()
const authStore = useAuthStore()
const loading = ref(true)

onMounted(async () => {
  if (!authStore.isAuthenticated) {
    router.push('/login')
    return
  }
  
  loading.value = false
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
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div v-if="loading" class="text-center py-12">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <p class="mt-2 text-gray-500">Loading budget system...</p>
      </div>
      
      <div v-else class="bg-white rounded-lg shadow p-8">
        <h2 class="text-2xl font-bold text-gray-900 mb-4">Budget System</h2>
        <p class="text-gray-600 mb-6">
          The budget management system is being initialized. This is a test version to ensure the page loads correctly.
        </p>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="bg-blue-50 rounded-lg p-6">
            <h3 class="text-lg font-semibold text-blue-900 mb-2">Monthly Budgets</h3>
            <p class="text-blue-700">Plan and track your monthly expenses by category</p>
          </div>
          
          <div class="bg-green-50 rounded-lg p-6">
            <h3 class="text-lg font-semibold text-green-900 mb-2">Annual Goals</h3>
            <p class="text-green-700">Set long-term financial goals and track progress</p>
          </div>
          
          <div class="bg-purple-50 rounded-lg p-6">
            <h3 class="text-lg font-semibold text-purple-900 mb-2">Savings Plans</h3>
            <p class="text-purple-700">Get personalized investment recommendations</p>
          </div>
        </div>
        
        <div class="mt-8">
          <button
            @click="router.push('/dashboard')"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
