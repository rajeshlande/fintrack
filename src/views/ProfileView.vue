<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/lib/supabase'
import { UserIcon, EnvelopeIcon, ArrowLeftIcon } from '@heroicons/vue/24/outline'

const router = useRouter()
const authStore = useAuthStore()

const isEditing = ref(false)
const isSaving = ref(false)
const saveMessage = ref('')
const saveError = ref('')

const formData = ref({
  email: '',
  full_name: ''
})

onMounted(async () => {
  if (!authStore.user) {
    await authStore.initializeAuth()
  }
  if (authStore.user) {
    formData.value.email = authStore.user.email || ''
    formData.value.full_name = authStore.user.user_metadata?.full_name || ''
  }
})

const handleUpdateProfile = async () => {
  try {
    isSaving.value = true
    saveMessage.value = ''
    saveError.value = ''
    
    const { error } = await supabase.auth.updateUser({
      data: {
        full_name: formData.value.full_name
      }
    })
    
    if (error) throw error
    
    isEditing.value = false
    saveMessage.value = 'Profile updated successfully!'
    await authStore.initializeAuth()
    
    // Clear success message after 3 seconds
    setTimeout(() => {
      saveMessage.value = ''
    }, 3000)
  } catch (error) {
    console.error('Profile update failed:', error)
    saveError.value = error.message || 'Failed to update profile'
    
    // Clear error message after 5 seconds
    setTimeout(() => {
      saveError.value = ''
    }, 5000)
  } finally {
    isSaving.value = false
  }
}

const handleSignOut = async () => {
  try {
    await authStore.signOut()
    router.push('/login')
  } catch (error) {
    console.error('Sign out failed:', error)
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 py-12">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="max-w-3xl mx-auto">
        <!-- Back button -->
      <button
        @click="router.push('/dashboard')"
        class="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 mb-6"
      >
        <ArrowLeftIcon class="h-4 w-4 mr-2" />
        Back to Dashboard
      </button>
        
        <h1 class="text-2xl font-bold text-gray-900 mb-8">Profile Settings</h1>
        
        <!-- Success/Error Messages -->
        <div v-if="saveMessage" class="mb-4 p-4 rounded-md bg-green-50 border border-green-200">
          <p class="text-sm text-green-800">{{ saveMessage }}</p>
        </div>
        
        <div v-if="saveError" class="mb-4 p-4 rounded-md bg-red-50 border border-red-200">
          <p class="text-sm text-red-800">{{ saveError }}</p>
        </div>
        
        <div class="bg-white shadow overflow-hidden sm:rounded-lg">
          <div class="px-4 py-5 sm:px-6">
            <h3 class="text-lg leading-6 font-medium text-gray-900">
              Account Information
            </h3>
            <p class="mt-1 max-w-2xl text-sm text-gray-500">
              Manage your account details and preferences.
            </p>
          </div>
          <div class="border-t border-gray-200">
            <dl>
              <div class="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt class="text-sm font-medium text-gray-500">
                  <UserIcon class="h-5 w-5 inline mr-2" />
                  Full name
                </dt>
                <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <div v-if="!isEditing">
                    {{ formData.full_name || 'Not set' }}
                  </div>
                  <input
                    v-else
                    v-model="formData.full_name"
                    type="text"
                    class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </dd>
              </div>
              <div class="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt class="text-sm font-medium text-gray-500">
                  <EnvelopeIcon class="h-5 w-5 inline mr-2" />
                  Email address
                </dt>
                <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {{ authStore.user?.email }}
                </dd>
              </div>
              <div class="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt class="text-sm font-medium text-gray-500">
                  Account created
                </dt>
                <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {{ new Date(authStore.user?.created_at).toLocaleDateString() }}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <div class="mt-6 flex justify-end space-x-3">
          <button
            v-if="!isEditing"
            @click="isEditing = true"
            class="inline-flex items-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            Edit Profile
          </button>
          <template v-else>
            <button
              @click="isEditing = false"
              class="inline-flex items-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              @click="handleUpdateProfile"
              :disabled="isSaving"
              class="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg v-if="isSaving" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ isSaving ? 'Saving...' : 'Save Changes' }}
            </button>
          </template>
        </div>

        <div class="mt-8">
          <div class="bg-white shadow overflow-hidden sm:rounded-lg">
            <div class="px-4 py-5 sm:px-6">
              <h3 class="text-lg leading-6 font-medium text-gray-900">
                Danger Zone
              </h3>
              <p class="mt-1 max-w-2xl text-sm text-gray-500">
                Irreversible actions for your account.
              </p>
            </div>
            <div class="border-t border-gray-200 px-4 py-5 sm:px-6">
              <button
                @click="handleSignOut"
                class="inline-flex items-center rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
