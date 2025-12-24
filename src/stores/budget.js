import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from './auth'

export const useBudgetStore = defineStore('budget', () => {
  const authStore = useAuthStore()
  
  // State
  const monthlyBudgets = ref([])
  const annualBudgets = ref([])
  const financialGoals = ref([])
  const investments = ref([])
  const savingsRecommendations = ref([])
  const budgetPerformance = ref([])
  const loading = ref(false)
  const error = ref(null)

  // Financial year helper (April-March)
  const getFinancialYear = (date = new Date()) => {
    const month = date.getMonth() + 1 // JavaScript months are 0-indexed
    const year = date.getFullYear()
    return month >= 4 ? year : year - 1
  }

  const getCurrentFinancialYear = () => getFinancialYear()

  // Monthly Budget Management
  const createMonthlyBudget = async (budgetData) => {
    try {
      loading.value = true
      error.value = null

      const { data, error: insertError } = await supabase
        .from('monthly_budgets')
        .insert({
          user_id: authStore.user.id,
          year: budgetData.financialYear || getCurrentFinancialYear(),
          month: budgetData.month,
          category_id: budgetData.categoryId,
          budget_amount: budgetData.budgetAmount,
          notes: budgetData.notes || null
        })
        .select()
        .single()

      if (insertError) throw insertError

      monthlyBudgets.value.push(data)
      return data
    } catch (err) {
      error.value = err?.message || 'An error occurred'
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchMonthlyBudgets = async (financialYear = null) => {
    try {
      loading.value = true
      error.value = null

      const year = financialYear || getCurrentFinancialYear()

      const { data, error: fetchError } = await supabase
        .from('monthly_budgets')
        .select(`
          *,
          categories (
            id,
            name,
            icon,
            type
          )
        `)
        .eq('user_id', authStore.user.id)
        .eq('year', year)
        .order('month', { ascending: true })

      if (fetchError) throw fetchError

      monthlyBudgets.value = data || []
      return data
    } catch (err) {
      error.value = err?.message || 'An error occurred'
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateMonthlyBudget = async (budgetId, updates) => {
    try {
      loading.value = true
      error.value = null

      const { data, error: updateError } = await supabase
        .from('monthly_budgets')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', budgetId)
        .eq('user_id', authStore.user.id)
        .select()
        .single()

      if (updateError) throw updateError

      const index = monthlyBudgets.value.findIndex(b => b.id === budgetId)
      if (index !== -1) {
        monthlyBudgets.value[index] = data
      }

      return data
    } catch (err) {
      error.value = err?.message || 'An error occurred'
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteMonthlyBudget = async (budgetId) => {
    try {
      loading.value = true
      error.value = null

      const { error: deleteError } = await supabase
        .from('monthly_budgets')
        .delete()
        .eq('id', budgetId)
        .eq('user_id', authStore.user.id)

      if (deleteError) throw deleteError

      monthlyBudgets.value = monthlyBudgets.value.filter(b => b.id !== budgetId)
      return true
    } catch (err) {
      error.value = err?.message || 'An error occurred'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Annual Budget Management
  const createAnnualBudget = async (budgetData) => {
    try {
      loading.value = true
      error.value = null

      const { data, error: insertError } = await supabase
        .from('annual_budgets')
        .insert({
          user_id: authStore.user.id,
          financial_year: budgetData.financialYear || getCurrentFinancialYear(),
          category_id: budgetData.categoryId,
          budget_amount: budgetData.annualAmount
        })
        .select()
        .single()

      if (insertError) throw insertError

      annualBudgets.value.push(data)
      return data
    } catch (err) {
      error.value = err?.message || 'An error occurred'
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchAnnualBudgets = async (financialYear = null) => {
    try {
      loading.value = true
      error.value = null

      const year = financialYear || getCurrentFinancialYear()

      const { data, error: fetchError } = await supabase
        .from('annual_budgets')
        .select(`
          *,
          categories (
            id,
            name,
            icon,
            type
          )
        `)
        .eq('user_id', authStore.user.id)
        .eq('financial_year', year)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      annualBudgets.value = data || []
      return data
    } catch (err) {
      error.value = err?.message || 'An error occurred'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Financial Goals Management
  const createFinancialGoal = async (goalData) => {
    try {
      loading.value = true
      error.value = null

      const { data, error: insertError } = await supabase
        .from('financial_goals')
        .insert({
          user_id: authStore.user.id,
          title: goalData.title,
          description: goalData.description,
          target_amount: goalData.targetAmount,
          current_amount: goalData.currentAmount || 0,
          target_date: goalData.targetDate,
          priority: goalData.priority || 'medium',
          auto_contribute: goalData.autoContribute || false,
          contribution_amount: goalData.contributionAmount || 0,
          contribution_frequency: goalData.contributionFrequency || 'monthly'
        })
        .select()
        .single()

      if (insertError) throw insertError

      financialGoals.value.push(data)
      return data
    } catch (err) {
      error.value = err?.message || 'An error occurred'
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchFinancialGoals = async () => {
    try {
      loading.value = true
      error.value = null

      const { data, error: fetchError } = await supabase
        .from('financial_goals')
        .select('*')
        .eq('user_id', authStore.user.id)
        .eq('status', 'active')
        .order('target_date', { ascending: true })

      if (fetchError) throw fetchError

      financialGoals.value = data || []
      return data
    } catch (err) {
      error.value = err?.message || 'An error occurred'
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
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', goalId)
        .eq('user_id', authStore.user.id)
        .select()
        .single()

      if (updateError) throw updateError

      const index = financialGoals.value.findIndex(g => g.id === goalId)
      if (index !== -1) {
        financialGoals.value[index] = data
      }

      return data
    } catch (err) {
      error.value = err?.message || 'An error occurred'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Investment Management
  const createInvestment = async (investmentData) => {
    try {
      loading.value = true
      error.value = null

      const { data, error: insertError } = await supabase
        .from('investments')
        .insert({
          user_id: authStore.user.id,
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

      investments.value.push(data)
      return data
    } catch (err) {
      error.value = err?.message || 'An error occurred'
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchInvestments = async () => {
    try {
      loading.value = true
      error.value = null

      const { data, error: fetchError } = await supabase
        .from('investments')
        .select('*')
        .eq('user_id', authStore.user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      investments.value = data || []
      return data
    } catch (err) {
      error.value = err?.message || 'An error occurred'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Budget Performance Analysis
  const fetchBudgetPerformance = async (financialYear = null, month = null) => {
    try {
      loading.value = true
      error.value = null

      const year = financialYear || getCurrentFinancialYear()
      let query = supabase
        .from('budget_performance')
        .select('*')
        .eq('user_id', authStore.user.id)
        .eq('financial_year', year)
        .eq('period_type', 'monthly')

      if (month) {
        query = query.eq('period_value', month)
      }

      const { data, error: fetchError } = await query.order('period_value', { ascending: true })

      if (fetchError) throw fetchError

      budgetPerformance.value = data || []
      return data
    } catch (err) {
      error.value = err?.message || 'An error occurred'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Savings Recommendations Generation
  const generateSavingsRecommendations = async (monthlyIncome, monthlyExpenses, riskProfile = 'moderate') => {
    try {
      loading.value = true
      error.value = null

      const monthlySurplus = monthlyIncome - monthlyExpenses
      const recommendations = generateAllocationRecommendations(monthlySurplus, riskProfile)

      const { data, error: insertError } = await supabase
        .from('savings_recommendations')
        .insert({
          user_id: authStore.user.id,
          title: 'Savings Recommendations',
          description: `Recommendations based on ${riskProfile} risk profile`,
          recommended_amount: monthlySurplus,
          priority: 'medium',
          category: 'general',
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        })
        .select()
        .single()

      if (insertError) throw insertError

      savingsRecommendations.value.unshift(data)
      return data
    } catch (err) {
      error.value = err?.message || 'An error occurred'
      throw err
    } finally {
      loading.value = false
    }
  }

  const generateAllocationRecommendations = (surplus, riskProfile) => {
    const recommendations = []

    if (surplus <= 0) {
      return [{
        type: 'emergency_fund',
        percentage: 0,
        amount: 0,
        description: 'No surplus available for investment. Focus on reducing expenses.'
      }]
    }

    const allocations = {
      conservative: {
        emergency_fund: 40,
        fd: 30,
        rd: 20,
        debt_mf: 10,
        equity_mf: 0,
        stock: 0
      },
      moderate: {
        emergency_fund: 20,
        fd: 20,
        rd: 15,
        debt_mf: 25,
        equity_mf: 15,
        stock: 5
      },
      aggressive: {
        emergency_fund: 10,
        fd: 10,
        rd: 10,
        debt_mf: 20,
        equity_mf: 35,
        stock: 15
      }
    }

    const profileAllocations = allocations[riskProfile] || allocations.moderate

    Object.entries(profileAllocations).forEach(([type, percentage]) => {
      if (percentage > 0) {
        recommendations.push({
          type,
          percentage,
          amount: Math.round(surplus * percentage / 100),
          description: getInvestmentDescription(type)
        })
      }
    })

    return recommendations
  }

  const getInvestmentDescription = (type) => {
    const descriptions = {
      emergency_fund: 'Emergency fund for unexpected expenses (3-6 months of expenses)',
      fd: 'Fixed Deposit - Safe investment with guaranteed returns',
      rd: 'Recurring Deposit - Monthly savings with fixed returns',
      debt_mf: 'Debt Mutual Funds - Lower risk, stable returns',
      equity_mf: 'Equity Mutual Funds - Higher risk, higher potential returns',
      stock: 'Direct Stocks - High risk, high return potential'
    }
    return descriptions[type] || 'Investment option'
  }

  const generateExplanation = (recommendations, riskProfile) => {
    const riskDescriptions = {
      conservative: 'Conservative approach focusing on capital preservation with stable returns',
      moderate: 'Balanced approach mixing safety and growth potential',
      aggressive: 'Growth-focused approach with higher risk for potentially higher returns'
    }

    return `Based on your ${riskProfile} risk profile: ${riskDescriptions[riskProfile]}. 
    The recommendations above allocate your monthly surplus across different investment types 
    to balance risk and return according to your preferences.`
  }

  // Computed properties
  const totalMonthlyBudget = computed(() => {
    return monthlyBudgets.value.reduce((total, budget) => total + budget.budget_amount, 0)
  })

  const totalAnnualBudget = computed(() => {
    return annualBudgets.value.reduce((total, budget) => total + budget.budget_amount, 0)
  })

  const totalGoalsTarget = computed(() => {
    return financialGoals.value.reduce((total, goal) => total + goal.target_amount, 0)
  })

  const totalGoalsCurrent = computed(() => {
    return financialGoals.value.reduce((total, goal) => total + goal.current_amount, 0)
  })

  const totalInvestmentValue = computed(() => {
    return investments.value.reduce((total, investment) => total + investment.current_value, 0)
  })

  const goalsProgress = computed(() => {
    return financialGoals.value.map(goal => ({
      ...goal,
      progress_percentage: goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0
    }))
  })

  const budgetUtilization = computed(() => {
    return budgetPerformance.value.map(performance => ({
      ...performance,
      utilization_percentage: performance.total_expense > 0 ? (performance.total_expense / (performance.total_income || 1)) * 100 : 0,
      status: getBudgetStatus(performance.total_expense > 0 ? (performance.total_expense / (performance.total_income || 1)) * 100 : 0)
    }))
  })

  const getBudgetStatus = (utilizationPercentage) => {
    if (utilizationPercentage >= 100) return 'over_budget'
    if (utilizationPercentage >= 80) return 'warning'
    if (utilizationPercentage >= 0) return 'on_track'
    return 'under_budget'
  }

  // Clear error
  const clearError = () => {
    error.value = null
  }

  // Optimized methods using new database views and functions
  const fetchBudgetSummary = async (month, year) => {
    loading.value = true
    error.value = null
    
    try {
      const { data, error: fetchError } = await supabase
        .from('budget_summary')
        .select('*')
        .eq('user_id', authStore.user.id)
        .eq('month', month)
        .eq('year', year)
      
      if (fetchError) throw fetchError
      
      return data || []
    } catch (err) {
      error.value = err.message
      console.error('Error fetching budget summary:', err)
      return []
    } finally {
      loading.value = false
    }
  }

  const fetchGoalProgress = async () => {
    loading.value = true
    error.value = null
    
    try {
      const { data, error: fetchError } = await supabase
        .from('goal_progress_view')
        .select('*')
        .eq('user_id', authStore.user.id)
        .order('target_date', { ascending: true })
      
      if (fetchError) throw fetchError
      
      financialGoals.value = data || []
      return data
    } catch (err) {
      error.value = err.message
      console.error('Error fetching goal progress:', err)
      return []
    } finally {
      loading.value = false
    }
  }

  const fetchInvestmentPortfolio = async () => {
    loading.value = true
    error.value = null
    
    try {
      const { data, error: fetchError } = await supabase
        .from('investment_portfolio')
        .select('*')
        .eq('user_id', authStore.user.id)
        .order('purchase_date', { ascending: false })
      
      if (fetchError) throw fetchError
      
      investments.value = data || []
      return data
    } catch (err) {
      error.value = err.message
      console.error('Error fetching investment portfolio:', err)
      return []
    } finally {
      loading.value = false
    }
  }

  const getOptimizedBudgetPerformance = async (periodType, periodValue, financialYear) => {
    try {
      const { data, error } = await supabase
        .from('budget_performance')
        .select('*')
        .eq('user_id', authStore.user.id)
        .eq('period_type', periodType)
        .eq('period_value', periodValue)
        .eq('financial_year', financialYear)
        .single()
      
      if (error) throw error
      
      return data
    } catch (err) {
      console.error('Error getting budget performance:', err)
      return null
    }
  }

  return {
    // State
    monthlyBudgets,
    annualBudgets,
    financialGoals,
    investments,
    savingsRecommendations,
    budgetPerformance,
    loading,
    error,

    // Actions
    createMonthlyBudget,
    fetchMonthlyBudgets,
    updateMonthlyBudget,
    deleteMonthlyBudget,
    createAnnualBudget,
    fetchAnnualBudgets,
    createFinancialGoal,
    fetchFinancialGoals,
    updateFinancialGoal,
    createInvestment,
    fetchInvestments,
    fetchBudgetPerformance,
    generateSavingsRecommendations,

    // Computed
    totalMonthlyBudget,
    totalAnnualBudget,
    totalGoalsTarget,
    totalGoalsCurrent,
    totalInvestmentValue,
    goalsProgress,
    budgetUtilization,

    // Helpers
    getFinancialYear,
    getCurrentFinancialYear,
    clearError,
    
    // Optimized methods
    fetchBudgetSummary,
    fetchGoalProgress,
    fetchInvestmentPortfolio,
    getOptimizedBudgetPerformance
  }
})
