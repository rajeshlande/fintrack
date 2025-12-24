import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Read environment variables
const envContent = readFileSync(join(__dirname, '..', '.env'), 'utf8')
const envVars = {}
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=')
  if (key && value) {
    envVars[key.trim()] = value.trim().replace(/['"]/g, '')
  }
})

const supabaseUrl = envVars.VITE_SUPABASE_URL
const supabaseKey = envVars.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env file')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

const defaultCategories = [
  // Income Categories
  { name: 'Salary', type: 'income', icon: '💼', color: '#10B981', description: 'Monthly salary income', is_default: true, is_active: true },
  { name: 'Freelance Income', type: 'income', icon: '💻', color: '#3B82F6', description: 'Freelance project income', is_default: true, is_active: true },
  { name: 'Business Income', type: 'income', icon: '🏢', color: '#8B5CF6', description: 'Business profits', is_default: true, is_active: true },
  { name: 'Rental Income', type: 'income', icon: '🏠', color: '#F59E0B', description: 'Property rental income', is_default: true, is_active: true },
  { name: 'Interest Income', type: 'income', icon: '📈', color: '#10B981', description: 'Bank interest and other interest income', is_default: true, is_active: true },
  { name: 'Dividends', type: 'income', icon: '📊', color: '#84CC16', description: 'Stock dividends and mutual fund distributions', is_default: true, is_active: true },
  { name: 'Pension', type: 'income', icon: '👴', color: '#06B6D4', description: 'Retirement pension income', is_default: true, is_active: true },
  { name: 'Agricultural Income', type: 'income', icon: '🌾', color: '#EC4899', description: 'Agricultural income', is_default: true, is_active: true },
  { name: 'Other Income', type: 'income', icon: '💰', color: '#6B7280', description: 'Other sources of income', is_default: true, is_active: true },

  // Expense Categories
  { name: 'Groceries & Vegetables', type: 'expense', icon: '🛒', color: '#EF4444', description: 'Groceries and vegetables', is_default: true, is_active: true },
  { name: 'Dairy Products', type: 'expense', icon: '🥛', color: '#F59E0B', description: 'Milk, curd, cheese and other dairy products', is_default: true, is_active: true },
  { name: 'Electricity & Water', type: 'expense', icon: '💡', color: '#F59E0B', description: 'Electricity and water bills', is_default: true, is_active: true },
  { name: 'Mobile & Internet', type: 'expense', icon: '📱', color: '#3B82F6', description: 'Mobile recharge and internet bills', is_default: true, is_active: true },
  { name: 'Rent & Housing', type: 'expense', icon: '🏠', color: '#8B5CF6', description: 'Rent and housing expenses', is_default: true, is_active: true },
  { name: 'Transport & Fuel', type: 'expense', icon: '🚗', color: '#3B82F6', description: 'Transportation and fuel expenses', is_default: true, is_active: true },
  { name: 'Medical & Healthcare', type: 'expense', icon: '🏥', color: '#EF4444', description: 'Medical expenses and healthcare', is_default: true, is_active: true },
  { name: 'Education & Books', type: 'expense', icon: '📚', color: '#3B82F6', description: 'Education fees and books', is_default: true, is_active: true },
  { name: 'Clothing & Fashion', type: 'expense', icon: '👕', color: '#EC4899', description: 'Clothing and fashion accessories', is_default: true, is_active: true },
  { name: 'Entertainment & Movies', type: 'expense', icon: '🎬', color: '#8B5CF6', description: 'Entertainment and movies', is_default: true, is_active: true },
  { name: 'Restaurants & Food Delivery', type: 'expense', icon: '🍽️', color: '#EF4444', description: 'Restaurant meals and food delivery', is_default: true, is_active: true },
  { name: 'Temple & Donations', type: 'expense', icon: '🛕', color: '#F59E0B', description: 'Temple donations and charity', is_default: true, is_active: true },
  { name: 'Festivals & Celebrations', type: 'expense', icon: '🎉', color: '#EC4899', description: 'Festival expenses and celebrations', is_default: true, is_active: true },
  { name: 'Gold & Jewelry', type: 'expense', icon: '💍', color: '#F59E0B', description: 'Gold and jewelry purchases', is_default: true, is_active: true },
  { name: 'Insurance Premiums', type: 'expense', icon: '🛡️', color: '#06B6D4', description: 'Life, health, and other insurance premiums', is_default: true, is_active: true },
  { name: 'EMI & Loans', type: 'expense', icon: '🏦', color: '#EF4444', description: 'EMI payments and loan installments', is_default: true, is_active: true },
  { name: 'Taxes & GST', type: 'expense', icon: '📄', color: '#EF4444', description: 'Income tax and GST payments', is_default: true, is_active: true },
  { name: 'Online Shopping', type: 'expense', icon: '🛍️', color: '#8B5CF6', description: 'E-commerce and online shopping', is_default: true, is_active: true },
  { name: 'Fresh Vegetables & Fruits', type: 'expense', icon: '🥬', color: '#10B981', description: 'Fresh vegetables and fruits', is_default: true, is_active: true },
  { name: 'Snacks & Sweets', type: 'expense', icon: '🍬', color: '#EC4899', description: 'Snacks, sweets and beverages', is_default: true, is_active: true },
  { name: 'Other Expenses', type: 'expense', icon: '💸', color: '#6B7280', description: 'Other miscellaneous expenses', is_default: true, is_active: true }
]

async function insertDefaultCategories() {
  try {
    console.log('Inserting default categories...')

    // First, check if categories already exist
    const { data: existingCategories, error: checkError } = await supabase
      .from('categories')
      .select('name, type')
      .eq('is_default', true)

    if (checkError) {
      console.error('Error checking existing categories:', checkError)
      return
    }

    if (existingCategories && existingCategories.length > 0) {
      console.log(`Found ${existingCategories.length} existing default categories. Skipping insertion.`)
      return
    }

    // Insert categories in batches to avoid payload size limits
    const batchSize = 10
    for (let i = 0; i < defaultCategories.length; i += batchSize) {
      const batch = defaultCategories.slice(i, i + batchSize)
      console.log(`Inserting batch ${Math.floor(i / batchSize) + 1}...`)

      const { data, error } = await supabase
        .from('categories')
        .insert(batch)
        .select()

      if (error) {
        console.error('Error inserting categories batch:', error)
        return
      }

      console.log(`Successfully inserted ${data.length} categories`)
    }

    console.log('All default categories inserted successfully!')

    // Verify insertion
    const { data: verifyData, error: verifyError } = await supabase
      .from('categories')
      .select('count')
      .eq('is_default', true)

    if (verifyError) {
      console.error('Error verifying categories:', verifyError)
    } else {
      console.log(`Total default categories in database: ${verifyData[0].count}`)
    }

  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

insertDefaultCategories()
