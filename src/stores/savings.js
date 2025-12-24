import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'

export const useSavingsStore = defineStore('savings', () => {
  // State
  const savingsRecommendations = ref([])
  const loading = ref(false)
  const error = ref(null)

  // Actions
  const fetchSavingsRecommendations = async () => {
    try {
      loading.value = true
      error.value = null

      const { data, error: fetchError } = await supabase
        .from('savings_recommendations')
        .select('*')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      savingsRecommendations.value = data
      return data
    } catch (err) {
      error.value = err?.message || 'Failed to fetch savings recommendations'
      console.error('Error fetching savings recommendations:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const createSavingsRecommendation = async (recommendationData) => {
    try {
      loading.value = true
      error.value = null

      const { data, error: insertError } = await supabase
        .from('savings_recommendations')
        .insert({
          user_id: (await supabase.auth.getUser()).data.user?.id,
          title: recommendationData.title,
          description: recommendationData.description,
          recommended_amount: recommendationData.recommendedAmount,
          priority: recommendationData.priority || 'medium',
          category: recommendationData.category,
          expires_at: recommendationData.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        })
        .select()
        .single()

      if (insertError) throw insertError

      savingsRecommendations.value.unshift(data)
      return data
    } catch (err) {
      error.value = err?.message || 'Failed to create savings recommendation'
      console.error('Error creating savings recommendation:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateSavingsRecommendation = async (recommendationId, updates) => {
    try {
      loading.value = true
      error.value = null

      const { data, error: updateError } = await supabase
        .from('savings_recommendations')
        .update(updates)
        .eq('id', recommendationId)
        .select()
        .single()

      if (updateError) throw updateError

      const index = savingsRecommendations.value.findIndex(rec => rec.id === recommendationId)
      if (index !== -1) {
        savingsRecommendations.value[index] = data
      }
      return data
    } catch (err) {
      error.value = err?.message || 'Failed to update savings recommendation'
      console.error('Error updating savings recommendation:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteSavingsRecommendation = async (recommendationId) => {
    try {
      loading.value = true
      error.value = null

      const { error: deleteError } = await supabase
        .from('savings_recommendations')
        .delete()
        .eq('id', recommendationId)

      if (deleteError) throw deleteError

      savingsRecommendations.value = savingsRecommendations.value.filter(rec => rec.id !== recommendationId)
      return true
    } catch (err) {
      error.value = err?.message || 'Failed to delete savings recommendation'
      console.error('Error deleting savings recommendation:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const acceptSavingsRecommendation = async (recommendationId) => {
    return await updateSavingsRecommendation(recommendationId, { is_accepted: true })
  }

  const completeSavingsRecommendation = async (recommendationId) => {
    return await updateSavingsRecommendation(recommendationId, { 
      is_accepted: true, 
      is_completed: true 
    })
  }

  const generateSavingsRecommendations = async (monthlyIncome, monthlyExpenses, riskProfile = 'moderate') => {
    try {
      loading.value = true
      error.value = null

      const monthlySurplus = monthlyIncome - monthlyExpenses
      const recommendations = []

      // Emergency fund recommendation
      if (monthlySurplus > 0) {
        recommendations.push({
          title: 'Emergency Fund',
          description: `Build an emergency fund covering 6 months of expenses based on ${riskProfile} risk profile`,
          recommendedAmount: monthlySurplus * 0.3,
          priority: 'high',
          category: 'emergency_fund'
        })
      }

      // Retirement recommendation
      if (monthlySurplus > 1000) {
        recommendations.push({
          title: 'Retirement Savings',
          description: `Contribute to retirement fund based on ${riskProfile} risk profile`,
          recommendedAmount: monthlySurplus * 0.25,
          priority: 'medium',
          category: 'retirement'
        })
      }

      // Investment recommendation
      if (monthlySurplus > 500) {
        recommendations.push({
          title: 'Investment Portfolio',
          description: `Diversify investment portfolio based on ${riskProfile} risk profile`,
          recommendedAmount: monthlySurplus * 0.2,
          priority: 'medium',
          category: 'investment'
        })
      }

      // Create recommendations in database
      for (const rec of recommendations) {
        await createSavingsRecommendation(rec)
      }

      return recommendations
    } catch (err) {
      error.value = err?.message || 'Failed to generate savings recommendations'
      console.error('Error generating savings recommendations:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const getRecommendationById = (recommendationId) => {
    return savingsRecommendations.value.find(rec => rec.id === recommendationId)
  }

  const getActiveRecommendations = computed(() => {
    return savingsRecommendations.value.filter(rec => !rec.is_completed)
  })

  const getAcceptedRecommendations = computed(() => {
    return savingsRecommendations.value.filter(rec => rec.is_accepted)
  })

  const getCompletedRecommendations = computed(() => {
    return savingsRecommendations.value.filter(rec => rec.is_completed)
  })

  const getHighPriorityRecommendations = computed(() => {
    return savingsRecommendations.value.filter(rec => rec.priority === 'high' && !rec.is_completed)
  })

  const getTotalRecommendedAmount = computed(() => {
    return savingsRecommendations.value
      .filter(rec => !rec.is_completed)
      .reduce((sum, rec) => sum + rec.recommended_amount, 0)
  })

  const getRecommendationsByCategory = computed(() => {
    const grouped = {}
    savingsRecommendations.value.forEach(rec => {
      if (!grouped[rec.category]) {
        grouped[rec.category] = []
      }
      grouped[rec.category].push(rec)
    })
    return grouped
  })

  return {
    // State
    savingsRecommendations,
    loading,
    error,

    // Actions
    fetchSavingsRecommendations,
    createSavingsRecommendation,
    updateSavingsRecommendation,
    deleteSavingsRecommendation,
    acceptSavingsRecommendation,
    completeSavingsRecommendation,
    generateSavingsRecommendations,
    getRecommendationById,

    // Computed
    getActiveRecommendations,
    getAcceptedRecommendations,
    getCompletedRecommendations,
    getHighPriorityRecommendations,
    getTotalRecommendedAmount,
    getRecommendationsByCategory
  }
})
