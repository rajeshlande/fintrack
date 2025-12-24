<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useCategoriesStore } from '@/stores/categories'
import { usePaymentMethodsStore } from '@/stores/paymentMethods'
import { 
  ArrowLeftIcon, 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  CurrencyRupeeIcon,
  CreditCardIcon,
  BanknotesIcon
} from '@heroicons/vue/24/outline'

const router = useRouter()
const authStore = useAuthStore()
const categoriesStore = useCategoriesStore()
const paymentMethodsStore = usePaymentMethodsStore()

// State
const activeTab = ref('income')
const loading = ref(true)
const saving = ref(false)

// Modal state
const showModal = ref(false)
const editingCategory = ref(null)
const newCategory = ref({
  name: '',
  type: 'income',
  icon: '💰',
  color: '#10B981',
  description: ''
})
const modalMode = ref('add') // 'add' or 'edit'
const currentItem = ref(null)
const currentTable = ref('')

// Form state
const formData = ref({
  name: '',
  description: ''
})

// Notifications
const notification = ref({
  show: false,
  type: 'success', // 'success' or 'error'
  message: ''
})

// Tab configuration with colors
const tabs = [
  { 
    id: 'income', 
    name: 'Income Categories', 
    icon: BanknotesIcon,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-500',
    accentColor: 'bg-green-500'
  },
  { 
    id: 'expense', 
    name: 'Expense Categories', 
    icon: CurrencyRupeeIcon,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-500',
    accentColor: 'bg-red-500'
  },
  { 
    id: 'payment', 
    name: 'Payment Methods', 
    icon: CreditCardIcon,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-500',
    accentColor: 'bg-blue-500'
  }
]

// Computed properties
const incomeCategories = computed(() => categoriesStore.categories.filter(cat => cat.type === 'income'))
const expenseCategories = computed(() => categoriesStore.categories.filter(cat => cat.type === 'expense'))
const paymentMethods = computed(() => paymentMethodsStore.paymentMethods)
const userIncomeCategories = computed(() => incomeCategories.value.filter(cat => !cat.is_default))
const userExpenseCategories = computed(() => expenseCategories.value.filter(cat => !cat.is_default))

// Computed properties for table names
const tableNames = computed(() => ({
  income: 'income_categories',
  expense: 'expense_categories', 
  payment: 'payment_methods'
}))

// Current tab styling
const currentTab = computed(() => tabs.find(t => t.id === activeTab.value))

// Load data based on active tab
const loadData = async () => {
  try {
    loading.value = true
    
    // Always load categories
    await categoriesStore.fetchCategories()
    
    // Load payment methods if payment tab is active or if it's the first load
    if (activeTab.value === 'payment' || !categoriesStore.categories.length) {
      await paymentMethodsStore.fetchPaymentMethods()
    }
  } catch (error) {
    console.error('Error loading data:', error)
  } finally {
    loading.value = false
  }
}

const openAddModal = (type) => {
  modalMode.value = 'add'
  newCategory.value = {
    name: '',
    type: type,
    icon: type === 'income' ? '💰' : '💸',
    color: type === 'income' ? '#10B981' : '#EF4444',
    description: ''
  }
  showModal.value = true
}

const openEditModal = (category) => {
  modalMode.value = 'edit'
  currentItem.value = category
  formData.value = {
    name: category.name,
    description: category.description || ''
  }
  showModal.value = true
}

const saveCategory = async () => {
  try {
    saving.value = true
    
    if (modalMode.value === 'add') {
      await categoriesStore.createCategory(newCategory.value)
    } else if (modalMode.value === 'edit') {
      await categoriesStore.updateCategory(currentItem.value.id, {
        name: formData.value.name,
        description: formData.value.description
      })
    }
    
    showModal.value = false
    resetForm()
    await loadData() // Reload data to show changes
  } catch (error) {
    console.error('Error saving category:', error)
    alert('Failed to save category: ' + error.message)
  } finally {
    saving.value = false
  }
}

const deleteCategory = async (categoryId) => {
  if (!confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
    return
  }
  
  try {
    await categoriesStore.deleteCategory(categoryId)
  } catch (error) {
    console.error('Error deleting category:', error)
    alert('Cannot delete category with existing transactions')
  }
}

const resetForm = () => {
  currentItem.value = null
  formData.value = {
    name: '',
    description: ''
  }
}

const closeModal = () => {
  showModal.value = false
  resetForm()
}

