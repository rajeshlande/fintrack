import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'

export const useGoalsStore = defineStore('goals', () => {
  // State
  const financialGoals = ref([])
  const loading = ref(false)
  const error = ref(null)

  // Actions
  const fetchFinancialGoals = async () => {
    try {
      loading.value = true
      error.value = null

      const { data, error: fetchError } = await supabase
        .from('financial_goals')
        .select(`
          *,
          category:categories(name, color, icon)
        `)
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .order('priority', { ascending: false })
        .order('target_date', { ascending: true })

      if (fetchError) throw fetchError

      financialGoals.value = data
      return data
    } catch (err) {
      error.value = err?.message || 'Failed to fetch financial goals'
      console.error('Error fetching financial goals:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const createFinancialGoal = async (goalData) => {
    try {
      loading.value = true
      error.value = null

      const { data, error: insertError } = await supabase
        .from('financial_goals')
        .insert({
          user_id: (await supabase.auth.getUser()).data.user?.id,
          title: goalData.title,
          description: goalData.description,
          target_amount: goalData.targetAmount,
          current_amount: goalData.currentAmount || 0,
          target_date: goalData.targetDate,
          category_id: goalData.categoryId,
          priority: goalData.priority || 'medium',
          status: 'active',
          auto_contribute: goalData.autoContribute || false,
          contribution_amount: goalData.contributionAmount || 0,
          contribution_frequency: goalData.contributionFrequency || 'monthly'
        })
        .select(`
          *,
          category:categories(name, color, icon)
        `)
        .single()

      if (insertError) throw insertError

      financialGoals.value.push(data)
      return data
    } catch (err) {
      error.value = err?.message || 'Failed to create financial goal'
      console.error('Error creating financial goal:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateFinancialGoal = async (goalId, updates) => {
    try {
      loading.value = true
      error.value = null

      const { data, error: updateError } = await supabase
        .from('financial_goals')
        .update(updates)
        .eq('id', goalId)
        .select(`
          *,
          category:categories(name, color, icon)
        `)
        .single()

      if (updateError) throw updateError

      const index = financialGoals.value.findIndex(goal => goal.id === goalId)
      if (index !== -1) {
        financialGoals.value[index] = data
      }
      return data
    } catch (err) {
      error.value = err?.message || 'Failed to update financial goal'
      console.error('Error updating financial goal:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteFinancialGoal = async (goalId) => {
    try {
      loading.value = true
      error.value = null

      const { error: deleteError } = await supabase
        .from('financial_goals')
        .delete()
        .eq('id', goalId)

      if (deleteError) throw deleteError

      financialGoals.value = financialGoals.value.filter(goal => goal.id !== goalId)
      return true
    } catch (err) {
      error.value = err?.message || 'Failed to delete financial goal'
      console.error('Error deleting financial goal:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateGoalProgress = async (goalId, additionalAmount) => {
    try {
      loading.value = true
      error.value = null

      // Get current goal
      const goal = financialGoals.value.find(g => g.id === goalId)
      if (!goal) throw new Error('Goal not found')

      const newCurrentAmount = goal.current_amount + additionalAmount

      const { data, error: updateError } = await supabase
        .from('financial_goals')
        .update({ current_amount: newCurrentAmount })
        .eq('id', goalId)
        .select(`
          *,
          category:categories(name, color, icon)
        `)
        .single()

      if (updateError) throw updateError

      const index = financialGoals.value.findIndex(g => g.id === goalId)
      if (index !== -1) {
        financialGoals.value[index] = data
      }
      return data
    } catch (err) {
      error.value = err?.message || 'Failed to update goal progress'
      console.error('Error updating goal progress:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const completeFinancialGoal = async (goalId) => {
    return await updateFinancialGoal(goalId, { 
      status: 'completed',
      current_amount: financialGoals.value.find(g => g.id === goalId)?.target_amount
    })
  }

  const pauseFinancialGoal = async (goalId) => {
    return await updateFinancialGoal(goalId, { status: 'paused' })
  }

  const activateFinancialGoal = async (goalId) => {
    return await updateFinancialGoal(goalId, { status: 'active' })
  }

  const getGoalById = (goalId) => {
    return financialGoals.value.find(goal => goal.id === goalId)
  }

  const getActiveGoals = computed(() => {
    return financialGoals.value.filter(goal => goal.status === 'active')
  })

  const getCompletedGoals = computed(() => {
    return financialGoals.value.filter(goal => goal.status === 'completed')
  })

  const getPausedGoals = computed(() => {
    return financialGoals.value.filter(goal => goal.status === 'paused')
  })

  const getHighPriorityGoals = computed(() => {
    return financialGoals.value.filter(goal => goal.priority === 'high' && goal.status === 'active')
  })

  const getGoalsByPriority = computed(() => {
    const grouped = { high: [], medium: [], low: [] }
    financialGoals.value.forEach(goal => {
      if (grouped[goal.priority]) {
        grouped[goal.priority].push(goal)
      }
    })
    return grouped
  })

  const getGoalsByStatus = computed(() => {
    const grouped = { active: [], completed: [], paused: [], cancelled: [] }
    financialGoals.value.forEach(goal => {
      if (grouped[goal.status]) {
        grouped[goal.status].push(goal)
      }
    })
    return grouped
  })

  const getTotalTargetAmount = computed(() => {
    return financialGoals.value
      .filter(goal => goal.status === 'active')
      .reduce((sum, goal) => sum + goal.target_amount, 0)
  })

  const getTotalCurrentAmount = computed(() => {
    return financialGoals.value
      .filter(goal => goal.status === 'active')
      .reduce((sum, goal) => sum + goal.current_amount, 0)
  })

  const getTotalProgress = computed(() => {
    const totalTarget = getTotalTargetAmount.value
    const totalCurrent = getTotalCurrentAmount.value
    return totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0
  })

  const getOverdueGoals = computed(() => {
    const today = new Date()
    return financialGoals.value.filter(goal => 
      goal.status === 'active' && 
      new Date(goal.target_date) < today
    )
  })

  const getGoalsDueSoon = computed(() => {
    const today = new Date()
    const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
    return financialGoals.value.filter(goal => 
      goal.status === 'active' && 
      new Date(goal.target_date) >= today &&
      new Date(goal.target_date) <= thirtyDaysFromNow
    )
  })

  const getGoalSummary = computed(() => {
    const active = getActiveGoals.value.length
    const completed = getCompletedGoals.value.length
    const paused = getPausedGoals.value.length
    const overdue = getOverdueGoals.value.length
    const dueSoon = getGoalsDueSoon.value.length

    return {
      total: financialGoals.value.length,
      active,
      completed,
      paused,
      overdue,
      dueSoon,
      totalProgress: getTotalProgress.value,
      totalTarget: getTotalTargetAmount.value,
      totalCurrent: getTotalCurrentAmount.value
    }
  })

  return {
    // State
    financialGoals,
    loading,
    error,

    // Actions
    fetchFinancialGoals,
    createFinancialGoal,
    updateFinancialGoal,
    deleteFinancialGoal,
    updateGoalProgress,
    completeFinancialGoal,
    pauseFinancialGoal,
    activateFinancialGoal,
    getGoalById,

    // Computed
    getActiveGoals,
    getCompletedGoals,
    getPausedGoals,
    getHighPriorityGoals,
    getGoalsByPriority,
    getGoalsByStatus,
    getTotalTargetAmount,
    getTotalCurrentAmount,
    getTotalProgress,
    getOverdueGoals,
    getGoalsDueSoon,
    getGoalSummary
  }
})
