# Changelog

All notable changes to FinTrack will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.38] - 2025-12-24

### Fixed
- Fixed monthly budget deletion functionality by adding missing delete confirmation dialog
- Fixed annual budget creation 400 error by aligning database schema with code
- Updated template references from `annual_amount` to `budget_amount` for consistency
- Removed non-existent database fields (`monthly_breakdown`, `notes`) from annual budget operations
- Enhanced budget management UI with proper error handling and user feedback

### Improved
- Better error handling for budget operations
- Consistent database field naming across all budget components
- More reliable budget deletion with confirmation dialogs

## [Unreleased]

### Added
- Version management system with centralized configuration
- UTC timestamp handling utilities
- Professional README documentation
- Mobile and desktop responsive design improvements
- Comprehensive authentication flow with Supabase
- Tailwind CSS integration with proper configuration
- Payment method field in transaction form
- Enhanced accessibility with ARIA attributes
- Modern UI components with accent colors
- Touch-friendly form inputs with large sizing
- Smooth transitions and hover effects

### Changed
- Improved mobile responsiveness across all pages
- Enhanced dashboard layout for better user experience
- Updated auth pages with better form validation
- Optimized navigation patterns for different screen sizes
- Updated Add Transaction page with modern design
- Enhanced SettingsView with better mobile layout
- Improved form validation and user feedback
- **Database Integration**: Transformed AddTransaction component from hardcoded data to database-driven categories and payment methods using Supabase stores

### Fixed
- Tailwind CSS v4 compatibility issues
- PostCSS configuration errors
- Path alias resolution in Vite
- Mobile layout inconsistencies
- Manage button overlapping in SettingsView
- Duplicate Back button in AddTransaction
- Missing HeadlessUI component imports
- Build warnings and compilation errors

## [0.0.15] - 2025-12-16

### Added
- Initial release of FinTrack
- Vue 3 + Composition API setup
- Vite build system configuration
- Tailwind CSS styling framework
- Supabase authentication integration
- Pinia state management
- Vue Router with route guards
- Responsive dashboard interface
- User authentication (login, register, password reset)
- Profile management system
- Financial overview dashboard
- Transaction tracking interface
- Budget management features
- Mobile-first responsive design
- Headless UI components integration
- Heroicons for consistent iconography

### Security
- Row Level Security (RLS) policies for Supabase
- Secure authentication flows
- Environment variable protection
- Input validation and sanitization

### Infrastructure
- Semantic versioning implementation
- UTC timestamp standardization
- Change log management system
- Professional documentation
- Development environment setup

---

## Versioning Strategy

FinTrack follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html):

- **MAJOR**: Breaking changes that require migration
- **MINOR**: New features and improvements (backward compatible)
- **PATCH**: Bug fixes and security updates (backward compatible)

## Timestamp Strategy

All timestamps in FinTrack follow this pattern:

1. **Storage**: UTC timestamps in ISO 8601 format
2. **Display**: Local timezone conversion for user interface
3. **Consistency**: Single source of truth through date utilities

## Release Process

1. Update version in `src/config/version.ts`
2. Add changelog entries
3. Update build date automatically
4. Update documentation
5. Tag release in version control
