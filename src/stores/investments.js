import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'

export const useInvestmentsStore = defineStore('investments', () => {
  // State
  const investments = ref([])
  const loading = ref(false)
  const error = ref(null)

  // Actions
  const fetchInvestments = async () => {
    try {
      loading.value = true
      error.value = null

      const { data, error: fetchError } = await supabase
        .from('investments')
        .select(`
          *,
          portfolio_percentage
        `)
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      // Calculate portfolio percentages
      const totalValue = data.reduce((sum, inv) => sum + inv.current_value, 0)
      const investmentsWithPercentage = data.map(inv => ({
        ...inv,
        portfolio_percentage: totalValue > 0 ? (inv.current_value / totalValue) * 100 : 0
      }))

      investments.value = investmentsWithPercentage
      return investmentsWithPercentage
    } catch (err) {
      error.value = err?.message || 'Failed to fetch investments'
      console.error('Error fetching investments:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const createInvestment = async (investmentData) => {
    try {
      loading.value = true
      error.value = null

      const { data, error: insertError } = await supabase
        .from('investments')
        .insert({
          user_id: (await supabase.auth.getUser()).data.user?.id,
          name: investmentData.name,
          type: investmentData.type,
          provider: investmentData.provider,
          initial_amount: investmentData.initialAmount,
          current_value: investmentData.currentValue || investmentData.initialAmount,
          purchase_date: investmentData.purchaseDate,
          maturity_date: investmentData.maturityDate,
          interest_rate: investmentData.interestRate,
          is_active: investmentData.isActive ?? true,
          notes: investmentData.notes
        })
        .select()
        .single()

      if (insertError) throw insertError

      investments.value.unshift(data)
      return data
    } catch (err) {
      error.value = err?.message || 'Failed to create investment'
      console.error('Error creating investment:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateInvestment = async (investmentId, updates) => {
    try {
      loading.value = true
      error.value = null

      const { data, error: updateError } = await supabase
        .from('investments')
        .update(updates)
        .eq('id', investmentId)
        .select()
        .single()

      if (updateError) throw updateError

      const index = investments.value.findIndex(inv => inv.id === investmentId)
      if (index !== -1) {
        investments.value[index] = data
      }
      return data
    } catch (err) {
      error.value = err?.message || 'Failed to update investment'
      console.error('Error updating investment:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteInvestment = async (investmentId) => {
    try {
      loading.value = true
      error.value = null

      const { error: deleteError } = await supabase
        .from('investments')
        .delete()
        .eq('id', investmentId)

      if (deleteError) throw deleteError

      investments.value = investments.value.filter(inv => inv.id !== investmentId)
      return true
    } catch (err) {
      error.value = err?.message || 'Failed to delete investment'
      console.error('Error deleting investment:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateInvestmentValue = async (investmentId, newValue) => {
    try {
      loading.value = true
      error.value = null

      const { data, error: updateError } = await supabase
        .from('investments')
        .update({ current_value: newValue })
        .eq('id', investmentId)
        .select()
        .single()

      if (updateError) throw updateError

      const index = investments.value.findIndex(inv => inv.id === investmentId)
      if (index !== -1) {
        investments.value[index] = data
      }
      return data
    } catch (err) {
      error.value = err?.message || 'Failed to update investment value'
      console.error('Error updating investment value:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const getInvestmentById = (investmentId) => {
    return investments.value.find(inv => inv.id === investmentId)
  }

  const getActiveInvestments = computed(() => {
    return investments.value.filter(inv => inv.is_active)
  })

  const getInvestmentsByType = computed(() => {
    const grouped = {}
    investments.value.forEach(inv => {
      if (!grouped[inv.type]) {
        grouped[inv.type] = []
      }
      grouped[inv.type].push(inv)
    })
    return grouped
  })

  const getTotalInvestmentValue = computed(() => {
    return investments.value.reduce((sum, inv) => sum + inv.current_value, 0)
  })

  const getTotalInitialInvestment = computed(() => {
    return investments.value.reduce((sum, inv) => sum + inv.initial_amount, 0)
  })

  const getTotalReturns = computed(() => {
    return getTotalInvestmentValue.value - getTotalInitialInvestment.value
  })

  const getPerformanceSummary = computed(() => {
    const active = investments.value.filter(inv => inv.is_active)
    const profitable = active.filter(inv => inv.returns_amount > 0)
    const losing = active.filter(inv => inv.returns_amount < 0)
    
    return {
      totalInvestments: active.length,
      profitable: profitable.length,
      losing: losing.length,
      totalReturns: getTotalReturns.value,
      returnPercentage: getTotalInitialInvestment.value > 0 
        ? (getTotalReturns.value / getTotalInitialInvestment.value) * 100 
        : 0
    }
  })

  return {
    // State
    investments,
    loading,
    error,

    // Actions
    fetchInvestments,
    createInvestment,
    updateInvestment,
    deleteInvestment,
    updateInvestmentValue,
    getInvestmentById,

    // Computed
    getActiveInvestments,
    getInvestmentsByType,
    getTotalInvestmentValue,
    getTotalInitialInvestment,
    getTotalReturns,
    getPerformanceSummary
  }
})
