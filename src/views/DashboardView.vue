<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useFinanceStore } from '@/stores/finance'

import {
  UserIcon,
  ArrowRightOnRectangleIcon,
  Cog6ToothIcon,
  ChartBarIcon,
  WalletIcon,
  CreditCardIcon,
  InformationCircleIcon,
  Bars3Icon,
  XMarkIcon,
  PlusIcon,
  DocumentTextIcon
} from '@heroicons/vue/24/outline'
import { Menu, MenuButton, MenuItem, MenuItems, Dialog, DialogPanel, TransitionChild, TransitionRoot } from '@headlessui/vue'

const router = useRouter()
const authStore = useAuthStore()
const financeStore = useFinanceStore()

const sidebarOpen = ref(false)
const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: ChartBarIcon, current: true },
  { name: 'Transactions', href: '/transactions', icon: CreditCardIcon, current: false },
  { name: 'Budget', href: '/budget', icon: WalletIcon, current: false },
  { name: 'Taxes', href: '/taxes', icon: DocumentTextIcon, current: false },
  { name: 'Profile', href: '/profile', icon: UserIcon, current: false },
  { name: 'Settings', href: '/settings', icon: Cog6ToothIcon, current: false },
  { name: 'About', href: '/about', icon: InformationCircleIcon, current: false },
]

const handleSignOut = async () => {
  try {
    await authStore.signOut()
    router.push('/login')
  } catch (error) {
    console.error('Sign out failed:', error)
  }
}



const loading = ref(false)
const error = ref(null)

onMounted(async () => {
  if (!authStore.user) {
    await authStore.initializeAuth()
  }
  
  // Fetch real data from database
  loading.value = true
  error.value = null
  try {
    await financeStore.fetchTransactions()
    await financeStore.fetchCategories()
  } catch (error) {
    console.error('Error loading dashboard data:', error)
    error.value = 'Failed to load dashboard data'
  } finally {
    loading.value = false
  }
})

// Real financial data from database
const financialData = computed(() => ({
  totalBalance: financeStore.currentBalance,
  monthlyIncome: financeStore.totalIncome,
  monthlyExpenses: financeStore.totalExpenses,
  savings: financeStore.currentBalance > 0 ? financeStore.currentBalance : 0,
  investments: 0 // Will be updated when investments store is connected
}))

// Recent transactions (first 5 transactions)
const recentTransactions = computed(() => {
  return financeStore.transactions.slice(0, 5)
})

const indianMonths = [
  'Chaitra', 'Vaishakha', 'Jyeshtha', 'Ashadha', 'Shravana', 'Bhadrapada',
  'Ashwin', 'Kartika', 'Margashirsha', 'Pausha', 'Magha', 'Phalguna'
]

const currentIndianMonth = computed(() => {
  const currentMonth = new Date().getMonth()
  return indianMonths[currentMonth] || 'Current Month'
})
</script>