const handleSubmit = async () => {
  try {
    saving.value = true
    
    if (modalMode.value === 'add') {
      if (activeTab.value === 'payment') {
        await paymentMethodsStore.createPaymentMethod(formData.value)
      } else {
        await categoriesStore.createCategory(newCategory.value)
      }
    } else if (modalMode.value === 'edit') {
      if (activeTab.value === 'payment') {
        await paymentMethodsStore.updatePaymentMethod(currentItem.value.id, formData.value)
      } else {
        await categoriesStore.updateCategory(currentItem.value.id, formData.value)
      }
    }
    
    closeModal()
    await loadData()
    showNotification('success', `${getItemType()} ${modalMode.value === 'add' ? 'created' : 'updated'} successfully`)
  } catch (error) {
    console.error('Error saving item:', error)
    showNotification('error', 'Failed to save: ' + error.message)
  } finally {
    saving.value = false
  }
}

const handleDelete = async (item) => {
  if (!confirm(`Are you sure you want to delete this ${getItemType().toLowerCase()}? This action cannot be undone.`)) {
    return
  }
  
  try {
    if (activeTab.value === 'payment') {
      await paymentMethodsStore.deletePaymentMethod(item.id)
    } else {
      await categoriesStore.deleteCategory(item.id)
    }
    await loadData()
    showNotification('success', `${getItemType()} deleted successfully`)
  } catch (error) {
    console.error('Error deleting item:', error)
    showNotification('error', 'Cannot delete item with existing transactions')
  }
}

// Helper functions
const getItemType = () => {
  switch (activeTab.value) {
    case 'income': return 'Income Category'
    case 'expense': return 'Expense Category'
    case 'payment': return 'Payment Method'
    default: return 'Item'
  }
}

const getCurrentData = () => {
  switch (activeTab.value) {
    case 'income': return userIncomeCategories.value
    case 'expense': return userExpenseCategories.value
    case 'payment': return paymentMethods.value
    default: return []
  }
}

const showNotification = (type, message) => {
  notification.value = { show: true, type, message }
  setTimeout(() => {
    notification.value.show = false
  }, 5000)
}

