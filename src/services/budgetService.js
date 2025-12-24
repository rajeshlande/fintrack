import { supabase } from '@/lib/supabase'

// Budget API Service
export const budgetService = {
  // Monthly Budget APIs
  async getMonthlyBudgets(userId, financialYear) {
    const { data, error } = await supabase
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
      .eq('user_id', userId)
      .eq('financial_year', financialYear)
      .order('month', { ascending: true })

    if (error) throw error
    return data
  },

  async createMonthlyBudget(budgetData) {
    const { data, error } = await supabase
      .from('monthly_budgets')
      .insert(budgetData)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async updateMonthlyBudget(budgetId, updates) {
    const { data, error } = await supabase
      .from('monthly_budgets')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', budgetId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async deleteMonthlyBudget(budgetId) {
    const { error } = await supabase
      .from('monthly_budgets')
      .delete()
      .eq('id', budgetId)

    if (error) throw error
    return true
  },

  // Annual Budget APIs
  async getAnnualBudgets(userId, financialYear) {
    const { data, error } = await supabase
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
      .eq('user_id', userId)
      .eq('financial_year', financialYear)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },

  async createAnnualBudget(budgetData) {
    const { data, error } = await supabase
      .from('annual_budgets')
      .insert(budgetData)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Budget Performance APIs
  async getBudgetPerformance(userId, financialYear, month = null) {
    let query = supabase
      .from('budget_performance')
      .select(`
        *,
        categories (
          id,
          name,
          icon,
          type
        )
      `)
      .eq('user_id', userId)
      .eq('financial_year', financialYear)

    if (month) {
      query = query.eq('month', month)
    }

    const { data, error } = await query.order('month', { ascending: true })

    if (error) throw error
    return data
  },

  async updateBudgetPerformance(performanceData) {
    const { data, error } = await supabase
      .from('budget_performance')
      .upsert(performanceData, {
        onConflict: 'user_id,category_id,financial_year,month'
      })
      .select()

    if (error) throw error
    return data
  },

  // Financial Year Summary
  async getFinancialYearSummary(userId, financialYear) {
    const { data, error } = await supabase
      .rpc('get_financial_year_summary', {
        p_user_id: userId,
        p_financial_year: financialYear
      })

    if (error) throw error
    return data
  },

  // Category-wise Budget Analysis
  async getCategoryBudgetAnalysis(userId, financialYear, categoryId) {
    const { data, error } = await supabase
      .rpc('get_category_budget_analysis', {
        p_user_id: userId,
        p_financial_year: financialYear,
        p_category_id: categoryId
      })

    if (error) throw error
    return data
  },

  // Budget vs Actual Charts Data
  async getBudgetVsActualChartData(userId, financialYear) {
    const { data, error } = await supabase
      .rpc('get_budget_vs_actual_chart_data', {
        p_user_id: userId,
        p_financial_year: financialYear
      })

    if (error) throw error
    return data
  }
}

// Goals API Service
export const goalsService = {
  async getFinancialGoals(userId, activeOnly = true) {
    let query = supabase
      .from('financial_goals')
      .select('*')
      .eq('user_id', userId)

    if (activeOnly) {
      query = query.eq('is_active', true)
    }

    const { data, error } = await query.order('target_date', { ascending: true })

    if (error) throw error
    return data
  },

  async createFinancialGoal(goalData) {
    const { data, error } = await supabase
      .from('financial_goals')
      .insert(goalData)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async updateFinancialGoal(goalId, updates) {
    const { data, error } = await supabase
      .from('financial_goals')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', goalId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async deleteFinancialGoal(goalId) {
    const { error } = await supabase
      .from('financial_goals')
      .delete()
      .eq('id', goalId)

    if (error) throw error
    return true
  },

  async getGoalProgress(userId) {
    const { data, error } = await supabase
      .rpc('get_goal_progress_summary', {
        p_user_id: userId
      })

    if (error) throw error
    return data
  }
}

// Investments API Service
export const investmentsService = {
  async getInvestments(userId, activeOnly = true) {
    let query = supabase
      .from('investments')
      .select(`
        *,
        financial_goals (
          id,
          title,
          goal_type
        )
      `)
      .eq('user_id', userId)

    if (activeOnly) {
      query = query.eq('status', 'active')
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) throw error
    return data
  },

  async createInvestment(investmentData) {
    const { data, error } = await supabase
      .from('investments')
      .insert(investmentData)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async updateInvestment(investmentId, updates) {
    const { data, error } = await supabase
      .from('investments')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', investmentId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async deleteInvestment(investmentId) {
    const { error } = await supabase
      .from('investments')
      .delete()
      .eq('id', investmentId)

    if (error) throw error
    return true
  },

  async getInvestmentSummary(userId) {
    const { data, error } = await supabase
      .rpc('get_investment_summary', {
        p_user_id: userId
      })

    if (error) throw error
    return data
  },

  async getInvestmentPerformance(userId) {
    const { data, error } = await supabase
      .rpc('get_investment_performance', {
        p_user_id: userId
      })

    if (error) throw error
    return data
  }
}

// Savings Recommendations API Service
export const savingsService = {
  async getSavingsRecommendations(userId, limit = 10) {
    const { data, error } = await supabase
      .from('savings_recommendations')
      .select('*')
      .eq('user_id', userId)
      .order('recommendation_date', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data
  },

  async createSavingsRecommendation(recommendationData) {
    const { data, error } = await supabase
      .from('savings_recommendations')
      .insert(recommendationData)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async updateRecommendationFeedback(recommendationId, feedback) {
    const { data, error } = await supabase
      .from('savings_recommendations')
      .update({
        user_feedback: feedback,
        updated_at: new Date().toISOString()
      })
      .eq('id', recommendationId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async generateRecommendations(userId, monthlyIncome, monthlyExpenses, riskProfile) {
    const { data, error } = await supabase
      .rpc('generate_savings_recommendations', {
        p_user_id: userId,
        p_monthly_income: monthlyIncome,
        p_monthly_expenses: monthlyExpenses,
        p_risk_profile: riskProfile
      })

    if (error) throw error
    return data
  }
}

// Analytics API Service
export const analyticsService = {
  async getDashboardAnalytics(userId, financialYear) {
    const { data, error } = await supabase
      .rpc('get_dashboard_analytics', {
        p_user_id: userId,
        p_financial_year: financialYear
      })

    if (error) throw error
    return data
  },

  async getSpendingTrends(userId, months = 12) {
    const { data, error } = await supabase
      .rpc('get_spending_trends', {
        p_user_id: userId,
        p_months: months
      })

    if (error) throw error
    return data
  },

  async getCategorySpendingBreakdown(userId, financialYear) {
    const { data, error } = await supabase
      .rpc('get_category_spending_breakdown', {
        p_user_id: userId,
        p_financial_year: financialYear
      })

    if (error) throw error
    return data
  },

  async getSavingsRateAnalysis(userId, financialYear) {
    const { data, error } = await supabase
      .rpc('get_savings_rate_analysis', {
        p_user_id: userId,
        p_financial_year: financialYear
      })

    if (error) throw error
    return data
  }
}

// Categories API Service
export const categoriesService = {
  async getCategories(type = null) {
    let query = supabase
      .from('categories')
      .select('*')
      .eq('is_default', true)

    if (type) {
      query = query.eq('type', type)
    }

    const { data, error } = await query.order('name', { ascending: true })

    if (error) throw error
    return data
  },

  async getUserCategories(userId) {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', userId)
      .order('name', { ascending: true })

    if (error) throw error
    return data
  },

  async createCategory(categoryData) {
    const { data, error } = await supabase
      .from('categories')
      .insert(categoryData)
      .select()
      .single()

    if (error) throw error
    return data
  }
}
