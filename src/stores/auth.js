import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const loading = ref(false)
  const error = ref(null)

  const isAuthenticated = computed(() => !!user.value)

  const setUser = (userData) => {
    user.value = userData
  }

  const setLoading = (isLoading) => {
    loading.value = isLoading
  }

  const setError = (errorMessage) => {
    error.value = errorMessage
  }

  const clearError = () => {
    error.value = null
  }

  const signUp = async (email, password) => {
    try {
      setLoading(true)
      clearError()
      
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password
      })

      if (signUpError) throw signUpError
      
      return data
    } catch (err) {
      setError(err?.message || 'Authentication error')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email, password) => {
    try {
      setLoading(true)
      clearError()
      
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (signInError) throw signInError
      
      // Set user immediately after successful login
      if (data.user) {
        setUser(data.user)
      }
      
      return data
    } catch (err) {
      setError(err?.message || 'Authentication error')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const signInWithOtp = async (email) => {
    try {
      setLoading(true)
      clearError()
      
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email
      })

      if (otpError) throw otpError
    } catch (err) {
      setError(err?.message || 'Authentication error')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      setLoading(true)
      clearError()
      
      const { error: signOutError } = await supabase.auth.signOut()
      
      if (signOutError) throw signOutError
      
      setUser(null)
    } catch (err) {
      setError(err?.message || 'Authentication error')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const resetPassword = async (email) => {
    try {
      setLoading(true)
      clearError()
      
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email)
      
      if (resetError) throw resetError
    } catch (err) {
      setError(err?.message || 'Authentication error')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const initializeAuth = async () => {
    try {
      setLoading(true)
      
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        setUser(session.user)
      }

      // Set up auth state change listener
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        console.log('Auth event:', event, 'Session:', session?.user?.id)
        if (session?.user) {
          setUser(session.user)
        } else {
          setUser(null)
        }
      })

      // Clean up subscription when needed
      return subscription
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return {
    user,
    loading,
    error,
    isAuthenticated,
    signUp,
    signIn,
    signInWithOtp,
    signOut,
    resetPassword,
    initializeAuth,
    clearError
  }
})
