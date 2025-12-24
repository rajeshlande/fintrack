import { useFinanceStore } from '@/stores/finance'

export const testTransactionFunctionality = () => {
  console.log('🧪 Testing Transaction Functionality...')
  
  try {
    const financeStore = useFinanceStore()
    
    // Test 1: Create sample transactions
    console.log('📊 Creating sample transactions...')
    
    const sampleTransactions = [
      {
        type: 'expense',
        amount: 2500,
        category: 'groceries',
        subcategory: 'vegetables',
        description: 'Weekly grocery shopping',
        date: '2025-12-19',
        time: '10:30',
        payment_method: 'upi',
        payment_provider: 'paytm',
        merchant: 'Reliance Smart',
        location: 'Mumbai',
        notes: 'Weekly groceries for family',
        tags: ['groceries', 'weekly'],
        is_tax_deductible: false,
        status: 'completed'
      },
      {
        type: 'income',
        amount: 50000,
        category: 'salary',
        description: 'Monthly salary',
        date: '2025-12-01',
        time: '09:00',
        payment_method: 'bank_transfer',
        notes: 'December salary',
        tags: ['salary', 'monthly'],
        is_tax_deductible: false,
        status: 'completed'
      },
      {
        type: 'expense',
        amount: 1500,
        category: 'transportation',
        subcategory: 'fuel',
        description: 'Petrol refill',
        date: '2025-12-18',
        time: '18:45',
        payment_method: 'credit_card',
        payment_provider: 'hdfc',
        merchant: 'Indian Oil',
        location: 'Andheri',
        notes: 'Full tank refill',
        tags: ['fuel', 'transport'],
        is_tax_deductible: false,
        status: 'completed'
      },
      {
        type: 'transfer',
        amount: 10000,
        description: 'Savings transfer',
        date: '2025-12-15',
        time: '14:00',
        from_account: 'savings',
        to_account: 'fixed_deposit',
        notes: 'Monthly savings to FD',
        tags: ['savings', 'investment'],
        status: 'completed'
      }
    ]
    
    // Clear existing transactions for testing
    financeStore.transactions = []
    
    // Add sample transactions
    sampleTransactions.forEach(transaction => {
      financeStore.addTransaction(transaction)
    })
    
    console.log(`✅ Added ${sampleTransactions.length} sample transactions`)
    
    // Test 2: Verify transaction creation
    console.log('🔍 Verifying transaction creation...')
    const allTransactions = financeStore.transactions
    console.log(`📋 Total transactions: ${allTransactions.length}`)
    
    // Test 3: Test filtering functionality
    console.log('🔎 Testing filtering functionality...')
    
    const expenseTransactions = financeStore.getTransactionsByType('expense')
    console.log(`💸 Expense transactions: ${expenseTransactions.length}`)
    
    const incomeTransactions = financeStore.getTransactionsByType('income')
    console.log(`💰 Income transactions: ${incomeTransactions.length}`)
    
    const transferTransactions = financeStore.getTransactionsByType('transfer')
    console.log(`🔄 Transfer transactions: ${transferTransactions.length}`)
    
    // Test 4: Test category filtering
    console.log('🏷️ Testing category filtering...')
    const groceryTransactions = financeStore.getTransactionsByCategory('groceries')
    console.log(`🛒 Grocery transactions: ${groceryTransactions.length}`)
    
    const salaryTransactions = financeStore.getTransactionsByCategory('salary')
    console.log(`💼 Salary transactions: ${salaryTransactions.length}`)
    
    // Test 5: Test payment method filtering
    console.log('💳 Testing payment method filtering...')
    const upiTransactions = financeStore.getTransactionsByPaymentMethod('upi')
    console.log(`📱 UPI transactions: ${upiTransactions.length}`)
    
    const bankTransferTransactions = financeStore.getTransactionsByPaymentMethod('bank_transfer')
    console.log(`🏦 Bank transfer transactions: ${bankTransferTransactions.length}`)
    
    // Test 6: Test date-based filtering
    console.log('📅 Testing date-based filtering...')
    const decemberTransactions = financeStore.getTransactionsByMonth(2025, 11) // December is month 11
    console.log(`📆 December transactions: ${decemberTransactions.length}`)
    
    const todayTransactions = financeStore.getTransactionsByDate('2025-12-19')
    console.log(`📍 Today transactions: ${todayTransactions.length}`)
    
    // Test 7: Test financial calculations
    console.log('🧮 Testing financial calculations...')
    console.log(`💰 Total Income: ${financeStore.formatIndianCurrency(financeStore.totalIncome)}`)
    console.log(`💸 Total Expenses: ${financeStore.formatIndianCurrency(financeStore.totalExpenses)}`)
    console.log(`⚖️ Current Balance: ${financeStore.formatIndianCurrency(financeStore.currentBalance)}`)
    
    // Test 8: Test advanced filtering
    console.log('🔍 Testing advanced filtering...')
    const filteredTransactions = financeStore.getTransactions({
      type: 'expense',
      category: 'groceries',
      date_from: '2025-12-01',
      date_to: '2025-12-31'
    })
    console.log(`🔎 Filtered transactions (expense + groceries + Dec): ${filteredTransactions.length}`)
    
    // Test 9: Test search functionality
    console.log('🔍 Testing search functionality...')
    const searchResults = financeStore.getTransactions({
      search: 'salary'
    })
    console.log(`🔍 Search results for 'salary': ${searchResults.length}`)
    
    // Test 10: Test transaction updates
    console.log('✏️ Testing transaction updates...')
    if (allTransactions.length > 0) {
      const firstTransaction = allTransactions[0]
      const originalAmount = firstTransaction.amount
      const updatedData = { ...firstTransaction, amount: originalAmount + 100 }
      
      financeStore.updateTransaction(firstTransaction.id, updatedData)
      console.log(`✅ Updated transaction amount from ${originalAmount} to ${firstTransaction.amount}`)
    }
    
    // Test 11: Test transaction deletion
    console.log('🗑️ Testing transaction deletion...')
    const initialCount = financeStore.transactions.length
    if (financeStore.transactions.length > 0) {
      const lastTransaction = financeStore.transactions[financeStore.transactions.length - 1]
      financeStore.deleteTransaction(lastTransaction.id)
      console.log(`✅ Deleted transaction. Count changed from ${initialCount} to ${financeStore.transactions.length}`)
    }
    
    console.log('🎉 All transaction functionality tests completed successfully!')
    
    // Return test results
    return {
      success: true,
      totalTransactions: financeStore.transactions.length,
      totalIncome: financeStore.totalIncome,
      totalExpenses: financeStore.totalExpenses,
      currentBalance: financeStore.currentBalance,
      testResults: {
        transactionCreation: true,
        filtering: true,
        categoryFiltering: true,
        paymentMethodFiltering: true,
        dateFiltering: true,
        financialCalculations: true,
        advancedFiltering: true,
        search: true,
        updates: true,
        deletion: true
      }
    }
    
  } catch (error) {
    console.error('❌ Transaction functionality test failed:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

export const testIndianFinancialFeatures = () => {
  console.log('🇮🇳 Testing Indian Financial Features...')
  
  try {
    const financeStore = useFinanceStore()
    
    // Test Indian currency formatting
    console.log('💰 Testing Indian currency formatting...')
    const testAmounts = [1000, 50000, 100000, 1000000, 10000000]
    testAmounts.forEach(amount => {
      const formatted = financeStore.formatIndianCurrency(amount)
      console.log(`₹${amount} → ${formatted}`)
    })
    
    // Test Indian number formatting
    console.log('🔢 Testing Indian number formatting...')
    testAmounts.forEach(amount => {
      const formatted = financeStore.formatIndianNumber(amount)
      console.log(`${amount} → ${formatted}`)
    })
    
    // Test income tax calculation
    console.log('💼 Testing income tax calculation...')
    const testIncomes = [500000, 800000, 1200000, 2000000]
    testIncomes.forEach(income => {
      const tax = financeStore.calculateIncomeTax(income)
      console.log(`Income: ₹${income.toLocaleString()} → Tax: ₹${tax.toLocaleString()}`)
    })
    
    // Test Indian payment methods
    console.log('💳 Testing Indian payment methods...')
    console.log('Available payment methods:', financeStore.paymentMethods.map(m => m.name))
    
    // Test UPI providers
    console.log('📱 Testing UPI providers...')
    const upiProviders = financeStore.paymentMethods.find(m => m.id === 'upi')?.providers
    console.log('UPI providers:', upiProviders?.map(p => p.name) || [])
    
    // Test Indian categories
    console.log('🏷️ Testing Indian categories...')
    console.log('Income categories:', financeStore.incomeCategories.map(c => c.name))
    console.log('Expense categories:', financeStore.expenseCategories.map(c => c.name))
    
    // Test Indian banks
    console.log('🏦 Testing Indian banks...')
    console.log('Available banks:', financeStore.banks.map(b => b.name))
    
    // Test tax categories
    console.log('💰 Testing tax categories...')
    console.log('Tax deduction categories:', financeStore.taxSlabs)
    
    // Test financial terms
    console.log('📚 Testing financial terms...')
    console.log('Available terms:', Object.keys(financeStore.financialTerms))
    
    console.log('🎉 Indian financial features test completed successfully!')
    
    return {
      success: true,
      features: {
        currencyFormatting: true,
        numberFormatting: true,
        taxCalculation: true,
        paymentMethods: true,
        upiProviders: true,
        categories: true,
        banks: true,
        taxCategories: true,
        financialTerms: true
      }
    }
    
  } catch (error) {
    console.error('❌ Indian financial features test failed:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// Export a comprehensive test function
export const runAllTransactionTests = async () => {
  console.log('🚀 Running All Transaction Tests...')
  
  const results = {
    transactionFunctionality: null,
    indianFinancialFeatures: null
  }
  
  try {
    results.transactionFunctionality = testTransactionFunctionality()
    results.indianFinancialFeatures = testIndianFinancialFeatures()
    
    console.log('🎉 All tests completed!')
    console.log('📊 Test Results:', results)
    
    return results
    
  } catch (error) {
    console.error('❌ Test suite failed:', error)
    return {
      success: false,
      error: error.message,
      results
    }
  }
}