import { supabase } from '@/lib/supabase'

export const testSupabaseConnection = async () => {
  try {
    console.log('Testing Supabase connection...')
    
    // Test basic connection
    const { data, error } = await supabase.from('_test_connection').select('*').limit(1)
    
    if (error && error.code !== 'PGRST116') {
      // PGRST116 means relation doesn't exist, which is expected
      console.error('Supabase connection error:', error)
      return false
    }
    
    console.log('Supabase connection successful!')
    return true
  } catch (err) {
    console.error('Supabase test failed:', err)
    return false
  }
}

export const testAuthConnection = async () => {
  try {
    console.log('Testing Supabase Auth...')
    
    // Test if auth service is available
    const { data, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('Auth service error:', error)
      return false
    }
    
    console.log('Supabase Auth service available!')
    return true
  } catch (err) {
    console.error('Auth test failed:', err)
    return false
  }
}
