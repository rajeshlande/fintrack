import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'

export const useExpenseCategoriesStore = defineStore('expenseCategories', () => {
  // State
  const expenseCategories = ref([])
  const loading = ref(false)
  const error = ref(null)

  // Actions
  const fetchExpenseCategories = async () => {
    try {
      loading.value = true
      error.value = null

      const { data, error: fetchError } = await supabase
        .from('expense_categories')
        .select('*')
        .order('name')

      if (fetchError) throw fetchError

      expenseCategories.value = data || []
      return data
    } catch (err) {
      error.value = err?.message || 'Failed to fetch expense categories'
      console.error('Error fetching expense categories:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const createExpenseCategory = async (categoryData) => {
    try {
      loading.value = true
      error.value = null

      const { data, error: insertError } = await supabase
        .from('expense_categories')
        .insert({
          name: categoryData.name,
          description: categoryData.description
        })
        .select()
        .single()

      if (insertError) throw insertError

      expenseCategories.value.push(data)
      return data
    } catch (err) {
      error.value = err?.message || 'Failed to create expense category'
      console.error('Error creating expense category:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateExpenseCategory = async (categoryId, updates) => {
    try {
      loading.value = true
      error.value = null

      const { data, error: updateError } = await supabase
        .from('expense_categories')
        .update(updates)
        .eq('id', categoryId)
        .select()
        .single()

      if (updateError) throw updateError

      const index = expenseCategories.value.findIndex(cat => cat.id === categoryId)
      if (index !== -1) {
        expenseCategories.value[index] = data
      }
      return data
    } catch (err) {
      error.value = err?.message || 'Failed to update expense category'
      console.error('Error updating expense category:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteExpenseCategory = async (categoryId) => {
    try {
      loading.value = true
      error.value = null

      const { error: deleteError } = await supabase
        .from('expense_categories')
        .delete()
        .eq('id', categoryId)

      if (deleteError) throw deleteError

      expenseCategories.value = expenseCategories.value.filter(cat => cat.id !== categoryId)
      return true
    } catch (err) {
      error.value = err?.message || 'Failed to delete expense category'
      console.error('Error deleting expense category:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Initialize with default expense categories if table is empty
  const initializeDefaultExpenseCategories = async () => {
    try {
      const { data: existingCategories } = await supabase
        .from('expense_categories')
        .select('count')

      if (existingCategories && existingCategories.length > 0) {
        return // Already has data, don't initialize
      }

      // Add default expense categories
      const defaultCategories = [
        { name: 'Groceries', description: 'Food and grocery items' },
        { name: 'Dairy', description: 'Dairy products like milk, cheese, etc.' },
        { name: 'Utilities', description: 'Electricity, water, gas, internet bills' },
        { name: 'Rent', description: 'Monthly rent payments' },
        { name: 'Transport', description: 'Transportation and fuel costs' },
        { name: 'Food & Dining', description: 'Restaurant meals and dining out' },
        { name: 'Shopping', description: 'Clothing, electronics, and other shopping' },
        { name: 'Healthcare', description: 'Medical expenses and healthcare' },
        { name: 'Education', description: 'Education and learning expenses' },
        { name: 'Entertainment', description: 'Movies, games, and entertainment' },
        { name: 'Medical', description: 'Medical treatments and medicines' },
        { name: 'Insurance', description: 'Insurance premiums and policies' },
        { name: 'Other Expense', description: 'Miscellaneous expenses' }
      ]

      for (const category of defaultCategories) {
        await createExpenseCategory(category)
      }
    } catch (err) {
      console.error('Error initializing default expense categories:', err)
    }
  }

  return {
    expenseCategories,
    loading,
    error,
    fetchExpenseCategories,
    createExpenseCategory,
    updateExpenseCategory,
    deleteExpenseCategory,
    initializeDefaultExpenseCategories
  }
})
