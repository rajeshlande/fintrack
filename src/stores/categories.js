import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'

export const useCategoriesStore = defineStore('categories', () => {
  // State
  const categories = ref([])
  const loading = ref(false)
  const error = ref(null)

  // Actions
  const fetchCategories = async () => {
    try {
      loading.value = true
      error.value = null

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Fetch from unified categories table
      const { data, error: fetchError } = await supabase
        .from('categories')
        .select('*')
        .or('is_default.eq.true,user_id.eq.' + user.id)
        .order('is_default', { ascending: false })
        .order('name')

      if (fetchError) throw fetchError

      categories.value = data || []
      return categories.value
    } catch (err) {
      error.value = err?.message || 'Failed to fetch categories'
      console.error('Error fetching categories:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const createCategory = async (categoryData) => {
    try {
      loading.value = true
      error.value = null

      console.log('Creating category with data:', categoryData)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { data, error: insertError } = await supabase
        .from('categories')
        .insert({
          name: categoryData.name,
          type: categoryData.type,
          icon: categoryData.icon,
          color: categoryData.color,
          description: categoryData.description,
          is_default: false,
          is_active: true,
          user_id: user.id
        })
        .select()
        .single()

      if (insertError) throw insertError

      categories.value.push(data)
      return data
    } catch (err) {
      error.value = err?.message || 'Failed to create category'
      console.error('Error creating category:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateCategory = async (categoryId, updates) => {
    try {
      loading.value = true
      error.value = null

      const { data, error: updateError } = await supabase
        .from('categories')
        .update(updates)
        .eq('id', categoryId)
        .select()
        .single()

      if (updateError) throw updateError

      const index = categories.value.findIndex(cat => cat.id === categoryId)
      if (index !== -1) {
        categories.value[index] = data
      }
      return data
    } catch (err) {
      error.value = err?.message || 'Failed to update category'
      console.error('Error updating category:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteCategory = async (categoryId) => {
    try {
      loading.value = true
      error.value = null

      // Check if category has transactions
      const { data: transactions } = await supabase
        .from('transactions')
        .select('count')
        .eq('category_id', categoryId)

      if (transactions && transactions.length > 0) {
        throw new Error('Cannot delete category with existing transactions')
      }

      const { error: deleteError } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId)

      if (deleteError) throw deleteError

      categories.value = categories.value.filter(cat => cat.id !== categoryId)
      return true
    } catch (err) {
      error.value = err?.message || 'Failed to delete category'
      console.error('Error deleting category:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const getCategoryById = (categoryId) => {
    return categories.value.find(cat => cat.id === categoryId)
  }

  const getIncomeCategories = computed(() => {
    return categories.value.filter(cat => cat.type === 'income')
  })

  const getExpenseCategories = computed(() => {
    return categories.value.filter(cat => cat.type === 'expense')
  })

  const getDefaultCategories = computed(() => {
    return categories.value.filter(cat => cat.is_default)
  })

  const getUserCategories = computed(() => {
    return categories.value.filter(cat => !cat.is_default)
  })

  return {
    // State
    categories,
    loading,
    error,

    // Actions
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    getCategoryById,

    // Computed
    getIncomeCategories,
    getExpenseCategories,
    getDefaultCategories,
    getUserCategories
  }
})
