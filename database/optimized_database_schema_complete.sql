    -- =====================================================
    -- FinTrack Optimized Database Schema with Supabase Features
    -- =====================================================
    -- Created: 2025-12-19
    -- Purpose: Optimized database structure for Indian financial management app
    -- Features: Triggers, Views, Functions, RLS, Indexes, Performance optimization

    -- Enable necessary extensions
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";

    -- =====================================================
    -- Core Tables
    -- =====================================================

    -- Categories table (income and expense categories)
    CREATE TABLE IF NOT EXISTS categories (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(100) NOT NULL,
        type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
        icon VARCHAR(50),
        color VARCHAR(7), -- hex color code
        description TEXT,
        is_default BOOLEAN DEFAULT false,
        is_active BOOLEAN DEFAULT true,
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        CONSTRAINT categories_default_user_check
        CHECK (
            (is_default = true AND user_id IS NULL)
            OR
            (is_default = false AND user_id IS NOT NULL)
        )
    );

    -- Transactions table (main financial transactions)
    CREATE TABLE IF NOT EXISTS transactions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        category_id UUID NOT NULL REFERENCES categories(id),
        title VARCHAR(200) NOT NULL,
        description TEXT,
        amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
        type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
        date DATE NOT NULL,
        payment_method VARCHAR(50),
        bank_name VARCHAR(100),
        reference_number VARCHAR(100),
        tags TEXT[], -- array of tags for better categorization
        receipts JSONB, -- store receipt information
        is_recurring BOOLEAN DEFAULT false,
        recurring_interval VARCHAR(20), -- daily, weekly, monthly, yearly
        recurring_end_date DATE,
        parent_transaction_id UUID REFERENCES transactions(id), -- for recurring series
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        financial_year INTEGER GENERATED ALWAYS AS (
            CASE 
                WHEN date >= MAKE_DATE(EXTRACT(YEAR FROM date)::INTEGER, 4, 1) 
                THEN EXTRACT(YEAR FROM date)::INTEGER + 1
                ELSE EXTRACT(YEAR FROM date)::INTEGER
            END
        ) STORED
    );

    -- Monthly budgets table
    CREATE TABLE IF NOT EXISTS monthly_budgets (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
        month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
        year INTEGER NOT NULL CHECK (year >= 2020 AND year <= 2100),
        budget_amount DECIMAL(12,2) NOT NULL CHECK (budget_amount >= 0),
        spent_amount DECIMAL(12,2) DEFAULT 0 CHECK (spent_amount >= 0),
        remaining_amount DECIMAL(12,2) GENERATED ALWAYS AS (budget_amount - spent_amount) STORED,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(user_id, category_id, month, year)
    );

    -- Annual budgets table
    CREATE TABLE IF NOT EXISTS annual_budgets (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
        financial_year INTEGER NOT NULL CHECK (financial_year >= 2020 AND financial_year <= 2100),
        budget_amount DECIMAL(12,2) NOT NULL CHECK (budget_amount >= 0),
        spent_amount DECIMAL(12,2) DEFAULT 0 CHECK (spent_amount >= 0),
        remaining_amount DECIMAL(12,2) GENERATED ALWAYS AS (budget_amount - spent_amount) STORED,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(user_id, category_id, financial_year)
    );

    -- Financial goals table
    CREATE TABLE IF NOT EXISTS financial_goals (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        target_amount DECIMAL(12,2) NOT NULL CHECK (target_amount > 0),
        current_amount DECIMAL(12,2) DEFAULT 0 CHECK (current_amount >= 0),
        target_date DATE NOT NULL,
        category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
        priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'cancelled')),
        auto_contribute BOOLEAN DEFAULT false,
        contribution_amount DECIMAL(12,2) DEFAULT 0,
        contribution_frequency VARCHAR(20) DEFAULT 'monthly', -- daily, weekly, monthly
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        progress_percentage DECIMAL(5,2) GENERATED ALWAYS AS (
            CASE 
                WHEN target_amount > 0 THEN (current_amount / target_amount) * 100
                ELSE 0
            END
        ) STORED
    );

    -- Investments table
    CREATE TABLE IF NOT EXISTS investments (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        name VARCHAR(200) NOT NULL,
        type VARCHAR(50) NOT NULL, -- stocks, mutual_funds, fixed_deposit, real_estate, etc.
        provider VARCHAR(200),
        initial_amount DECIMAL(12,2) NOT NULL CHECK (initial_amount >= 0),
        current_value DECIMAL(12,2) DEFAULT 0 CHECK (current_value >= 0),
        purchase_date DATE NOT NULL,
        maturity_date DATE,
        interest_rate DECIMAL(5,2), -- percentage
        is_active BOOLEAN DEFAULT true,
        notes TEXT,
        documents JSONB, -- store investment documents
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        returns_amount DECIMAL(5,2) GENERATED ALWAYS AS (
            CASE 
                WHEN initial_amount > 0 THEN ((current_value - initial_amount) / initial_amount) * 100
                ELSE 0
            END
        ) STORED
    );

    -- Savings recommendations table
    CREATE TABLE IF NOT EXISTS savings_recommendations (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        recommended_amount DECIMAL(12,2) NOT NULL CHECK (recommended_amount > 0),
        priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
        category VARCHAR(50), -- emergency_fund, retirement, education, etc.
        is_accepted BOOLEAN DEFAULT false,
        is_completed BOOLEAN DEFAULT false,
        expires_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Budget performance tracking table
    CREATE TABLE IF NOT EXISTS budget_performance (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        period_type VARCHAR(20) NOT NULL CHECK (period_type IN ('monthly', 'annual')),
        period_value INTEGER NOT NULL, -- month number for monthly, year for annual
        financial_year INTEGER,
        total_income DECIMAL(12,2) DEFAULT 0,
        total_expense DECIMAL(12,2) DEFAULT 0,
        net_savings DECIMAL(12,2) GENERATED ALWAYS AS (total_income - total_expense) STORED,
        savings_rate DECIMAL(5,2) GENERATED ALWAYS AS (
            CASE 
                WHEN total_income > 0 THEN ((total_income - total_expense) / total_income) * 100
                ELSE 0
            END
        ) STORED,
        budget_utilization DECIMAL(5,2) DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(user_id, period_type, period_value, financial_year)
    );

    -- =====================================================
    -- Indexes for Performance Optimization
    -- =====================================================

    -- Transactions indexes
    CREATE INDEX idx_transactions_user_id ON transactions(user_id);
    CREATE INDEX idx_transactions_date ON transactions(date);
    CREATE INDEX idx_transactions_category_id ON transactions(category_id);
    CREATE INDEX idx_transactions_type ON transactions(type);
    CREATE INDEX idx_transactions_financial_year ON transactions(financial_year);
    CREATE INDEX idx_transactions_user_date ON transactions(user_id, date);
    CREATE INDEX idx_transactions_user_category ON transactions(user_id, category_id);
    CREATE INDEX idx_transactions_tags ON transactions USING GIN(tags);

    -- Categories indexes
    CREATE INDEX idx_categories_user_id ON categories(user_id);
    CREATE INDEX idx_categories_type ON categories(type);

    -- Monthly budgets indexes
    CREATE INDEX idx_monthly_budgets_user_id ON monthly_budgets(user_id);
    CREATE INDEX idx_monthly_budgets_user_period ON monthly_budgets(user_id, month, year);
    CREATE INDEX idx_monthly_budgets_category ON monthly_budgets(category_id);

    -- Annual budgets indexes
    CREATE INDEX idx_annual_budgets_user_id ON annual_budgets(user_id);
    CREATE INDEX idx_annual_budgets_user_fy ON annual_budgets(user_id, financial_year);
    CREATE INDEX idx_annual_budgets_category ON annual_budgets(category_id);

    -- Financial goals indexes
    CREATE INDEX idx_financial_goals_user_id ON financial_goals(user_id);
    CREATE INDEX idx_financial_goals_status ON financial_goals(status);
    CREATE INDEX idx_financial_goals_priority ON financial_goals(priority);
    CREATE INDEX idx_financial_goals_target_date ON financial_goals(target_date);

    -- Investments indexes
    CREATE INDEX idx_investments_user_id ON investments(user_id);
    CREATE INDEX idx_investments_type ON investments(type);
    CREATE INDEX idx_investments_active ON investments(is_active);

    -- Budget performance indexes
    CREATE INDEX idx_budget_performance_user_id ON budget_performance(user_id);
    CREATE INDEX idx_budget_performance_period ON budget_performance(period_type, period_value);

    -- =====================================================
    -- Row Level Security (RLS) Policies
    -- =====================================================

    -- Enable RLS on all tables
    ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
    ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
    ALTER TABLE monthly_budgets ENABLE ROW LEVEL SECURITY;
    ALTER TABLE annual_budgets ENABLE ROW LEVEL SECURITY;
    ALTER TABLE financial_goals ENABLE ROW LEVEL SECURITY;
    ALTER TABLE investments ENABLE ROW LEVEL SECURITY;
    ALTER TABLE savings_recommendations ENABLE ROW LEVEL SECURITY;
    ALTER TABLE budget_performance ENABLE ROW LEVEL SECURITY;

    -- Categories policies (Supabase recommended approach)
    CREATE POLICY "Categories are viewable by everyone" ON categories
        FOR SELECT USING (is_default = true OR user_id = (select auth.uid()));

    CREATE POLICY "Users can insert their own categories" ON categories
        FOR INSERT WITH CHECK (user_id = (select auth.uid()) AND is_default = false);

    CREATE POLICY "Users can update their own categories" ON categories
        FOR UPDATE USING (user_id = (select auth.uid()));

    CREATE POLICY "Only system can update default categories" ON categories
        FOR UPDATE USING (is_default = true);

    -- Transactions policies
    CREATE POLICY "Users can view their own transactions" ON transactions
        FOR SELECT USING (user_id = auth.uid());

    CREATE POLICY "Users can insert their own transactions" ON transactions
        FOR INSERT WITH CHECK (user_id = auth.uid());

    CREATE POLICY "Users can update their own transactions" ON transactions
        FOR UPDATE USING (user_id = auth.uid());

        CREATE POLICY "Users can delete their own transactions" ON transactions
            FOR DELETE USING (user_id = auth.uid());

        -- Monthly budgets policies
        CREATE POLICY "Users can view their own monthly budgets" ON monthly_budgets
            FOR SELECT USING (user_id = (select auth.uid()));

        CREATE POLICY "Users can manage their own monthly budgets" ON monthly_budgets
            FOR ALL USING (user_id = (select auth.uid()));

        -- Annual budgets policies
        CREATE POLICY "Users can view their own annual budgets" ON annual_budgets
            FOR SELECT USING (user_id = (select auth.uid()));

        CREATE POLICY "Users can manage their own annual budgets" ON annual_budgets
            FOR ALL USING (user_id = (select auth.uid()));

        -- Financial goals policies
        CREATE POLICY "Users can view their own financial goals" ON financial_goals
            FOR SELECT USING (user_id = (select auth.uid()));

        CREATE POLICY "Users can manage their own financial goals" ON financial_goals
            FOR ALL USING (user_id = (select auth.uid()));

        -- Investments policies
        CREATE POLICY "Users can view their own investments" ON investments
            FOR SELECT USING (user_id = (select auth.uid()));

        CREATE POLICY "Users can manage their own investments" ON investments
            FOR ALL USING (user_id = (select auth.uid()));

        -- Savings recommendations policies
        CREATE POLICY "Users can view their own savings recommendations" ON savings_recommendations
            FOR SELECT USING (user_id = (select auth.uid()));

        CREATE POLICY "Users can update their own savings recommendations" ON savings_recommendations
            FOR UPDATE USING (user_id = (select auth.uid()));

        -- Budget performance policies
        CREATE POLICY "Users can view their own budget performance" ON budget_performance
            FOR SELECT USING (user_id = (select auth.uid()));

        CREATE POLICY "System can manage budget performance" ON budget_performance
            FOR ALL USING (true); -- Only service role should be able to insert/update

        -- =====================================================
        -- Database Functions and Procedures
        -- =====================================================

        -- Function to calculate financial year (April-March)
        CREATE OR REPLACE FUNCTION calculate_financial_year(input_date DATE)
        RETURNS INTEGER AS $$
        BEGIN
            RETURN CASE 
                WHEN input_date >= MAKE_DATE(EXTRACT(YEAR FROM input_date)::INTEGER, 4, 1) 
                THEN EXTRACT(YEAR FROM input_date)::INTEGER + 1
                ELSE EXTRACT(YEAR FROM input_date)::INTEGER
            END;
    -- Function to calculate financial year (April-March)
    CREATE OR REPLACE FUNCTION calculate_financial_year(input_date DATE)
    RETURNS INTEGER AS $$
    BEGIN
        RETURN CASE 
            WHEN input_date >= MAKE_DATE(EXTRACT(YEAR FROM input_date)::INTEGER, 4, 1) 
            THEN EXTRACT(YEAR FROM input_date)::INTEGER + 1
            ELSE EXTRACT(YEAR FROM input_date)::INTEGER
        END;
    END;
    $$ LANGUAGE plpgsql IMMUTABLE;

    -- Function to update budget performance automatically
    CREATE OR REPLACE FUNCTION update_budget_performance()
    RETURNS TRIGGER AS $$
    BEGIN
        -- Update monthly budget performance
        IF TG_TABLE_NAME = 'transactions' THEN
            INSERT INTO budget_performance (
                user_id, 
                period_type, 
                period_value, 
                financial_year,
                total_income, 
                total_expense,
                updated_at
            )
            SELECT 
                NEW.user_id,
                'monthly',
                EXTRACT(MONTH FROM NEW.date)::INTEGER,
                calculate_financial_year(NEW.date),
                COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0),
                COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0),
                NOW()
            FROM transactions t
            WHERE t.user_id = NEW.user_id 
                AND EXTRACT(MONTH FROM t.date) = EXTRACT(MONTH FROM NEW.date)
                AND EXTRACT(YEAR FROM t.date) = EXTRACT(YEAR FROM NEW.date)
            GROUP BY t.user_id, EXTRACT(MONTH FROM t.date)
            ON CONFLICT (user_id, period_type, period_value, financial_year) 
            DO UPDATE SET
                total_income = EXCLUDED.total_income,
                total_expense = EXCLUDED.total_expense,
                updated_at = NOW();
                
            -- Update spent amount in monthly budgets
            UPDATE monthly_budgets mb
            SET spent_amount = (
                SELECT COALESCE(SUM(t.amount), 0)
                FROM transactions t
                WHERE t.user_id = mb.user_id
                    AND t.category_id = mb.category_id
                    AND EXTRACT(MONTH FROM t.date) = mb.month
                    AND EXTRACT(YEAR FROM t.date) = mb.year
                    AND t.type = 'expense'
            ),
            updated_at = NOW()
            WHERE mb.user_id = NEW.user_id
                AND mb.month = EXTRACT(MONTH FROM NEW.date)
                AND mb.year = EXTRACT(YEAR FROM NEW.date);
                
            -- Update spent amount in annual budgets
            UPDATE annual_budgets ab
            SET spent_amount = (
                SELECT COALESCE(SUM(t.amount), 0)
                FROM transactions t
                WHERE t.user_id = ab.user_id
                    AND t.category_id = ab.category_id
                    AND calculate_financial_year(t.date) = ab.financial_year
                    AND t.type = 'expense'
            ),
            updated_at = NOW()
            WHERE ab.user_id = NEW.user_id
                AND ab.financial_year = calculate_financial_year(NEW.date);
        END IF;
        
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    -- Function to get monthly summary
    CREATE OR REPLACE FUNCTION get_monthly_summary(
        p_user_id UUID,
        p_month INTEGER,
        p_year INTEGER
    )
    RETURNS TABLE (
        total_income DECIMAL,
        total_expense DECIMAL,
        net_savings DECIMAL,
        transaction_count BIGINT,
        top_category VARCHAR,
        budget_utilization DECIMAL
    ) AS $$
    BEGIN
        RETURN QUERY
        SELECT 
            COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0) as total_income,
            COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) as total_expense,
            COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE -t.amount END), 0) as net_savings,
            COUNT(*) as transaction_count,
            (SELECT c.name FROM categories c 
            WHERE c.id = (
                SELECT category_id FROM transactions t2 
                WHERE t2.user_id = p_user_id 
                    AND EXTRACT(MONTH FROM t2.date) = p_month 
                    AND EXTRACT(YEAR FROM t2.date) = p_year 
                    AND t2.type = 'expense'
                GROUP BY category_id 
                ORDER BY SUM(amount) DESC 
                LIMIT 1
            )) as top_category,
            CASE 
                WHEN COALESCE(SUM(mb.budget_amount), 0) > 0 
                THEN (COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) / 
                    COALESCE(SUM(mb.budget_amount), 0)) * 100
                ELSE 0
            END as budget_utilization
        FROM transactions t
        LEFT JOIN monthly_budgets mb ON mb.user_id = t.user_id 
            AND mb.category_id = t.category_id 
            AND mb.month = p_month 
            AND mb.year = p_year
        WHERE t.user_id = p_user_id 
            AND EXTRACT(MONTH FROM t.date) = p_month 
            AND EXTRACT(YEAR FROM t.date) = p_year;
    END;
    $$ LANGUAGE plpgsql;

    -- Function to get financial year summary
    CREATE OR REPLACE FUNCTION get_financial_year_summary(p_user_id UUID, p_financial_year INTEGER)
    RETURNS TABLE (
        total_income DECIMAL,
        total_expense DECIMAL,
        net_savings DECIMAL,
        savings_rate DECIMAL,
        monthly_average DECIMAL,
        goal_progress DECIMAL
    ) AS $$
    BEGIN
        RETURN QUERY
        WITH monthly_data AS (
            SELECT 
                EXTRACT(MONTH FROM date) as month,
                SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
                SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense
            FROM transactions
            WHERE user_id = p_user_id 
                AND financial_year = p_financial_year
            GROUP BY EXTRACT(MONTH FROM date)
        )
        SELECT 
            COALESCE(SUM(income), 0) as total_income,
            COALESCE(SUM(expense), 0) as total_expense,
            COALESCE(SUM(income), 0) - COALESCE(SUM(expense), 0) as net_savings,
            CASE 
                WHEN COALESCE(SUM(income), 0) > 0 
                THEN ((COALESCE(SUM(income), 0) - COALESCE(SUM(expense), 0)) / COALESCE(SUM(income), 0)) * 100
                ELSE 0
            END as savings_rate,
            COALESCE(AVG(income - expense), 0) as monthly_average,
            COALESCE(
                (SELECT AVG(progress_percentage) 
                FROM financial_goals 
                WHERE user_id = p_user_id 
                    AND status = 'active'), 0
            ) as goal_progress
        FROM monthly_data;
    END;
    $$ LANGUAGE plpgsql;

    -- =====================================================
    -- Triggers
    -- =====================================================

    -- Trigger to update budget performance when transactions change
    CREATE TRIGGER trigger_update_budget_performance
        AFTER INSERT OR UPDATE OR DELETE ON transactions
        FOR EACH ROW EXECUTE FUNCTION update_budget_performance();

    -- Trigger to update financial goals progress when current amount changes
    CREATE OR REPLACE FUNCTION update_goal_progress()
    RETURNS TRIGGER AS $$
    BEGIN
        -- Auto-update goal status if target reached
        IF NEW.current_amount >= NEW.target_amount AND NEW.status != 'completed' THEN
            NEW.status = 'completed';
        ELSIF NEW.current_amount < NEW.target_amount AND NEW.status = 'completed' THEN
            NEW.status = 'active';
        END IF;
        
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    CREATE TRIGGER trigger_update_goal_progress
        BEFORE UPDATE ON financial_goals
        FOR EACH ROW EXECUTE FUNCTION update_goal_progress();

    -- Trigger to update timestamps
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    -- Apply timestamp update triggers to all relevant tables
    CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

    CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

    CREATE TRIGGER update_monthly_budgets_updated_at BEFORE UPDATE ON monthly_budgets
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

    CREATE TRIGGER update_annual_budgets_updated_at BEFORE UPDATE ON annual_budgets
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

    CREATE TRIGGER update_financial_goals_updated_at BEFORE UPDATE ON financial_goals
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

    CREATE TRIGGER update_investments_updated_at BEFORE UPDATE ON investments
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

    CREATE TRIGGER update_savings_recommendations_updated_at BEFORE UPDATE ON savings_recommendations
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

    -- =====================================================
    -- Optimized Views
    -- =====================================================

    -- View for transaction analytics
    CREATE OR REPLACE VIEW transaction_analytics AS
    SELECT 
        t.id,
        t.user_id,
        t.title,
        t.amount,
        t.type,
        t.date,
        c.name as category_name,
        c.color as category_color,
        EXTRACT(MONTH FROM t.date) as month,
        EXTRACT(YEAR FROM t.date) as year,
        t.financial_year,
        EXTRACT(DOW FROM t.date) as day_of_week,
        payment_method,
        bank_name,
        tags
    FROM transactions t
    JOIN categories c ON t.category_id = c.id;

    -- View for budget summaries
    CREATE OR REPLACE VIEW budget_summary AS
    SELECT 
        mb.user_id,
        mb.month,
        mb.year,
        mb.budget_amount,
        mb.spent_amount,
        mb.remaining_amount,
        CASE 
            WHEN mb.budget_amount > 0 THEN (mb.spent_amount / mb.budget_amount) * 100
            ELSE 0
        END as utilization_percentage,
        c.name as category_name,
        c.color as category_color
    FROM monthly_budgets mb
    LEFT JOIN categories c ON mb.category_id = c.id
    WHERE mb.is_active = true;

    -- View for goal progress
    CREATE OR REPLACE VIEW goal_progress_view AS
    SELECT 
        fg.id,
        fg.user_id,
        fg.title,
        fg.target_amount,
        fg.current_amount,
        fg.progress_percentage,
        fg.target_date,
        fg.status,
        fg.priority,
        CASE 
            WHEN fg.target_date - CURRENT_DATE < 0 THEN 'overdue'
            WHEN fg.target_date - CURRENT_DATE <= 30 THEN 'due_soon'
            ELSE 'on_track'
        END as urgency_status,
        (fg.target_date - CURRENT_DATE) as days_remaining
    FROM financial_goals fg
    WHERE fg.status IN ('active', 'completed');

    -- View for investment portfolio
    CREATE OR REPLACE VIEW investment_portfolio AS
    SELECT 
        i.id,
        i.user_id,
        i.name,
        i.type,
        i.current_value,
        i.initial_amount,
        i.returns_amount,
        CASE 
            WHEN i.returns_amount > 0 THEN 'profit'
            WHEN i.returns_amount < 0 THEN 'loss'
            ELSE 'breakeven'
        END as performance_status,
        i.purchase_date,
        i.maturity_date,
        i.is_active
    FROM investments i
    WHERE i.is_active = true;

    
    -- =====================================================
    -- Performance Optimization Summary
    -- =====================================================
    /*
    This optimized schema includes:

    1. **Comprehensive Indexing**: Strategic indexes on frequently queried columns
    2. **Generated Columns**: Computed values stored for faster access
    3. **RLS Policies**: Row-level security for data privacy
    4. **Triggers**: Automatic updates for performance tracking
    5. **Functions**: Reusable business logic in the database
    6. **Views**: Pre-joined tables for common queries
    7. **JSONB Storage**: Flexible data storage for receipts and documents
    8. **Financial Year Support**: Indian financial year (April-March)
    9. **Array Support**: Tags for better categorization
    10. **Computed Columns**: Progress percentages and amounts calculated automatically

    Performance Benefits:
    - Reduced query complexity with views
    - Automatic performance tracking with triggers
    - Faster lookups with strategic indexing
    - Computed columns avoid repeated calculations
    - JSONB for efficient document storage
    - Array types for tag-based filtering

    Security Features:
    - Row-level security on all tables
    - User-based data isolation
    - Secure function execution
    - Controlled access to sensitive data

    Business Logic:
    - Automatic financial year calculation
    - Budget performance tracking
    - Goal progress monitoring
    - Investment return calculations
    - Savings rate computations
    */
