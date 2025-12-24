<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useFinanceStore } from '@/stores/finance'
import { 
  XMarkIcon,
  PhotoIcon,
  CalendarDaysIcon,
  BanknotesIcon,
  TagIcon,
  ClockIcon,
  MapPinIcon,
  DocumentTextIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  DocumentIcon
} from '@heroicons/vue/24/outline'

const props = defineProps({
  transaction: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['submit', 'cancel'])

const financeStore = useFinanceStore()

// Form state
const activeTab = ref('expense')
const formData = ref({
  type: 'expense',
  amount: '',
  category: '',
  subcategory: '',
  description: '',
  date: new Date().toISOString().split('T')[0],
  time: new Date().toTimeString().split(' ')[0].substring(0, 5),
  payment_method: 'cash',
  payment_provider: '',
  merchant: '',
  notes: '',
  tags: [],
  is_recurring: false,
  recurring_frequency: '',
  is_tax_deductible: false,
  tax_category: '',
  receipt_url: '',
  receipt_filename: '',
  receipt_type: '',
  location: '',
  from_account: '',
  to_account: '',
  status: 'completed'
})

const tagInput = ref('')
const receiptFile = ref(null)
const isSubmitting = ref(false)
const showReceiptPreview = ref(false)

// Tab configuration
const tabs = [
  { id: 'expense', label: 'Expense', icon: '💸', color: 'red' },
  { id: 'income', label: 'Income', icon: '💰', color: 'green' },
  { id: 'transfer', label: 'Transfer', icon: '🔄', color: 'blue' }
]

// Computed properties
const categories = computed(() => {
  if (activeTab.value === 'income') {
    return financeStore.incomeCategories
  } else if (activeTab.value === 'expense') {
    return financeStore.expenseCategories
  }
  return []
})

const isImageReceipt = computed(() => {
  if (!formData.value.receipt_filename) return false
  const ext = formData.value.receipt_filename.split('.').pop().toLowerCase()
  return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)
})

const paymentProviders = computed(() => {
  switch (formData.value.payment_method) {
    case 'upi':
      return ['Google Pay', 'PhonePe', 'Paytm', 'Amazon Pay', 'BHIM', 'Other UPI']
    case 'credit_card':
    case 'debit_card':
      return financeStore.banks
    case 'net_banking':
      return financeStore.banks
    case 'wallet':
      return ['Paytm Wallet', 'PhonePe Wallet', 'Amazon Pay Wallet', 'Mobikwik', 'Freecharge']
    default:
      return []
  }
})

const recurringFrequencies = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' }
]

const taxCategories = [
  { value: '80c', label: 'Section 80C - Investments' },
  { value: '80d', label: 'Section 80D - Health Insurance' },
  { value: '80g', label: 'Section 80G - Donations' },
  { value: '24', label: 'Section 24 - Home Loan Interest' },
  { value: '10', label: 'Section 10 - Allowances' },
  { value: 'other', label: 'Other Deductions' }
]

// Watch for tab changes
watch(activeTab, (newTab) => {
  formData.value.type = newTab
  // Reset category when switching tabs
  formData.value.category = ''
  formData.value.subcategory = ''
})

// Methods
const switchTab = (tabId) => {
  activeTab.value = tabId
}

const addTag = () => {
  if (tagInput.value.trim() && !formData.value.tags.includes(tagInput.value.trim())) {
    formData.value.tags.push(tagInput.value.trim())
    tagInput.value = ''
  }
}

const removeTag = (index) => {
  formData.value.tags.splice(index, 1)
}

const handleTagKeydown = (event) => {
  if (event.key === 'Enter') {
    event.preventDefault()
    addTag()
  }
}

const handleReceiptUpload = (event) => {
  const file = event.target.files[0]
  if (file) {
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB')
      return
    }
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      alert('Only JPG, PNG, GIF, WebP, and PDF files are allowed')
      return
    }
    
    receiptFile.value = file
    formData.value.receipt_filename = file.name
    formData.value.receipt_type = file.type
    
    // In a real app, you would upload to a server here
    // For now, we'll create a local URL
    const reader = new FileReader()
    reader.onload = (e) => {
      formData.value.receipt_url = e.target.result
      showReceiptPreview.value = true
    }
    reader.readAsDataURL(file)
  }
}

const removeReceipt = () => {
  formData.value.receipt_url = ''
  formData.value.receipt_filename = ''
  formData.value.receipt_type = ''
  receiptFile.value = null
  showReceiptPreview.value = false
}

const viewReceipt = () => {
  if (formData.value.receipt_url) {
    showReceiptPreview.value = !showReceiptPreview.value
  }
}

const formatAmount = () => {
  if (formData.value.amount) {
    formData.value.amount = parseFloat(formData.value.amount).toFixed(2)
  }
}