// Initialize
onMounted(async () => {
  if (!authStore.user) {
    await authStore.initializeAuth()
  }
  await loadData()
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 py-4 sm:py-8">
    <div class="fintrack-container">
      <div class="max-w-5xl mx-auto">
        <!-- Header -->
        <div class="fintrack-header">
          <button
            @click="router.push('/settings')"
            class="fintrack-back-btn"
          >
            <ArrowLeftIcon class="h-4 w-4 mr-2" />
            Back to Settings
          </button>
          
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 class="fintrack-header-title">Categories & Payment Methods</h1>
              <p class="fintrack-header-subtitle">
                Manage your income categories, expense categories, and payment methods
              </p>
            </div>
          </div>
        </div>

        <!-- Notification -->
        <transition
          enter-active-class="transform ease-out duration-300 transition"
          enter-from-class="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
          enter-to-class="translate-y-0 opacity-100 sm:translate-x-0"
          leave-active-class="transition ease-in duration-100"
          leave-from-class="opacity-100"
          leave-to-class="opacity-0"
        >
          <div 
            v-if="notification.show"
            class="fixed top-4 right-4 z-50 max-w-sm"
          >
            <div 
              :class="notification.type === 'success' 
                ? 'bg-green-50 border-green-200 text-green-800 shadow-green-200' 
                : 'bg-red-50 border-red-200 text-red-800 shadow-red-200'"
              class="border rounded-xl p-4 shadow-lg backdrop-blur-sm"
            >
              <div class="flex items-center">
                <CheckCircleIcon v-if="notification.type === 'success'" class="h-5 w-5 mr-2" />
                <ExclamationCircleIcon v-else class="h-5 w-5 mr-2" />
                <span class="text-sm font-medium">{{ notification.message }}</span>
              </div>
            </div>
          </div>
        </transition>

        <!-- Mobile Segmented Control -->
        <div class="sm:hidden mb-6">
          <div class="fintrack-segmented">
            <div class="grid grid-cols-3 gap-1">
              <button
                v-for="tab in tabs"
                :key="tab.id"
                @click="activeTab = tab.id; loadData()"
                :class="[
                  activeTab === tab.id
                    ? [tab.bgColor, tab.color, 'shadow-sm']
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50',
                  'px-3 py-3 text-xs font-medium rounded-lg transition-all duration-200 flex flex-col items-center space-y-1'
                ]"
              >
                <component :is="tab.icon" class="h-5 w-5" />
                <span class="text-center">{{ tab.name.split(' ')[0] }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Desktop Tabs -->
        <div class="hidden sm:block mb-6">
          <div class="fintrack-tabs">
            <nav class="flex" aria-label="Tabs">
              <button
                v-for="tab in tabs"
                :key="tab.id"
                @click="activeTab = tab.id; loadData()"
                :class="[
                  activeTab === tab.id
                    ? [tab.borderColor, tab.color, 'border-b-2']
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
                  'flex-1 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center justify-center space-x-2 transition-all duration-200'
                ]"
              >
                <component :is="tab.icon" class="h-5 w-5" />
                <span>{{ tab.name }}</span>
              </button>
            </nav>
          </div>
        </div>

        <!-- Content Card -->
        <div class="fintrack-card">
          <!-- Header -->
          <div class="px-4 sm:px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            <div class="flex items-center space-x-3">
              <div 
                :class="currentTab?.bgColor"
                class="p-2 rounded-lg"
              >
                <component :is="currentTab?.icon" :class="currentTab?.color" class="h-6 w-6" />
              </div>
              <div>
                <h2 class="text-lg font-semibold text-gray-900">
                  {{ currentTab?.name }}
                </h2>
                <p class="text-sm text-gray-500">
                  {{ getCurrentData().length }} {{ getItemType() }}{{ getCurrentData().length !== 1 ? 's' : '' }}
                </p>
              </div>
            </div>
            <button
              @click="openAddModal(activeTab)"
              :class="currentTab?.accentColor"
              class="fintrack-btn"
              :style="{ backgroundColor: currentTab?.accentColor }"
            >
              <PlusIcon class="h-4 w-4 mr-2" />
              Add New
            </button>
          </div>

          <!-- Loading -->
          <div v-if="loading" class="fintrack-loading">
            <div class="fintrack-spinner"></div>
            Loading...
          </div>

          <!-- Empty State -->
          <div v-else-if="getCurrentData().length === 0" class="fintrack-empty-state">
            <div class="fintrack-empty-icon">
              <component :is="currentTab?.icon" class="h-16 w-16 mx-auto" />
            </div>
            <h3 class="fintrack-empty-title">No {{ getItemType() }}s yet</h3>
            <p class="fintrack-empty-description">Get started by adding your first {{ getItemType() }} to organize your finances better.</p>
            <button
              @click="openAddModal(activeTab)"
              :class="currentTab?.accentColor"
              class="fintrack-btn"
              :style="{ backgroundColor: currentTab?.accentColor }"
            >
              <PlusIcon class="h-4 w-4 mr-2" />
              Add {{ getItemType() }}
            </button>
          </div>

          <!-- List -->
          <div v-else class="divide-y divide-gray-100">
            <div 
              v-for="item in getCurrentData()" 
              :key="item.id"
              class="fintrack-list-item"
            >
              <div class="fintrack-list-item-content">
                <h3 class="fintrack-list-item-title">{{ item.name }}</h3>
                <p v-if="item.description" class="fintrack-list-item-subtitle">{{ item.description }}</p>
                <p class="fintrack-list-item-meta">
                  Created {{ new Date(item.created_at).toLocaleDateString() }}
                </p>
              </div>
              <div class="flex items-center space-x-2 ml-4">
                <button
                  @click="openEditModal(item)"
                  class="fintrack-action-btn-edit"
                >
                  <PencilIcon class="h-4 w-4" />
                </button>
                <button
                  @click="handleDelete(item)"
                  class="fintrack-action-btn-delete"
                >
                  <TrashIcon class="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <transition
      enter-active-class="ease-out duration-300"
      enter-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="ease-in duration-200"
      leave-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="showModal" class="fintrack-modal">
        <div class="fintrack-modal-content">
          <div class="p-6">
            <div class="fintrack-modal-header">
              <div :class="currentTab?.bgColor" class="fintrack-modal-icon">
                <component :is="currentTab?.icon" :class="currentTab?.color" class="h-6 w-6" />
              </div>
              <div>
                <h3 class="text-lg font-semibold text-gray-900">
                  {{ modalMode === 'add' ? 'Add New' : 'Edit' }} {{ getItemType() }}
                </h3>
                <p class="text-sm text-gray-500">
                  {{ modalMode === 'add' ? 'Create a new' : 'Update the' }} {{ getItemType() }}
                </p>
              </div>
            </div>
            
            <form @submit.prevent="handleSubmit" class="space-y-5">
              <div>
                <label for="name" class="fintrack-label">
                  Name *
                </label>
                <input
                  id="name"
                  :value="modalMode === 'add' ? newCategory.name : formData.name"
                  @input="modalMode === 'add' ? newCategory.name = $event.target.value : formData.name = $event.target.value"
                  type="text"
                  required
                  class="fintrack-input"
                  placeholder="Enter name"
                />
              </div>
              
              <div>
                <label for="description" class="fintrack-label">
                  Description
                </label>
                <textarea
                  id="description"
                  :value="modalMode === 'add' ? newCategory.description : formData.description"
                  @input="modalMode === 'add' ? newCategory.description = $event.target.value : formData.description = $event.target.value"
                  rows="3"
                  class="fintrack-textarea"
                  placeholder="Enter description (optional)"
                />
              </div>
              
              <div class="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  @click="closeModal"
                  class="fintrack-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  :disabled="saving"
                  :class="currentTab?.accentColor"
                  class="fintrack-btn"
                  :style="{ backgroundColor: currentTab?.accentColor }"
                >
                  {{ saving ? 'Saving...' : 'Save' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>