import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'

export const useIncomeCategoriesStore = defineStore('incomeCategories', () => {
  // State
  const incomeCategories = ref([])
  const loading = ref(false)
  const error = ref(null)

  // Actions
  const fetchIncomeCategories = async () => {
    try {
      loading.value = true
      error.value = null

      const { data, error: fetchError } = await supabase
        .from('income_categories')
        .select('*')
        .order('name')

      if (fetchError) throw fetchError

      incomeCategories.value = data || []
      return data
    } catch (err) {
      error.value = err?.message || 'Failed to fetch income categories'
      console.error('Error fetching income categories:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const createIncomeCategory = async (categoryData) => {
    try {
      loading.value = true
      error.value = null

      const { data, error: insertError } = await supabase
        .from('income_categories')
        .insert({
          name: categoryData.name,
          description: categoryData.description
        })
        .select()
        .single()

      if (insertError) throw insertError

      incomeCategories.value.push(data)
      return data
    } catch (err) {
      error.value = err?.message || 'Failed to create income category'
      console.error('Error creating income category:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateIncomeCategory = async (categoryId, updates) => {
    try {
      loading.value = true
      error.value = null

      const { data, error: updateError } = await supabase
        .from('income_categories')
        .update(updates)
        .eq('id', categoryId)
        .select()
        .single()

      if (updateError) throw updateError

      const index = incomeCategories.value.findIndex(cat => cat.id === categoryId)
      if (index !== -1) {
        incomeCategories.value[index] = data
      }
      return data
    } catch (err) {
      error.value = err?.message || 'Failed to update income category'
      console.error('Error updating income category:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteIncomeCategory = async (categoryId) => {
    try {
      loading.value = true
      error.value = null

      const { error: deleteError } = await supabase
        .from('income_categories')
        .delete()
        .eq('id', categoryId)

      if (deleteError) throw deleteError

      incomeCategories.value = incomeCategories.value.filter(cat => cat.id !== categoryId)
      return true
    } catch (err) {
      error.value = err?.message || 'Failed to delete income category'
      console.error('Error deleting income category:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Initialize with default income categories if table is empty
  const initializeDefaultIncomeCategories = async () => {
    try {
      const { data: existingCategories } = await supabase
        .from('income_categories')
        .select('count')

      if (existingCategories && existingCategories.length > 0) {
        return // Already has data, don't initialize
      }

      // Add default income categories
      const defaultCategories = [
        { name: 'Salary', description: 'Monthly salary income' },
        { name: 'Freelance', description: 'Freelance work income' },
        { name: 'Business', description: 'Business income' },
        { name: 'Investment Returns', description: 'Returns from investments' },
        { name: 'Rental Income', description: 'Income from property rentals' },
        { name: 'Bonus', description: 'Performance bonuses' },
        { name: 'Interest', description: 'Bank interest income' },
        { name: 'Dividend', description: 'Stock dividend income' },
        { name: 'Gift', description: 'Gift money received' },
        { name: 'Other Income', description: 'Other miscellaneous income' }
      ]

      for (const category of defaultCategories) {
        await createIncomeCategory(category)
      }
    } catch (err) {
      console.error('Error initializing default income categories:', err)
    }
  }

  return {
    incomeCategories,
    loading,
    error,
    fetchIncomeCategories,
    createIncomeCategory,
    updateIncomeCategory,
    deleteIncomeCategory,
    initializeDefaultIncomeCategories
  }
})
