import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'

export const usePaymentMethodsStore = defineStore('paymentMethods', () => {
  // State
  const paymentMethods = ref([])
  const loading = ref(false)
  const error = ref(null)

  // Actions
  const fetchPaymentMethods = async () => {
    try {
      loading.value = true
      error.value = null

      const { data, error: fetchError } = await supabase
        .from('payment_methods')
        .select('*')
        .order('name')

      if (fetchError) throw fetchError

      paymentMethods.value = data || []
      return data
    } catch (err) {
      error.value = err?.message || 'Failed to fetch payment methods'
      console.error('Error fetching payment methods:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const createPaymentMethod = async (paymentMethodData) => {
    try {
      loading.value = true
      error.value = null

      const { data, error: insertError } = await supabase
        .from('payment_methods')
        .insert({
          name: paymentMethodData.name,
          description: paymentMethodData.description
        })
        .select()
        .single()

      if (insertError) {
        // Check if it's a duplicate key error
        if (insertError.code === '23505') {
          throw new Error('A payment method with this name already exists')
        }
        throw insertError
      }

      paymentMethods.value.push(data)
      return data
    } catch (err) {
      error.value = err?.message || 'Failed to create payment method'
      console.error('Error creating payment method:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const updatePaymentMethod = async (paymentMethodId, updates) => {
    try {
      loading.value = true
      error.value = null

      const { data, error: updateError } = await supabase
        .from('payment_methods')
        .update(updates)
        .eq('id', paymentMethodId)
        .select()
        .single()

      if (updateError) throw updateError

      const index = paymentMethods.value.findIndex(pm => pm.id === paymentMethodId)
      if (index !== -1) {
        paymentMethods.value[index] = data
      }
      return data
    } catch (err) {
      error.value = err?.message || 'Failed to update payment method'
      console.error('Error updating payment method:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const deletePaymentMethod = async (paymentMethodId) => {
    try {
      loading.value = true
      error.value = null

      const { error: deleteError } = await supabase
        .from('payment_methods')
        .delete()
        .eq('id', paymentMethodId)

      if (deleteError) throw deleteError

      paymentMethods.value = paymentMethods.value.filter(pm => pm.id !== paymentMethodId)
      return true
    } catch (err) {
      error.value = err?.message || 'Failed to delete payment method'
      console.error('Error deleting payment method:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Initialize with default payment methods if table is empty
  const initializeDefaultPaymentMethods = async () => {
    try {
      const { data: existingMethods } = await supabase
        .from('payment_methods')
        .select('count')

      if (existingMethods && existingMethods.length > 0) {
        return // Already has data, don't initialize
      }

      // Add default payment methods
      const defaultMethods = [
        { name: 'Cash', description: 'Physical cash payments' },
        { name: 'UPI', description: 'Unified Payments Interface' },
        { name: 'Debit Card', description: 'Bank debit card payments' },
        { name: 'Credit Card', description: 'Credit card payments' },
        { name: 'Net Banking', description: 'Online banking transfers' },
        { name: 'Cheque', description: 'Bank cheque payments' },
        { name: 'Paytm', description: 'Paytm wallet payments' },
        { name: 'PhonePe', description: 'PhonePe wallet payments' },
        { name: 'Google Pay', description: 'Google Pay wallet payments' },
        { name: 'Amazon Pay', description: 'Amazon Pay wallet payments' }
      ]

      for (const method of defaultMethods) {
        await createPaymentMethod(method)
      }
    } catch (err) {
      console.error('Error initializing default payment methods:', err)
    }
  }

  return {
    paymentMethods,
    loading,
    error,
    fetchPaymentMethods,
    createPaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod,
    initializeDefaultPaymentMethods
  }
})
