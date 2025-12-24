<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useFinanceStore } from '@/stores/finance'
import { ArrowRightIcon, CheckCircleIcon } from '@heroicons/vue/24/outline'

const router = useRouter()
const authStore = useAuthStore()
const financeStore = useFinanceStore()

const features = [
  {
    name: 'Track Expenses in ₹',
    description: 'Monitor your spending habits with Indian Rupee support and local categories like groceries, vegetables, and EMIs.',
    icon: CheckCircleIcon
  },
  {
    name: 'Indian Budget Management',
    description: 'Set budgets for Indian expense categories including festivals, gold purchases, temple donations, and household expenses.',
    icon: CheckCircleIcon
  },
  {
    name: 'UPI & Digital Payments',
    description: 'Track all your UPI transactions, Google Pay, PhonePe, Paytm payments, and traditional banking methods.',
    icon: CheckCircleIcon
  },
  {
    name: 'Indian Tax & GST Support',
    description: 'Get insights into your GST expenses, income tax calculations, and Indian financial year planning.',
    icon: CheckCircleIcon
  }
]

const handleGetStarted = () => {
  if (authStore.isAuthenticated) {
    router.push('/dashboard')
  } else {
    router.push('/register')
  }
}
</script>

<template>
  <div class="bg-white">
    <!-- Header -->
    <div class="relative isolate overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-32">
        <div class="mx-auto max-w-2xl text-center">
          <h1 class="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-6xl">
            Take Control of Your
            <span class="text-indigo-600 block sm:inline"> Financial Future</span>
            <span class="text-2xl sm:text-3xl lg:text-5xl block mt-2">in Indian Rupees ₹</span>
          </h1>
          <p class="mx-auto mt-4 sm:mt-6 text-base sm:text-lg leading-7 sm:leading-8 text-gray-600 max-w-xl">
            Track expenses, manage budgets, and achieve your financial goals with our comprehensive personal finance management platform designed for Indian users. Support for UPI, GST, Indian banks, and local expense categories.
          </p>
          <div class="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-x-6">
            <button
              @click="handleGetStarted"
              class="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-semibold rounded-md text-white bg-indigo-600 hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 shadow-sm"
            >
              Get Started
            </button>
            <router-link
              to="/login"
              class="w-full sm:w-auto inline-flex items-center justify-center text-base font-semibold leading-6 text-gray-900 hover:text-gray-700"
            >
              Sign in <span aria-hidden="true" class="ml-2">→</span>
            </router-link>
            <router-link
              to="/about"
              class="w-full sm:w-auto inline-flex items-center justify-center text-base font-medium leading-6 text-indigo-600 hover:text-indigo-500"
            >
              Learn more <span aria-hidden="true" class="ml-2">→</span>
            </router-link>
          </div>
        </div>
      </div>
    </div>

    <!-- Features -->
    <div class="py-16 sm:py-24 lg:py-32">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="mx-auto max-w-2xl text-center">
          <h2 class="text-base font-semibold leading-7 text-indigo-600">Everything you need</h2>
          <p class="mt-2 text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-gray-900">
            Powerful features for smart financial management
          </p>
        </div>
        <div class="mx-auto mt-12 max-w-2xl sm:mt-16 lg:mt-20 lg:max-w-none">
          <dl class="grid max-w-xl grid-cols-1 gap-y-12 lg:max-w-none lg:grid-cols-2 lg:gap-x-8 lg:gap-y-16">
            <div v-for="feature in features" :key="feature.name" class="flex flex-col">
              <dt class="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                <component :is="feature.icon" class="h-6 w-6 flex-none text-indigo-600" />
                {{ feature.name }}
              </dt>
              <dd class="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                <p class="flex-auto">{{ feature.description }}</p>
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>

    <!-- CTA Section -->
    <div class="bg-indigo-50">
      <div class="px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-32">
        <div class="mx-auto max-w-2xl text-center">
          <h2 class="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl lg:text-4xl">
            Ready to transform your finances?
          </h2>
          <p class="mx-auto mt-4 sm:mt-6 max-w-xl text-base sm:text-lg leading-7 sm:leading-8 text-gray-600">
            Join thousands of users who have already taken control of their financial future with FinTrack.
          </p>
          <div class="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-x-6">
            <button
              @click="handleGetStarted"
              class="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-semibold rounded-md text-white bg-indigo-600 hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 shadow-sm"
            >
              Start Free Trial
            </button>
            <router-link
              to="/login"
              class="w-full sm:w-auto inline-flex items-center justify-center text-base font-semibold leading-6 text-gray-900 hover:text-gray-700"
            >
              Learn more <span aria-hidden="true" class="ml-2">→</span>
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
