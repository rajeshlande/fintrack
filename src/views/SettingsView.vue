<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ArrowLeftIcon, Cog6ToothIcon, BellIcon, UserIcon, ShieldCheckIcon, PaintBrushIcon, TagIcon, CreditCardIcon, ArrowRightIcon, LockClosedIcon, CheckCircleIcon, ClockIcon, SparklesIcon, InformationCircleIcon } from '@heroicons/vue/24/outline'

const router = useRouter()
const authStore = useAuthStore()

const settings = ref([
  {
    id: 'categories',
    name: 'Categories & Payment Methods',
    description: 'Manage income/expense categories and payment methods',
    icon: TagIcon,
    comingSoon: false,
    href: '/settings/categories'
  },
  {
    id: 'account',
    name: 'Account Settings',
    description: 'Manage your account details',
    icon: UserIcon,
    comingSoon: false,
    href: '/profile'
  },
  {
    id: 'about',
    name: 'About FinTrack',
    description: 'Learn more about FinTrack and its features',
    icon: InformationCircleIcon,
    comingSoon: false,
    href: '/about'
  },
  {
    id: 'notifications',
    name: 'Notifications',
    description: 'Manage your notification preferences',
    icon: BellIcon,
    comingSoon: true
  },
  {
    id: 'appearance',
    name: 'Appearance',
    description: 'Customize the look and feel',
    icon: PaintBrushIcon,
    comingSoon: true
  },
  {
    id: 'privacy',
    name: 'Privacy & Security',
    description: 'Control your privacy settings',
    icon: ShieldCheckIcon,
    comingSoon: true
  }
])

onMounted(async () => {
  if (!authStore.user) {
    await authStore.initializeAuth()
  }
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 py-12">
    <div class="fintrack-container">
      <div class="max-w-3xl mx-auto">
        <!-- Back button -->
        <button
          @click="router.push('/dashboard')"
          class="fintrack-back-btn"
        >
          <ArrowLeftIcon class="h-4 w-4 mr-2" />
          Back to Dashboard
        </button>
        
        <div class="fintrack-card">
          <div class="card-padding">
            <div class="flex items-center">
              <div class="relative mr-3">
                <Cog6ToothIcon class="h-6 w-6 text-gray-900" />
                <span class="absolute -top-1 -right-1 bg-indigo-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                  {{ settings.filter(s => s.href && !s.comingSoon).length }}
                </span>
              </div>
              <div>
                <h1 class="fintrack-header-title">Settings</h1>
                <p class="fintrack-header-subtitle">
                  Manage your FinTrack preferences and account settings
                </p>
              </div>
            </div>
          </div>
          
          <div class="border-t border-gray-200">
            <div class="divide-y divide-gray-200">
              <div 
                v-for="setting in settings" 
                :key="setting.id"
                class="fintrack-list-item group"
              >
                <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                  <div class="flex items-center min-w-0 flex-1">
                    <div class="bg-gray-100 rounded-lg p-2 mr-3 sm:mr-4 flex-shrink-0">
                      <component 
                        :is="setting.icon" 
                        class="h-5 w-5 sm:h-6 sm:w-6 text-gray-600"
                      />
                    </div>
                    <div class="min-w-0 flex-1">
                      <h3 class="text-sm font-medium text-gray-900">
                        {{ setting.name }}
                      </h3>
                      <p class="text-sm text-gray-500 mt-1">
                        {{ setting.description }}
                      </p>
                    </div>
                  </div>
                  
                  <div class="flex items-center justify-end space-x-2 flex-shrink-0">
                    <span 
                      v-if="setting.comingSoon && !setting.href"
                      class="inline-flex items-center rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800"
                    >
                      Coming Soon
                    </span>
                    <router-link
                      v-else-if="setting.href"
                      :to="setting.href"
                      class="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                    >
                      Manage
                      <ArrowRightIcon class="ml-2 h-4 w-4" />
                    </router-link>
                    <button
                      v-else
                      disabled
                      class="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-500 bg-gray-50 opacity-50 cursor-not-allowed"
                    >
                      Manage
                      <LockClosedIcon class="ml-2 h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Quick Settings Summary -->
        <div class="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div class="bg-white rounded-lg p-4 border border-gray-200">
            <div class="flex items-center">
              <div class="bg-green-100 rounded-lg p-2">
                <CheckCircleIcon class="h-5 w-5 text-green-600" />
              </div>
              <div class="ml-3">
                <p class="text-sm font-medium text-gray-900">Active Settings</p>
                <p class="text-lg font-semibold text-gray-700">{{ settings.filter(s => s.href && !s.comingSoon).length }}</p>
              </div>
            </div>
          </div>
          <div class="bg-white rounded-lg p-4 border border-gray-200">
            <div class="flex items-center">
              <div class="bg-yellow-100 rounded-lg p-2">
                <ClockIcon class="h-5 w-5 text-yellow-600" />
              </div>
              <div class="ml-3">
                <p class="text-sm font-medium text-gray-900">Coming Soon</p>
                <p class="text-lg font-semibold text-gray-700">{{ settings.filter(s => s.comingSoon).length }}</p>
              </div>
            </div>
          </div>
          <div class="bg-white rounded-lg p-4 border border-gray-200">
            <div class="flex items-center">
              <div class="bg-blue-100 rounded-lg p-2">
                <SparklesIcon class="h-5 w-5 text-blue-600" />
              </div>
              <div class="ml-3">
                <p class="text-sm font-medium text-gray-900">Last Updated</p>
                <p class="text-lg font-semibold text-gray-700">Just now</p>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Additional Settings Info -->
        <div class="mt-6 sm:mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 shadow-sm">
          <div class="flex items-start">
            <div class="flex-shrink-0">
              <div class="bg-blue-100 rounded-lg p-2">
                <Cog6ToothIcon class="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div class="ml-4">
              <h3 class="text-base font-semibold text-blue-900 mb-2">
                More settings coming soon!
              </h3>
              <div class="text-sm text-blue-700 space-y-2">
                <p>
                  We're continuously working on new features and settings to give you more control over your FinTrack experience.
                </p>
                <div class="flex items-center mt-3">
                  <span class="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
                    <span class="w-2 h-2 bg-blue-400 rounded-full mr-2 animate-pulse"></span>
                    Active Development
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>