const validateForm = () => {
  if (!formData.value.amount || formData.value.amount <= 0) {
    alert('Please enter a valid amount')
    return false
  }
  
  if (!formData.value.category && activeTab.value !== 'transfer') {
    alert('Please select a category')
    return false
  }
  
  if (activeTab.value === 'transfer' && (!formData.value.from_account || !formData.value.to_account)) {
    alert('Please select both from and to accounts for transfer')
    return false
  }
  
  if (!formData.value.date) {
    alert('Please select a date')
    return false
  }
  
  return true
}

const submitForm = async () => {
  if (!validateForm()) return
  
  isSubmitting.value = true
  try {
    // Prepare the transaction data
    const transactionData = { ...formData.value }
    
    // Convert amount to number
    transactionData.amount = parseFloat(transactionData.amount)
    
    // Clean up empty fields
    Object.keys(transactionData).forEach(key => {
      if (transactionData[key] === '' || transactionData[key] === null) {
        delete transactionData[key]
      }
    })
    
    emit('submit', transactionData)
  } catch (error) {
    console.error('Error submitting form:', error)
    alert('An error occurred while saving the transaction. Please try again.')
  } finally {
    isSubmitting.value = false
  }
}

// Initialize form with existing transaction data
onMounted(() => {
  if (props.transaction) {
    // Populate form with existing data
    Object.keys(formData.value).forEach(key => {
      if (props.transaction[key] !== undefined) {
        formData.value[key] = props.transaction[key]
      }
    })
    
    // Set active tab based on transaction type
    activeTab.value = props.transaction.type || 'expense'
  }
})
</script>

