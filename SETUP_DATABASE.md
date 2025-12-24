# Database Setup Instructions

## Issue
The budget page is showing errors because the database tables don't exist yet. You need to execute the database schema to create the required tables.

## Solution

### Option 1: Using Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Select your project
3. Click on "SQL Editor" in the left sidebar
4. Copy the entire content of `database_schema.sql` file
5. Paste it into the SQL editor
6. Click "Run" to execute the schema

### Option 2: Using Supabase CLI
If you have the Supabase CLI installed:
```bash
supabase db push
```

### Option 3: Manual Execution
Run the SQL commands from `database_schema.sql` in your preferred PostgreSQL client.

## After Running the Schema
Once the database schema is executed:
1. The budget page at `http://192.168.56.1:5173/budget` should work properly
2. You can optionally run `sample_data.sql` to populate the database with test data

## Tables Created
- categories (income/expense categories)
- monthly_budgets (monthly budget allocations)
- annual_budgets (annual budget allocations)
- financial_goals (savings/investment goals)
- investments (investment tracking)
- savings_recommendations (AI-generated recommendations)
- budget_performance (budget vs actual spending analysis)

## Next Steps
After setting up the database, refresh the budget page to see the full functionality working.
