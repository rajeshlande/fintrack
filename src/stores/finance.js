import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { usePaymentMethodsStore } from './paymentMethods'

export const useFinanceStore = defineStore('finance', () => {
  // Currency and formatting
  const currencySymbol = ref('₹')
  const currencyCode = ref('INR')

  // Indian predefined categories
  const incomeCategories = ref([
    { id: 'salary', name: 'Salary', icon: '💼', color: '#10B981' },
    { id: 'freelance', name: 'Freelance', icon: '💻', color: '#3B82F6' },
    { id: 'business', name: 'Business', icon: '🏢', color: '#8B5CF6' },
    { id: 'investment', name: 'Investment Returns', icon: '📈', color: '#10B981' },
    { id: 'rental', name: 'Rental Income', icon: '🏠', color: '#F59E0B' },
    { id: 'bonus', name: 'Bonus', icon: '🎁', color: '#EF4444' },
    { id: 'interest', name: 'Interest', icon: '🏦', color: '#06B6D4' },
    { id: 'dividend', name: 'Dividend', icon: '📊', color: '#84CC16' },
    { id: 'gift', name: 'Gift', icon: '🎁', color: '#EC4899' },
    { id: 'other_income', name: 'Other Income', icon: '💰', color: '#6B7280' }
  ])

  const expenseCategories = ref([
    { id: 'groceries', name: 'Groceries & Vegetables', icon: '🛒', color: '#EF4444' },
    { id: 'dairy', name: 'Dairy Products', icon: '🥛', color: '#F59E0B' },
    { id: 'utilities', name: 'Electricity & Water', icon: '💡', color: '#F59E0B' },
    { id: 'rent', name: 'Rent & Housing', icon: '🏠', color: '#8B5CF6' },
    { id: 'transport', name: 'Transport & Fuel', icon: '🚗', color: '#3B82F6' },
    { id: 'food', name: 'Restaurants & Food Delivery', icon: '🍽️', color: '#EC4899' },
    { id: 'shopping', name: 'Online Shopping', icon: '🛍️', color: '#8B5CF6' },
    { id: 'healthcare', name: 'Medical & Healthcare', icon: '🏥', color: '#EF4444' },
    { id: 'education', name: 'Education & Books', icon: '📚', color: '#3B82F6' },
    { id: 'entertainment', name: 'Entertainment & Movies', icon: '🎮', color: '#8B5CF6' },
    { id: 'medical', name: 'Medical & Healthcare', icon: '🏥', color: '#EF4444' },
    { id: 'insurance', name: 'Insurance Premiums', icon: '🛡️', color: '#06B6D4' },
    { id: 'other', name: 'Other Expenses', icon: '💸', color: '#6B7280' }
  ])

  // Indian banks
  const banks = ref([
    { id: 'sbi', name: 'State Bank of India', code: 'SBI' },
    { id: 'hdfc', name: 'HDFC Bank', code: 'HDFC' },
    { id: 'icici', name: 'ICICI Bank', code: 'ICICI' },
    { id: 'pnb', name: 'Punjab National Bank', code: 'PNB' },
    { id: 'bob', name: 'Bank of Baroda', code: 'BOB' },
    { id: 'axis', name: 'Axis Bank', code: 'AXIS' },
    { id: 'kotak', name: 'Kotak Mahindra Bank', code: 'KOTAK' },
    { id: 'canara', name: 'Canara Bank', code: 'CANARA' },
    { id: 'union', name: 'Union Bank of India', code: 'UBI' },
    { id: 'indian', name: 'Indian Bank', code: 'IBL' }
  ])

  // Indian payment methods
  const paymentMethods = ref([
    { id: 'cash', name: 'Cash', icon: '💵' },
    { id: 'upi', name: 'UPI', icon: '📱' },
    { id: 'debit_card', name: 'Debit Card', icon: '💳' },
    { id: 'credit_card', name: 'Credit Card', icon: '💳' },
    { id: 'net_banking', name: 'Net Banking', icon: '🏦' },
    { id: 'cheque', name: 'Cheque', icon: '📄' },
    { id: 'paytm', name: 'Paytm', icon: '📱' },
    { id: 'phonepe', name: 'PhonePe', icon: '📱' },
    { id: 'google_pay', name: 'Google Pay', icon: '📱' },
    { id: 'amazon_pay', name: 'Amazon Pay', icon: '📱' }
  ])

  // Indian currency formatting
  const formatIndianCurrency = (number) => {
    if (isNaN(number)) return `${currencySymbol.value}0`
    
    // Format in Indian style (lakhs, crores)
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(number)
  }

  const formatIndianNumber = (number) => {
    return new Intl.NumberFormat('en-IN').format(number)
  }

  // Indian tax calculations
  const taxSlabs = ref({
    new: [
      { min: 0, max: 250000, rate: 0, description: 'No tax' },
      { min: 250001, max: 500000, rate: 0.05, description: '5% tax' },
      { min: 500001, max: 750000, rate: 0.10, description: '10% tax' },
      { min: 750001, max: 1000000, rate: 0.15, description: '15% tax' },
      { min: 1000001, max: 1250000, rate: 0.20, description: '20% tax' },
      { min: 1250001, max: 1500000, rate: 0.25, description: '25% tax' },
      { min: 1500001, max: Infinity, rate: 0.30, description: '30% tax' }
    ],
    old: [
      { min: 0, max: 250000, rate: 0, description: 'No tax' },
      { min: 250001, max: 500000, rate: 0.05, description: '5% tax' },
      { min: 500001, max: 1000000, rate: 0.20, description: '20% tax' },
      { min: 1000001, max: Infinity, rate: 0.30, description: '30% tax' }
    ]
  })

  const calculateIncomeTax = (annualIncome, regime = 'new') => {
    let tax = 0
    const slabs = taxSlabs.value[regime] || taxSlabs.value.new
    
    for (const slab of slabs) {
      if (annualIncome > slab.min) {
        const taxableAmount = Math.min(annualIncome, slab.max) - slab.min
        tax += taxableAmount * slab.rate
      }
    }
    
    const effectiveRate = annualIncome > 0 ? (tax / annualIncome) * 100 : 0
    const netIncome = annualIncome - tax
    
    return {
      tax,
      effectiveRate,
      netIncome,
      slabs
    }
  }

  // Enhanced transaction management with Indian-specific features
  const transactions = ref([])
  const totalIncome = ref(0)
  const totalExpenses = ref(0)
  const currentBalance = ref(0)
  const loading = ref(false)
  const error = ref(null)

  // Supabase integration methods
  const fetchTransactions = async (filters = {}) => {
    loading.value = true
    error.value = null
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')
      
      let query = supabase
        .from('transactions')
        .select(`
          *,
          category:categories(name, color, icon)
        `)
        .eq('user_id', user.id)
      
      // Apply filters
      if (filters.type) {
        query = query.eq('type', filters.type)
      }
      if (filters.category_id) {
        query = query.eq('category_id', filters.category_id)
      }
      if (filters.date_from) {
        query = query.gte('date', filters.date_from)
      }
      if (filters.date_to) {
        query = query.lte('date', filters.date_to)
      }
      if (filters.payment_method) {
        query = query.eq('payment_method', filters.payment_method)
      }
      if (filters.tags && filters.tags.length > 0) {
        query = query.contains('tags', filters.tags)
      }
      
      // Order by date descending
      query = query.order('date', { ascending: false })
      
      const { data, error: fetchError } = await query
      
      if (fetchError) throw fetchError
      
      transactions.value = data || []
      updateFinancialTotals()
      
      return data
    } catch (err) {
      error.value = err.message
      console.error('Error fetching transactions:', err)
      return []
    } finally {
      loading.value = false
    }
  }

  const fetchCategories = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .or('is_default.eq.true,user_id.eq.' + (user?.id || ''))
        .eq('is_active', true)
        .order('name')
      
      if (error) throw error
      
      return data || []
    } catch (err) {
      console.error('Error fetching categories:', err)
      return []
    }
  }

  // Enhanced transaction data model - Now saves to Supabase
  const createTransaction = async (transactionData) => {
    try {
      // Get user ID first
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')
      
      // Validation: Check required fields before any database operations
      const validationErrors = []
      
      // Validate amount
      if (!transactionData.amount || parseFloat(transactionData.amount) <= 0) {
        validationErrors.push('Amount must be greater than 0')
      }
      
      // Validate category_id is provided
      if (!transactionData.category_id) {
        validationErrors.push('Category is required')
      }
      
      // Validate payment_method is provided (matches database schema)
      if (!transactionData.payment_method) {
        validationErrors.push('Payment method is required')
      }
      
      // If validation errors exist, throw them before any database calls
      if (validationErrors.length > 0) {
        throw new Error(validationErrors.join('; '))
      }
      
      // Prepare transaction data with validated fields
      const transactionPayload = {
        user_id: user.id,
        category_id: transactionData.category_id,
        payment_method: transactionData.payment_method,
        title: transactionData.title || transactionData.description || 'Transaction',
        description: transactionData.description || null,
        amount: parseFloat(transactionData.amount),
        type: transactionData.type || 'expense',
        date: transactionData.date || new Date().toISOString().split('T')[0],
        bank_name: transactionData.bank_name || null,
        reference_number: transactionData.reference_number || null,
        tags: transactionData.tags || [],
        receipts: transactionData.receipt_url ? { url: transactionData.receipt_url } : null,
        is_recurring: transactionData.is_recurring || false,
        recurring_interval: transactionData.recurring_interval || null,
        recurring_end_date: transactionData.recurring_end_date || null
      }
      
      const { data, error } = await supabase
        .from('transactions')
        .insert(transactionPayload)
        .select()
        .single()

      if (error) throw error

      // Update local state
      transactions.value.unshift(data)
      updateFinancialTotals()
      
      return data
    } catch (error) {
      console.error('Error creating transaction:', error)
      throw error
    }
  }

  const addTransaction = async (transactionData) => {
    return await createTransaction(transactionData)
  }

  const updateTransaction = async (transactionId, updates) => {
    try {
      loading.value = true
      error.value = null

      const { data, error: updateError } = await supabase
        .from('transactions')
        .update(updates)
        .eq('id', transactionId)
        .select()
        .single()

      if (updateError) throw updateError

      const index = transactions.value.findIndex(t => t.id === transactionId)
      if (index !== -1) {
        transactions.value[index] = data
      }
      updateFinancialTotals()
      return data
    } catch (err) {
      error.value = err?.message || 'Failed to update transaction'
      console.error('Error updating transaction:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteTransaction = async (transactionId) => {
    try {
      loading.value = true
      error.value = null

      const { error: deleteError } = await supabase
        .from('transactions')
        .delete()
        .eq('id', transactionId)

      if (deleteError) throw deleteError

      transactions.value = transactions.value.filter(t => t.id !== transactionId)
      updateFinancialTotals()
      return true
    } catch (err) {
      error.value = err?.message || 'Failed to delete transaction'
      console.error('Error deleting transaction:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateFinancialTotals = () => {
    let income = 0
    let expenses = 0
    
    transactions.value.forEach(transaction => {
      if (transaction.type === 'income') {
        income += transaction.amount
      } else if (transaction.type === 'expense') {
        expenses += transaction.amount
      }
    })
    
    totalIncome.value = income
    totalExpenses.value = expenses
    currentBalance.value = income - expenses
  }

  const getTransactions = (filters = {}) => {
    let filteredTransactions = [...transactions.value]
    
    // Apply filters
    if (filters.type) {
      filteredTransactions = filteredTransactions.filter(t => t.type === filters.type)
    }
    if (filters.category) {
      filteredTransactions = filteredTransactions.filter(t => t.category === filters.category)
    }
    if (filters.payment_method) {
      filteredTransactions = filteredTransactions.filter(t => t.payment_method === filters.payment_method)
    }
    if (filters.date_from) {
      filteredTransactions = filteredTransactions.filter(t => t.date >= filters.date_from)
    }
    if (filters.date_to) {
      filteredTransactions = filteredTransactions.filter(t => t.date <= filters.date_to)
    }
    if (filters.amount_min) {
      filteredTransactions = filteredTransactions.filter(t => t.amount >= filters.amount_min)
    }
    if (filters.amount_max) {
      filteredTransactions = filteredTransactions.filter(t => t.amount <= filters.amount_max)
    }
    if (filters.merchant) {
      filteredTransactions = filteredTransactions.filter(t => t.merchant?.toLowerCase().includes(filters.merchant.toLowerCase()))
    }
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase()
      filteredTransactions = filteredTransactions.filter(t => 
        t.description.toLowerCase().includes(searchTerm) ||
        t.merchant?.toLowerCase().includes(searchTerm) ||
        t.notes?.toLowerCase().includes(searchTerm) ||
        (t.tags && t.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
      )
    }
    
    // Sort by date (newest first)
    filteredTransactions.sort((a, b) => new Date(b.date) - new Date(a.date))
    
    return filteredTransactions
  }

  const getTransactionsByType = (type) => {
    return getTransactions({ type })
  }

  const getTransactionById = (transactionId) => {
    return transactions.value.find(t => t.id === transactionId)
  }

  const getTransactionsByDate = (date) => {
    return transactions.value.filter(t => t.date === date)
  }

  const getTransactionsByMonth = (year, month) => {
    return transactions.value.filter(t => {
      const transactionDate = new Date(t.date)
      return transactionDate.getFullYear() === year && transactionDate.getMonth() === month
    })
  }

  const getTransactionsByCategory = (category) => {
    return transactions.value.filter(t => t.category === category)
  }

  const getTransactionsByPaymentMethod = (paymentMethod) => {
    return transactions.value.filter(t => t.payment_method === paymentMethod)
  }

  // Indian financial terms and descriptions
  const financialTerms = ref({
    'SIP': 'Systematic Investment Plan - Regular monthly investment in mutual funds',
    'EMI': 'Equated Monthly Installment - Monthly loan payment',
    'FD': 'Fixed Deposit - Bank deposit with fixed interest rate',
    'RD': 'Recurring Deposit - Monthly savings deposit',
    'PPF': 'Public Provident Fund - Long-term government savings scheme',
    'EPF': 'Employee Provident Fund - Retirement savings for employees',
    'NPS': 'National Pension System - Government pension scheme',
    'ELSS': 'Equity Linked Savings Scheme - Tax-saving mutual fund',
    'GST': 'Goods and Services Tax - Indirect tax on goods and services',
    'TDS': 'Tax Deducted at Source - Tax deducted before payment',
    'ITR': 'Income Tax Return - Annual tax filing',
    'PAN': 'Permanent Account Number - Tax identification number',
    'Aadhaar': 'Unique identification number issued by UIDAI',
    'UPI': 'Unified Payments Interface - Instant payment system',
    'IMPS': 'Immediate Payment Service - Instant money transfer',
    'NEFT': 'National Electronic Funds Transfer - Money transfer system',
    'RTGS': 'Real Time Gross Settlement - High-value money transfer',
    'LTCG': 'Long Term Capital Gains - Tax on long-term investments',
    'STCG': 'Short Term Capital Gains - Tax on short-term investments'
  })

  // Indian festivals and financial planning
  const financialFestivals = ref([
    { name: 'Diwali', month: 'October/November', significance: 'Gold purchases, investments' },
    { name: 'Dhanteras', month: 'October/November', significance: 'Gold and silver buying' },
    { name: 'Akshaya Tritiya', month: 'April/May', significance: 'Gold purchases, new beginnings' },
    { name: 'Navratri', month: 'March/April & September/October', significance: 'Business investments' },
    { name: 'Gudi Padwa', month: 'March/April', significance: 'New financial year beginnings' },
    { name: 'Ugadi', month: 'March/April', significance: 'New year, new investments' }
  ])

  return {
    currencySymbol,
    currencyCode,
    incomeCategories,
    expenseCategories,
    banks,
    paymentMethods,
    taxSlabs,
    financialTerms,
    financialFestivals,
    transactions,
    totalIncome,
    totalExpenses,
    currentBalance,
    loading,
    error,
    formatIndianCurrency,
    formatIndianNumber,
    calculateIncomeTax,
    createTransaction,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    getTransactions,
    getTransactionsByType,
    getTransactionById,
    getTransactionsByDate,
    getTransactionsByMonth,
    getTransactionsByCategory,
    getTransactionsByPaymentMethod,
    fetchTransactions,
    fetchCategories
  }
})