<template>
  <div class="bg-white rounded-lg shadow-xl">
    <!-- Header -->
    <div class="px-6 py-4 border-b border-gray-200">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold text-gray-900">
          {{ props.transaction ? 'Edit Transaction' : 'Add New Transaction' }}
        </h2>
        <button
          @click="emit('cancel')"
          class="text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <XMarkIcon class="h-6 w-6" />
        </button>
      </div>
    </div>

    <!-- Tabs -->
    <div class="border-b border-gray-200">
      <nav class="flex space-x-8 px-6" aria-label="Tabs">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="switchTab(tab.id)"
          :class="[
            'py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200',
            activeTab === tab.id
              ? `border-${tab.color}-500 text-${tab.color}-600`
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          ]"
          :aria-current="activeTab === tab.id ? 'page' : undefined"
        >
          <span class="mr-2">{{ tab.icon }}</span>
          {{ tab.label }}
        </button>
      </nav>
    </div>

    <!-- Form Content -->
    <form @submit.prevent="submitForm" class="px-6 py-6 space-y-6">
      <!-- Transfer-specific fields -->
      <div v-if="activeTab === 'transfer'" class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">From Account</label>
          <select v-model="formData.from_account" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
            <option value="">Select account</option>
            <option v-for="bank in financeStore.banks" :key="bank" :value="bank">{{ bank }}</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">To Account</label>
          <select v-model="formData.to_account" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
            <option value="">Select account</option>
            <option v-for="bank in financeStore.banks" :key="bank" :value="bank">{{ bank }}</option>
          </select>
        </div>
      </div>

      <!-- Amount -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Amount <span class="text-red-500">*</span>
          </label>
          <div class="relative">
            <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
            <input
              v-model="formData.amount"
              type="number"
              step="0.01"
              min="0"
              @blur="formatAmount"
              class="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="0.00"
              required
            />
          </div>
        </div>
        
        <!-- Category (not for transfers) -->
        <div v-if="activeTab !== 'transfer'">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Category <span class="text-red-500">*</span>
          </label>
          <select v-model="formData.category" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" required>
            <option value="">Select category</option>
            <option v-for="category in categories" :key="category.id" :value="category.id">
              {{ category.icon }} {{ category.name }}
            </option>
          </select>
        </div>
      </div>

      <!-- Description and Merchant -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <input
            v-model="formData.description"
            type="text"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Enter description"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Merchant/Payee</label>
          <input
            v-model="formData.merchant"
            type="text"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Enter merchant or payee name"
          />
        </div>
      </div>

      <!-- Date and Time -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Date <span class="text-red-500">*</span>
          </label>
          <div class="relative">
            <CalendarDaysIcon class="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              v-model="formData.date"
              type="date"
              class="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Time</label>
          <div class="relative">
            <ClockIcon class="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              v-model="formData.time"
              type="time"
              class="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      <!-- Payment Method and Provider -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
          <select v-model="formData.payment_method" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
            <option v-for="method in financeStore.paymentMethods" :key="method.id" :value="method.id">
              {{ method.icon }} {{ method.name }}
            </option>
          </select>
        </div>
        <div v-if="paymentProviders.length > 0">
          <label class="block text-sm font-medium text-gray-700 mb-2">Payment Provider</label>
          <select v-model="formData.payment_provider" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
            <option value="">Select provider</option>
            <option v-for="provider in paymentProviders" :key="provider" :value="provider">{{ provider }}</option>
          </select>
        </div>
      </div>

      <!-- Tags -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">Tags</label>
        <div class="flex flex-wrap gap-2 mb-2">
          <span v-for="(tag, index) in formData.tags" :key="index" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
            {{ tag }}
            <button @click="removeTag(index)" class="ml-1 inline-flex text-indigo-600 hover:text-indigo-800">
              <XMarkIcon class="h-3 w-3" />
            </button>
          </span>
        </div>
        <div class="flex">
          <input
            v-model="tagInput"
            @keydown="handleTagKeydown"
            type="text"
            class="flex-1 border border-gray-300 rounded-l-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Add a tag"
          />
          <button
            @click="addTag"
            type="button"
            class="px-4 py-2 bg-indigo-600 text-white rounded-r-lg hover:bg-indigo-700 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Add
          </button>
        </div>
      </div>

      <!-- Location -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">Location</label>
        <div class="relative">
          <MapPinIcon class="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            v-model="formData.location"
            type="text"
            class="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Enter location (optional)"
          />
        </div>
      </div>

      <!-- Notes -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">Notes</label>
        <div class="relative">
          <DocumentTextIcon class="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <textarea
            v-model="formData.notes"
            rows="3"
            class="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Add any additional notes..."
          />
        </div>
      </div>

      <!-- Receipt Upload -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">Receipt</label>
        <div v-if="formData.receipt_url" class="mb-4">
          <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div class="flex items-center">
              <PhotoIcon class="h-5 w-5 text-gray-400 mr-2" />
              <span class="text-sm text-gray-700">{{ formData.receipt_filename }}</span>
            </div>
            <div class="flex items-center space-x-2">
              <button
                @click="viewReceipt"
                type="button"
                class="text-indigo-600 hover:text-indigo-800 text-sm"
              >
                View
              </button>
              <button
                @click="removeReceipt"
                type="button"
                class="text-red-600 hover:text-red-800"
              >
                <XMarkIcon class="h-4 w-4" />
              </button>
            </div>
          </div>
          <!-- Receipt Preview -->
          <div v-if="showReceiptPreview" class="mt-2 p-2 bg-gray-100 rounded-lg">
            <img v-if="isImageReceipt" :src="formData.receipt_url" alt="Receipt" class="max-w-full h-auto rounded-lg" />
            <div v-else class="p-4 text-center text-gray-600">
              <DocumentIcon class="h-8 w-8 mx-auto mb-2" />
              <p class="text-sm">PDF receipt uploaded</p>
              <p class="text-xs text-gray-500">{{ formData.receipt_filename }}</p>
            </div>
          </div>
        </div>
        <div v-else class="flex items-center justify-center w-full">
          <label class="w-full flex flex-col items-center px-4 py-6 bg-white text-blue rounded-lg shadow-lg tracking-wide uppercase border border-blue cursor-pointer hover:bg-blue hover:text-white">
            <PhotoIcon class="h-8 w-8 text-gray-400" />
            <span class="mt-2 text-base leading-normal">Upload Receipt</span>
            <input @change="handleReceiptUpload" type="file" class="hidden" accept="image/*,.pdf" />
          </label>
        </div>
        <p class="mt-1 text-xs text-gray-500">Supported formats: JPG, PNG, PDF (max 5MB)</p>
      </div>

      <!-- Advanced Options -->
      <div class="space-y-4">
        <div class="flex items-center">
          <input
            v-model="formData.is_recurring"
            type="checkbox"
            class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <label class="ml-2 block text-sm text-gray-900">This is a recurring transaction</label>
        </div>
        
        <div v-if="formData.is_recurring" class="ml-6">
          <label class="block text-sm font-medium text-gray-700 mb-2">Frequency</label>
          <select v-model="formData.recurring_frequency" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
            <option value="">Select frequency</option>
            <option v-for="freq in recurringFrequencies" :key="freq.value" :value="freq.value">
              {{ freq.label }}
            </option>
          </select>
        </div>

        <div class="flex items-center">
          <input
            v-model="formData.is_tax_deductible"
            type="checkbox"
            class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <label class="ml-2 block text-sm text-gray-900">This expense is tax deductible</label>
        </div>
        
        <div v-if="formData.is_tax_deductible" class="ml-6">
          <label class="block text-sm font-medium text-gray-700 mb-2">Tax Category</label>
          <select v-model="formData.tax_category" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
            <option value="">Select tax category</option>
            <option v-for="cat in taxCategories" :key="cat.value" :value="cat.value">
              {{ cat.label }}
            </option>
          </select>
        </div>
      </div>

      <!-- Form Actions -->
      <div class="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
        <button
          @click="emit('cancel')"
          type="button"
          class="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          :disabled="isSubmitting"
          class="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span v-if="isSubmitting">Saving...</span>
          <span v-else>{{ props.transaction ? 'Update Transaction' : 'Add Transaction' }}</span>
        </button>
      </div>
    </form>
  </div>
</template>