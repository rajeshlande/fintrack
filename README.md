# FinTrack - Personal Finance Management

[![Version](https://img.shields.io/badge/version-0.0.38-blue.svg)](https://github.com/yourusername/fintrack)
[![Vue](https://img.shields.io/badge/Vue-3.5.24-green.svg)](https://vuejs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-2.87.2-orange.svg)](https://supabase.com/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

A comprehensive personal finance management application designed specifically for Indian users, featuring budget tracking, expense management, financial goals, and investment portfolio monitoring with April-March financial year support.

## 🌟 Features

### 💰 Core Financial Management
- **Transaction Tracking**: Record income, expenses, and transfers with detailed categorization
- **Budget Management**: Set monthly and annual budgets with real-time tracking and alerts
- **Financial Goals**: Create and track multiple financial objectives with progress monitoring
- **Investment Portfolio**: Monitor investments, returns, and portfolio performance
- **Tax Calculator**: Built-in tax calculation tools for Indian tax system

### 📊 Analytics & Insights
- **Dashboard Overview**: Comprehensive financial summary with key metrics
- **Spending Analytics**: Category-wise expense analysis with charts and trends
- **Budget Performance**: Visual budget vs. actual spending comparisons
- **Savings Recommendations**: AI-powered investment suggestions based on risk profile
- **Transaction Analytics**: Detailed transaction analysis with filtering and search

### 🔐 Security & Privacy
- **Secure Authentication**: Supabase-powered user authentication with email/password
- **Data Privacy**: Row-level security ensuring users only access their own data
- **Encrypted Storage**: Secure storage of financial information
- **Privacy-First**: No data sharing with third parties

### 📱 User Experience
- **Mobile-First Design**: Responsive design optimized for mobile and desktop
- **Indian Context**: Indian rupee formatting, financial year (April-March) support
- **Accessibility**: ARIA-compliant interface with keyboard navigation
- **Offline Support**: Progressive Web App capabilities for offline access

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Supabase account and project

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/fintrack.git
   cd fintrack
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```

   Configure your `.env` file:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Database Setup**
   - Go to your Supabase dashboard
   - Navigate to SQL Editor
   - Execute the database schema from `database/optimized_database_schema_complete.sql`
   - Optional: Add sample data from `scripts/insert-default-categories.js`

5. **Start Development Server**
   ```bash
   npm run dev
   ```

6. **Build for Production**
   ```bash
   npm run build
   npm run preview
   ```

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Vue 3 (Composition API), Vite
- **Backend**: Supabase (PostgreSQL)
- **State Management**: Pinia
- **Styling**: Tailwind CSS
- **UI Components**: Headless UI
- **Icons**: Heroicons
- **Routing**: Vue Router 4

### Project Structure
```
fintrack/
├── src/
│   ├── components/          # Reusable Vue components
│   │   ├── budget/         # Budget-related components
│   │   ├── auth/           # Authentication components
│   │   └── ...             # Other feature components
│   ├── views/              # Page-level components
│   ├── stores/             # Pinia state management
│   ├── services/           # API service layer
│   ├── lib/                # External library configurations
│   ├── router/             # Vue Router configuration
│   ├── utils/              # Utility functions
│   └── config/             # Application configuration
├── database/               # Database schemas and migrations
├── scripts/                # Build and utility scripts
├── public/                 # Static assets
└── docs/                   # Documentation
```

### Database Schema
The application uses a comprehensive PostgreSQL schema with:
- **Transactions**: Income, expense, and transfer tracking
- **Categories**: Hierarchical categorization system
- **Budgets**: Monthly and annual budget management
- **Goals**: Financial goal setting and progress tracking
- **Investments**: Portfolio management and performance tracking
- **Performance**: Automated budget vs. actual analysis

## 📖 Usage Guide

### Getting Started
1. **Sign Up**: Create an account with email and password
2. **Set Up Categories**: Configure income and expense categories
3. **Add Transactions**: Start recording your financial activities
4. **Create Budgets**: Set monthly and annual spending limits
5. **Track Goals**: Define and monitor financial objectives

### Key Workflows

#### Transaction Management
- Navigate to "Add Transaction" from dashboard
- Select transaction type (Income/Expense/Transfer)
- Choose category and add details
- Upload receipts for expense tracking
- View all transactions in the Transactions page

#### Budget Planning
- Go to Budget section
- Create monthly budgets by category
- Set annual budgets for long-term planning
- Monitor budget utilization with alerts
- Review budget performance analytics

#### Goal Setting
- Access Goals tab in Budget section
- Create goals with target amounts and dates
- Set up automatic contributions
- Track progress with visual indicators

## 🔧 Configuration

### Environment Variables
```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Optional: Development settings
VITE_APP_ENV=development
```

### Build Configuration
The application uses Vite for building. Key configuration files:
- `vite.config.js`: Build and development server configuration
- `tailwind.config.js`: Tailwind CSS customization
- `postcss.config.js`: PostCSS processing configuration

## 🧪 Development

### Available Scripts
```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run build:static    # Build static version
npm run preview         # Preview production build

# Database
npm run db:setup        # Run database setup scripts
npm run db:seed         # Seed database with sample data
```

### Code Quality
- **ESLint**: JavaScript/Vue linting
- **Prettier**: Code formatting
- **TypeScript**: Type checking (planned)
- **Testing**: Unit and integration tests (planned)

### Contributing
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📊 Database Management

### Schema Overview
The database includes optimized tables with:
- **Row Level Security (RLS)**: User data isolation
- **Indexes**: Performance optimization for common queries
- **Triggers**: Automated calculations and updates
- **Views**: Pre-computed analytics data
- **Functions**: Business logic in the database layer

### Key Tables
- `transactions`: Financial transaction records
- `categories`: Income/expense categorization
- `monthly_budgets`: Monthly budget allocations
- `annual_budgets`: Annual budget planning
- `financial_goals`: Goal setting and tracking
- `investments`: Investment portfolio data
- `budget_performance`: Budget vs. actual analysis

## 🔒 Security

### Authentication
- Supabase Auth with email/password
- Secure password reset flow
- Session management with automatic refresh

### Data Protection
- Row Level Security on all database tables
- Input validation and sanitization
- Secure API communication
- No sensitive data logging

### Privacy Compliance
- GDPR-compliant data handling
- User data export capabilities
- Right to data deletion
- Transparent data usage policies

## 📱 Mobile & PWA

### Progressive Web App
- Installable on mobile devices
- Offline transaction recording
- Push notifications for budget alerts
- Native app-like experience

### Responsive Design
- Mobile-first approach
- Touch-optimized interfaces
- Adaptive layouts for all screen sizes
- Optimized performance on mobile networks

## 🚀 Deployment

### Production Build
```bash
npm run build
```

### Deployment Options
- **Vercel**: Recommended for Vue applications
- **Netlify**: Static site hosting with form handling
- **Railway**: Full-stack deployment with database
- **Docker**: Containerized deployment

### Environment Setup
Ensure production environment variables are set:
- Supabase production project URL and keys
- Proper CORS configuration
- SSL certificate for HTTPS

## 📈 Roadmap

### Upcoming Features
- [ ] **Bank Integration**: Direct bank statement imports
- [ ] **Bill Reminders**: Automated payment notifications
- [ ] **Advanced Analytics**: Machine learning insights
- [ ] **Family Budgeting**: Multi-user family accounts
- [ ] **Investment Tracking**: Real-time portfolio updates
- [ ] **Tax Optimization**: Advanced tax planning tools
- [ ] **Mobile Apps**: Native iOS and Android applications

### Technical Improvements
- [ ] **Offline Support**: Enhanced PWA capabilities
- [ ] **API Rate Limiting**: Performance optimization
- [ ] **Advanced Security**: Multi-factor authentication
- [ ] **Testing Suite**: Comprehensive test coverage
- [ ] **Performance Monitoring**: Real-time performance tracking

## 🐛 Troubleshooting

### Common Issues

**Database Connection Errors**
- Verify Supabase URL and keys in `.env`
- Check Supabase project status
- Ensure database schema is properly deployed

**Build Errors**
- Clear node_modules: `rm -rf node_modules && npm install`
- Check Node.js version compatibility
- Verify all dependencies are installed

**Authentication Issues**
- Check Supabase Auth configuration
- Verify email templates are set up
- Ensure proper redirect URLs

### Support
- **Documentation**: Check the `/docs` folder
- **Issues**: Report bugs on GitHub
- **Discussions**: Community support forum
- **Email**: Contact the maintainers

## 🏷️ Versioning

This project uses manual semantic versioning. You can bump the version and update changelogs using the following npm scripts:

- **Major version bump:**
  ```bash
  npm run version:major
  ```
- **Minor version bump:**
  ```bash
  npm run version:minor
  ```
- **Patch version bump:**
  ```bash
  npm run version:patch
  ```

These scripts will update `package.json`, `src/config/version.ts`, and the `CHANGELOG.md` file. The version is only changed when you run one of these commands.

The normal build process (`npm run build`) does not change the version.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Vue.js Team** for the amazing framework
- **Supabase Team** for the excellent backend platform
- **Tailwind CSS** for the utility-first CSS framework
- **Indian Finance Community** for inspiration and requirements

## 📞 Contact

- **Project Link**: [https://github.com/yourusername/fintrack](https://github.com/yourusername/fintrack)
- **Email**: your-email@example.com
- **LinkedIn**: [Your LinkedIn Profile](https://linkedin.com/in/yourprofile)

---

**FinTrack** - Take control of your personal finances with intelligent budgeting and comprehensive financial management tools designed for the Indian market.