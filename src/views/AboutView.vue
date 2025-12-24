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
              <span class="hidden sm:inline">Back to Dashboard</span>
              <span class="sm:hidden">Back</span>
            </button>
            <div class="flex items-center">
              <InformationCircleIcon class="h-6 w-6 text-indigo-600 mr-3" />
              <h1 class="text-xl font-semibold text-gray-900">About FinTrack</h1>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="fintrack-card">
        <!-- Hero Section -->
        <div class="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 sm:px-8 py-8 sm:py-12">
          <div class="text-center">
            <div class="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-full mb-4">
              <svg class="w-8 h-8 sm:w-12 sm:h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <h2 class="text-2xl sm:text-3xl font-bold text-white mb-4">Smart Financial Management</h2>
            <p class="text-blue-100 text-base sm:text-lg">Designed for Indian users with comprehensive budget tracking and financial planning</p>
          </div>
        </div>

        <!-- Features Grid -->
        <div class="p-6 sm:p-8">
          <h3 class="text-xl sm:text-2xl font-semibold text-gray-900 mb-6">Key Features</h3>
          <div class="grid sm:grid-cols-2 gap-4 sm:gap-6 mb-8">
            <div class="flex items-start space-x-3 sm:space-x-4">
              <div class="flex-shrink-0">
                <div class="flex items-center justify-center h-10 w-10 sm:h-12 sm:w-12 rounded-md bg-blue-500 text-white">
                  <svg class="h-5 w-5 sm:h-6 sm:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                  </svg>
                </div>
              </div>
              <div>
                <h4 class="text-base sm:text-lg font-medium text-gray-900">Budget Tracking</h4>
                <p class="text-sm sm:text-base text-gray-600">Monthly and annual budget planning with real-time tracking</p>
              </div>
            </div>

            <div class="flex items-start space-x-3 sm:space-x-4">
              <div class="flex-shrink-0">
                <div class="flex items-center justify-center h-10 w-10 sm:h-12 sm:w-12 rounded-md bg-green-500 text-white">
                  <svg class="h-5 w-5 sm:h-6 sm:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
              </div>
              <div>
                <h4 class="text-base sm:text-lg font-medium text-gray-900">Indian Financial Context</h4>
                <p class="text-sm sm:text-base text-gray-600">April-March financial year and rupee formatting</p>
              </div>
            </div>

            <div class="flex items-start space-x-3 sm:space-x-4">
              <div class="flex-shrink-0">
                <div class="flex items-center justify-center h-10 w-10 sm:h-12 sm:w-12 rounded-md bg-purple-500 text-white">
                  <svg class="h-5 w-5 sm:h-6 sm:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
              </div>
              <div>
                <h4 class="text-base sm:text-lg font-medium text-gray-900">Goal Setting</h4>
                <p class="text-sm sm:text-base text-gray-600">Set and track financial goals with progress monitoring</p>
              </div>
            </div>

            <div class="flex items-start space-x-3 sm:space-x-4">
              <div class="flex-shrink-0">
                <div class="flex items-center justify-center h-10 w-10 sm:h-12 sm:w-12 rounded-md bg-orange-500 text-white">
                  <svg class="h-5 w-5 sm:h-6 sm:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                  </svg>
                </div>
              </div>
              <div>
                <h4 class="text-base sm:text-lg font-medium text-gray-900">Smart Analytics</h4>
                <p class="text-sm sm:text-base text-gray-600">Visual insights and spending patterns analysis</p>
              </div>
            </div>
          </div>

          <!-- Technology Stack -->
          <div class="border-t pt-6 sm:pt-8">
            <h3 class="text-xl sm:text-2xl font-semibold text-gray-900 mb-6">Built With Modern Technology</h3>
            <div class="grid sm:grid-cols-3 gap-3 sm:gap-4 text-center">
              <div class="bg-gray-50 rounded-lg p-4 sm:p-6">
                <div class="text-green-600 font-semibold text-base sm:text-lg mb-2">Vue.js 3</div>
                <p class="text-xs sm:text-sm text-gray-600">Modern reactive frontend framework</p>
              </div>
              <div class="bg-gray-50 rounded-lg p-4 sm:p-6">
                <div class="text-blue-600 font-semibold text-base sm:text-lg mb-2">Supabase</div>
                <p class="text-xs sm:text-sm text-gray-600">Backend as a Service with PostgreSQL</p>
              </div>
              <div class="bg-gray-50 rounded-lg p-4 sm:p-6">
                <div class="text-purple-600 font-semibold text-base sm:text-lg mb-2">TailwindCSS</div>
                <p class="text-xs sm:text-sm text-gray-600">Utility-first CSS framework</p>
              </div>
            </div>
          </div>

          <!-- Version Info -->
          <div class="border-t pt-6 sm:pt-8 mt-6 sm:mt-8">
            <div class="text-center text-gray-500">
              <p class="mb-2 text-sm sm:text-base">FinTrack Version {{ version }}</p>
              <p class="text-xs sm:text-sm">© 2025 FinTrack. All rights reserved.</p>
              <p class="text-xs sm:text-sm mt-2">A comprehensive financial management solution for Indian users</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeftIcon, InformationCircleIcon } from '@heroicons/vue/24/outline'

const router = useRouter()
const version = ref('0.0.30')
</script>
