# DATABASE SETUP - REQUIRED

## Problem
The budget page is showing database errors because the tables don't exist:
```
Could not find the table 'public.monthly_budgets' in the schema cache
Could not find the table 'public.annual_budgets' in the schema cache
```

## Solution - Execute Database Schema

### Step 1: Go to Supabase Dashboard
1. Open https://supabase.com/dashboard
2. Select your project
3. Click "SQL Editor" in the left sidebar

### Step 2: Execute the Schema
1. Open `database_schema.sql` file from your project
2. Copy ALL the SQL code
3. Paste into the Supabase SQL Editor
4. Click "Run" button

### Step 3: (Optional) Add Sample Data
1. Open `sample_data.sql` file
2. Copy the SQL code
3. Paste into the SQL Editor
4. Click "Run" button

### Step 4: Refresh the Budget Page
Go to `http://192.168.56.1:5173/budget` and refresh

## What This Creates
- `categories` - Income/expense categories
- `monthly_budgets` - Monthly budget allocations
- `annual_budgets` - Annual budget allocations
- `financial_goals` - Savings/investment goals
- `investments` - Investment tracking
- `savings_recommendations` - AI recommendations
- `budget_performance` - Budget vs actual analysis

## After Setup
The budget page will work fully with:
- Budget creation and tracking
- Financial goals management
- Investment recommendations
- Budget performance charts
- Indian currency formatting

## Troubleshooting
If errors persist:
1. Ensure all SQL executed successfully
2. Check Supabase logs for any SQL errors
3. Verify tables exist in the "Table Editor" section