<template>
  <div>
    <!-- Mobile sidebar -->
    <TransitionRoot as="template" :show="sidebarOpen">
      <Dialog as="div" class="relative z-50 lg:hidden" @close="sidebarOpen = false">
          <TransitionChild
          as="template"
          enter="transition-opacity ease-linear duration-300"
          enter-from="opacity-0"
          enter-to="opacity-100"
          leave="transition-opacity ease-linear duration-300"
          leave-from="opacity-100"
          leave-to="opacity-0"
        >
          <div class="fixed inset-0 bg-gray-900/80"></div>
        </TransitionChild>

        <div class="fixed inset-0 flex">
          <TransitionChild
            as="template"
            enter="transition ease-in-out duration-300 transform"
            enter-from="-translate-x-full"
            enter-to="translate-x-0"
            leave="transition ease-in-out duration-300 transform"
            leave-from="translate-x-0"
            leave-to="-translate-x-full"
          >
            <DialogPanel class="relative mr-16 flex w-full max-w-xs flex-1">
              <TransitionChild
                as="template"
                enter="ease-in-out duration-300"
                enter-from="opacity-0"
                enter-to="opacity-100"
                leave="ease-in-out duration-300"
                leave-from="opacity-100"
                leave-to="opacity-0"
              >
                <div class="absolute left-full top-0 flex w-16 justify-center pt-5">
                  <button type="button" class="-m-2.5 p-2.5 text-gray-500 hover:text-gray-600" @click="sidebarOpen = false" aria-label="Close sidebar">
                    <XMarkIcon class="h-6 w-6" />
                  </button>
                </div>
              </TransitionChild>
              <div class="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-4">
                <div class="flex h-16 shrink-0 items-center">
                  <h1 class="text-xl font-bold text-gray-900">FinTrack</h1>
                </div>
                <nav class="flex flex-1 flex-col">
                  <ul role="list" class="flex flex-1 flex-col gap-y-7">
                    <li>
                      <ul role="list" class="-mx-2 space-y-1">
                        <li v-for="item in navigation" :key="item.name">
                          <a
                            :href="item.href"
                            :class="[
                              item.current
                                ? 'bg-indigo-50 border-indigo-600 text-indigo-600'
                                : 'text-gray-700 hover:text-indigo-600 hover:bg-gray-50',
                              'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold border-l-4 border-transparent'
                            ]"
                            :aria-current="item.current ? 'page' : undefined"
                            :aria-label="`Navigate to ${item.name}`"
                          >
                            <component :is="item.icon" class="h-6 w-6 shrink-0" aria-hidden="true" />
                            {{ item.name }}
                          </a>
                        </li>
                      </ul>
                    </li>
                  </ul>
                </nav>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </TransitionRoot>

    <!-- Desktop sidebar -->
    <div class="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
      <div class="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-4 border-r border-gray-200">
        <div class="flex h-16 shrink-0 items-center">
          <h1 class="text-xl font-bold text-gray-900">FinTrack</h1>
        </div>
        <nav class="flex flex-1 flex-col">
          <ul role="list" class="flex flex-1 flex-col gap-y-7">
            <li>
              <ul role="list" class="-mx-2 space-y-1">
                <li v-for="item in navigation" :key="item.name">
                  <router-link
                    :to="item.href"
                    :class="[
                      item.current
                        ? 'bg-indigo-50 border-indigo-600 text-indigo-600'
                        : 'text-gray-700 hover:text-indigo-600 hover:bg-gray-50',
                      'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold border-l-4 border-transparent'
                    ]"
                    :aria-current="item.current ? 'page' : undefined"
                    :aria-label="`Navigate to ${item.name}`"
                  >
                    <component :is="item.icon" class="h-6 w-6 shrink-0" aria-hidden="true" />
                    {{ item.name }}
                  </router-link>
                </li>
              </ul>
            </li>
          </ul>
        </nav>
      </div>
    </div>

    <!-- Main content -->
    <div class="lg:pl-72">
      <!-- Top bar -->
      <div class="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
        <button type="button" class="-m-2.5 p-2.5 text-gray-700 lg:hidden" @click="sidebarOpen = true" aria-label="Open sidebar">
                  <Bars3Icon class="h-6 w-6" />
                </button>

        <div class="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
          <div class="flex flex-1"></div>
          <div class="flex items-center gap-x-4 lg:gap-x-6">
            <!-- Profile dropdown -->
            <Menu as="div" class="relative">
              <MenuButton class="-m-1.5 flex items-center p-1.5" aria-label="Open user menu">
                <div class="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center" role="img" :aria-label="`User avatar: ${(authStore.user?.user_metadata?.full_name || authStore.user?.email)?.charAt(0).toUpperCase()}`">
                  <span class="text-sm font-medium text-white">
                    {{ (authStore.user?.user_metadata?.full_name || authStore.user?.email)?.charAt(0).toUpperCase() }}
                  </span>
                </div>
              </MenuButton>
              <transition
                enter-active-class="transition ease-out duration-100"
                enter-from-class="transform opacity-0 scale-95"
                enter-to-class="transform opacity-100 scale-100"
                leave-active-class="transition ease-in duration-75"
                leave-from-class="transform opacity-100 scale-100"
                leave-to-class="transform opacity-0 scale-95"
              >
                <MenuItems
                  class="absolute right-0 z-10 mt-2.5 w-32 origin-top-right rounded-md bg-white py-2 shadow-lg ring-1 ring-gray-900/5 focus:outline-none"
                >
                  <MenuItem v-slot="{ active }">
                    <router-link
                      to="/profile"
                      :class="[
                        active ? 'bg-gray-50' : '',
                        'block px-3 py-1 text-sm leading-6 text-gray-900'
                      ]"
                      aria-label="View your profile"
                    >
                      Your Profile
                    </router-link>
                  </MenuItem>
                  <MenuItem v-slot="{ active }">
                    <button
                      @click="handleSignOut"
                      :class="[
                        active ? 'bg-gray-50' : '',
                        'flex w-full items-center px-3 py-1 text-sm leading-6 text-gray-900'
                      ]"
                      aria-label="Sign out of your account"
                    >
                      Sign out
                    </button>
                  </MenuItem>
                </MenuItems>
              </transition>
            </Menu>
          </div>
        </div>
      </div>

      <!-- Page content -->
      <main class="py-4 sm:py-6">
        <div class="fintrack-container">
          <!-- Loading State -->
          <div v-if="loading" class="text-center py-12">
            <div class="inline-flex items-center">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <span class="ml-3 text-gray-600">Loading dashboard...</span>
            </div>
          </div>

          <!-- Error State -->
          <div v-else-if="error" class="text-center py-12">
            <div class="bg-red-50 border border-red-200 rounded-md p-4">
              <h3 class="text-lg font-medium text-red-800">Error</h3>
              <p class="mt-2 text-red-600">{{ error }}</p>
              <button @click="location.reload()" class="mt-3 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700">
                Retry
              </button>
            </div>
          </div>

          <!-- Dashboard Content -->
          <div v-else>
          <div class="fintrack-header">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div class="flex-1">
                <h1 class="fintrack-header-title">Dashboard</h1>
                <p class="fintrack-header-subtitle">
                  Welcome back, {{ authStore.user?.user_metadata?.full_name || authStore.user?.email }}! Here's your financial overview for {{ currentIndianMonth }}.
                </p>
              </div>
              <div class="mt-4 sm:mt-0">
                <router-link
                  to="/add-transaction"
                  class="fintrack-btn-primary"
                  aria-label="Add income or expense transaction"
                >
                  <PlusIcon class="h-4 w-4 mr-2" aria-hidden="true" />
                  Add Income / Expense
                </router-link>
              </div>
            </div>
          </div>

          <!-- Stats grid -->
          <div class="mt-6 grid grid-cols-1 gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-4" role="region" aria-label="Financial overview">
            <div class="fintrack-card" role="article" aria-label="Total balance card">
              <div class="card-padding">
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <WalletIcon class="h-5 w-5 sm:h-6 sm:w-6 text-gray-400" aria-hidden="true" />
                  </div>
                  <div class="ml-3 sm:ml-5 w-0 flex-1">
                    <dl>
                      <dt class="text-xs sm:text-sm font-medium text-gray-500 truncate">Total Balance</dt>
                      <dd class="text-base sm:text-lg font-medium text-gray-900" aria-label="Total balance amount">{{ financeStore.formatIndianCurrency(financialData.totalBalance) }}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div class="fintrack-card" role="article" aria-label="Monthly income card">
              <div class="card-padding">
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <ChartBarIcon class="h-6 w-6 text-gray-400" aria-hidden="true" />
                  </div>
                  <div class="ml-5 w-0 flex-1">
                    <dl>
                      <dt class="text-sm font-medium text-gray-500 truncate">Monthly Income</dt>
                      <dd class="text-lg font-medium text-gray-900" aria-label="Monthly income amount">{{ financeStore.formatIndianCurrency(financialData.monthlyIncome) }}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div class="fintrack-card" role="article" aria-label="Monthly expenses card">
              <div class="card-padding">
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <CreditCardIcon class="h-6 w-6 text-gray-400" aria-hidden="true" />
                  </div>
                  <div class="ml-5 w-0 flex-1">
                    <dl>
                      <dt class="text-sm font-medium text-gray-500 truncate">Monthly Expenses</dt>
                      <dd class="text-lg font-medium text-gray-900" aria-label="Monthly expenses amount">{{ financeStore.formatIndianCurrency(financialData.monthlyExpenses) }}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div class="fintrack-card" role="article" aria-label="Monthly savings card">
              <div class="card-padding">
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <ChartBarIcon class="h-6 w-6 text-gray-400" aria-hidden="true" />
                  </div>
                  <div class="ml-5 w-0 flex-1">
                    <dl>
                      <dt class="text-sm font-medium text-gray-500 truncate">Monthly Savings</dt>
                      <dd class="text-lg font-medium text-gray-900" aria-label="Monthly savings amount">{{ financeStore.formatIndianCurrency(financialData.savings) }}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Recent transactions -->
          <div class="mt-6 sm:mt-8">
            <h2 class="text-base sm:text-lg font-medium text-gray-900" id="recent-transactions-heading">Recent Transactions</h2>
            <div class="mt-3 sm:mt-4 fintrack-card" role="region" aria-labelledby="recent-transactions-heading">
              <ul v-if="recentTransactions.length > 0" class="divide-y divide-gray-200" role="list">
                <li v-for="transaction in recentTransactions" :key="transaction.id" class="fintrack-list-item" role="listitem">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center flex-1 min-w-0">
                      <div class="flex-shrink-0">
                        <div :class="[
                          'h-8 w-8 sm:h-10 sm:w-10 rounded-full flex items-center justify-center',
                          transaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'
                        ]" aria-hidden="true">
                          <span :class="[
                            'font-medium text-sm sm:text-base',
                            transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                          ]">{{ transaction.type === 'income' ? '+' : '-' }}</span>
                        </div>
                      </div>
                      <div class="ml-3 sm:ml-4 fintrack-list-item-content">
                        <div class="fintrack-list-item-title">{{ transaction.title || transaction.description || 'Transaction' }}</div>
                        <div class="fintrack-list-item-subtitle">
                          {{ financeStore.formatIndianCurrency(transaction.amount) }} • {{ transaction.date }} via {{ transaction.payment_method }}
                        </div>
                      </div>
                    </div>
                    <div class="ml-2 sm:ml-4 flex-shrink-0">
                      <div :class="[
                        'text-sm font-medium',
                        transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                      ]" :aria-label="`${transaction.type} amount: ${financeStore.formatIndianCurrency(transaction.amount)}`">
                        {{ transaction.type === 'income' ? '+' : '' }}{{ financeStore.formatIndianCurrency(transaction.amount) }}
                      </div>
                    </div>
                  </div>
                </li>
              </ul>
              <div v-else class="text-center py-8 text-gray-500">
                <div class="text-sm">No transactions yet</div>
                <div class="mt-2">
                  <router-link to="/add-transaction" class="text-indigo-600 hover:text-indigo-800 font-medium">
                    Add your first transaction →
                  </router-link>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
      </main>
    </div>
  </div>
</template>

