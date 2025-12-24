# FinTrack Budget Management System

A comprehensive budget tracking and financial planning system designed for Indian users with April-March financial year support.

## Features Implemented

### 🎯 Core Budget Management
- **Monthly Budgets**: Category-wise monthly budget planning with alerts at 80% and 100% utilization
- **Annual Budgets**: Yearly budget allocation with monthly breakdown options
- **Financial Year Support**: April-March financial year alignment for Indian context
- **Budget Performance Tracking**: Real-time budget vs actual analysis with visual indicators

### 📊 Analytics & Visualization
- **Budget Progress Charts**: Visual representation of budget utilization across categories
- **Category Spending Breakdown**: Pie and bar charts for expense analysis
- **Budget Alerts**: Smart notifications for overspending and near-limit warnings
- **Financial Summary Cards**: Key metrics including savings rate and goals progress

### 🎯 Goals Integration
- **Financial Goals**: Create and track multiple financial goals
- **Goal Types**: Emergency fund, home purchase, education, retirement, travel, vehicle, investment
- **Progress Tracking**: Visual progress bars with target dates and monthly contributions
- **Goal Categories**: Priority levels (low, medium, high) and linked investment types

### 💰 Savings Recommendations
- **Risk Profiling**: Conservative, moderate, and aggressive risk profiles
- **Smart Allocation**: AI-powered investment recommendations based on surplus and risk tolerance
- **Investment Types**: Support for FD, RD, SIP, Equity/Debt Mutual Funds, Stocks, PPF, EPF
- **Explainable Recommendations**: Clear explanations for each investment suggestion

### 🏦 Indian Financial Context
- **Currency Formatting**: Indian rupee formatting (₹1,00,000)
- **Tax Considerations**: Integration with existing Indian tax calculation system
- **Banking Integration**: Support for major Indian banks and payment methods
- **Festival Planning**: Special budget categories for Indian festivals and celebrations

## Database Schema

### Core Tables
- `monthly_budgets`: Monthly budget allocations by category
- `annual_budgets`: Yearly budget planning with monthly breakdown
- `financial_goals`: Goal setting and progress tracking
- `investments`: Investment portfolio management
- `savings_recommendations`: AI-powered savings suggestions
- `budget_performance`: Budget vs actual tracking
- `categories`: Income and expense categories

### Key Features
- **Row Level Security**: User data isolation
- **Financial Year Functions**: Helper functions for April-March calculations
- **Automated Calculations**: Variance and percentage computations
- **Indexing**: Optimized queries for performance

## Component Architecture

### Budget Components (`/src/components/budget/`)
- `BudgetSummary.vue`: Overview cards and key metrics
- `MonthlyBudgetForm.vue`: Create/edit monthly budgets
- `AnnualBudgetForm.vue`: Create/edit annual budgets
- `BudgetProgressChart.vue`: Visual budget utilization
- `CategorySpendingChart.vue`: Expense breakdown charts
- `SavingsRecommendations.vue`: Investment suggestions
- `FinancialGoals.vue`: Goals management interface

### Store Management (`/src/stores/`)
- `budget.js`: Complete budget state management
- `finance.js`: Extended with budget integration
- `auth.js`: User authentication (existing)

### API Services (`/src/services/`)
- `budgetService.js`: Budget CRUD operations
- `goalsService.js`: Goals management
- `investmentsService.js`: Investment tracking
- `savingsService.js`: Recommendations engine
- `analyticsService.js`: Data analytics
- `categoriesService.js`: Category management

## Responsive Design

### Mobile-First Approach
- **Mobile (< 768px)**: Single-column layouts, bottom sheets, large touch targets
- **Tablet (768px - 1024px)**: Two-column layouts, enhanced interactions
- **Desktop (> 1024px)**: Multi-column layouts, hover states, tooltips

### UI Framework
- **Tailwind CSS**: Utility-first styling
- **Headless UI**: Accessible component primitives
- **Heroicons**: Consistent iconography
- **Vue 3 Composition API**: Modern reactive patterns

## Investment Recommendation Logic

### Risk Profiles
- **Conservative**: 40% Emergency Fund, 30% FD, 20% RD, 10% Debt MF
- **Moderate**: 20% Emergency Fund, 20% FD, 15% RD, 25% Debt MF, 15% Equity MF, 5% Stocks
- **Aggressive**: 10% Emergency Fund, 10% FD, 10% RD, 20% Debt MF, 35% Equity MF, 15% Stocks

### Investment Types Supported
- **Fixed Deposit (FD)**: Safe, guaranteed returns
- **Recurring Deposit (RD)**: Monthly savings with fixed returns
- **Systematic Investment Plan (SIP)**: Regular mutual fund investments
- **Equity Mutual Funds**: Higher risk, growth potential
- **Debt Mutual Funds**: Lower risk, stable returns
- **Direct Stocks**: High risk, high return potential
- **Public Provident Fund (PPF)**: Tax-advantaged retirement savings
- **Employee Provident Fund (EPF)**: Employer-sponsored retirement fund

## Sample Data

### Indian Family Profile
- **Monthly Income**: ₹1,00,000 (₹85,000 salary + ₹15,000 freelance)
- **Monthly Expenses**: ₹60,599 (typical middle-class family)
- **Savings Rate**: 39.4%
- **Financial Goals**: Emergency fund, home down payment, education, retirement
- **Investment Portfolio**: Mix of conservative and moderate instruments

### Budget Categories
- **Essential**: Groceries, utilities, rent, transport, medical
- **Lifestyle**: Restaurants, entertainment, shopping, festivals
- **Financial**: EMI, insurance, investments, taxes
- **Goals**: Education, travel, vehicle purchase

## Getting Started

### 1. Database Setup
```sql
-- Run the database schema
\i database_schema.sql

-- Insert sample data (optional)
\i sample_data.sql
```

### 2. Environment Configuration
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Installation & Development
```bash
npm install
npm run dev
```

### 4. Access Budget System
Navigate to `http://localhost:5173/budget` after starting the development server.

## Security & Privacy

### Data Protection
- **Row Level Security**: User data isolation in Supabase
- **Input Validation**: Client and server-side validation
- **Secure Storage**: Sensitive financial data encryption
- **Privacy First**: No data sharing with third parties

### Financial Disclaimers
- **Not Financial Advice**: Clear disclaimers on all recommendations
- **Risk Warnings**: Appropriate risk disclosures
- **Educational Purpose**: System designed for financial planning education
- **Professional Advice**: Recommendations to consult financial advisors

## Future Enhancements

### Planned Features
- **Bank Account Integration**: Direct bank statement imports
- **Bill Reminders**: Automated bill payment reminders
- **Tax Optimization**: Advanced tax planning suggestions
- **Investment Tracking**: Real-time portfolio value updates
- **Family Budgeting**: Multi-user family budget management
- **Reporting**: Advanced financial reports and insights

### Technical Improvements
- **Offline Support**: PWA capabilities for offline access
- **Mobile App**: Native mobile applications
- **API Integration**: Third-party financial service integrations
- **Machine Learning**: Enhanced recommendation algorithms
- **Export Features**: PDF/Excel export capabilities

## Support & Contributing

### Documentation
- **API Documentation**: Complete API reference
- **User Guide**: Step-by-step user instructions
- **Developer Guide**: Contribution guidelines
- **Database Schema**: Detailed schema documentation

### Community
- **Issues**: Bug reports and feature requests
- **Discussions**: Community support and discussions
- **Contributions**: Pull requests and code contributions
- **Feedback**: User feedback and improvement suggestions

---

**FinTrack Budget System** - Empowering Indian users with comprehensive financial planning and budget management tools.
