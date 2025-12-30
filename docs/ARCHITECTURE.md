# FinTrack Architecture Documentation

## Overview

FinTrack is a comprehensive personal finance management application designed specifically for Indian users. This document serves as the single source of truth for the application's architecture, patterns, and development guidelines.

## Technology Stack

### Frontend
- **Framework**: Vue 3 (Composition API)
- **Build Tool**: Vite
- **State Management**: Pinia
- **Routing**: Vue Router 4
- **Styling**: Tailwind CSS
- **UI Components**: Headless UI
- **Icons**: Heroicons
- **Language**: JavaScript (ES6+)

### Backend
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Real-time**: Supabase Realtime
- **Storage**: Supabase Storage

## Project Structure
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


---

## Data Flow

### Authentication Flow
- User credentials → Auth Store → Supabase Auth  
- JWT token issued and stored in **secure HTTP-only cookies**
- Protected routes validated via token
- Automatic token refresh before expiry

### Data Fetching
- Components → Pinia Actions → Supabase Client → Database
- Real-time subscriptions for live updates
- Client-side caching with TTL (time-to-live)

### State Management
- Pinia stores for global state
- Local component state for UI-specific data
- Optimistic UI updates with rollback on failure

---

## Security

### Authentication
- JWT-based authentication
- Secure cookie storage
- CSRF protection
- Rate limiting on authentication endpoints

### Data Protection
- Row Level Security (RLS) on all database tables
- Input validation and sanitization
- XSS protection headers
- Secure API endpoints

---

## Performance

### Frontend
- Code splitting with dynamic imports
- Lazy-loaded routes
- Optimized asset loading
- Client-side caching strategies

### Backend
- Database indexing
- Query optimization
- Connection pooling
- Caching layer

---

## Development Guidelines

### Code Style
- Vue Composition API with `<script setup>`
- TypeScript-like interfaces using JSDoc
- Consistent file naming (`kebab-case.vue`)
- Component structure:
  1. Template  
  2. Script  
  3. Style (scoped)

### State Management
- Use Pinia for global state
- Keep UI-only state local to components
- Use actions for async operations
- Use getters for computed state

---

## Testing
- Unit tests with **Vitest**
- Component tests with **Vue Test Utils**
- End-to-end tests with **Cypress**
- Minimum **80% test coverage** required

---

## Deployment

### Environments
- Development (local)
- Staging (preview)
- Production

### CI/CD
- Automated tests on pull requests
- Preview deployments for feature branches
- Manual approval required for production
- Rollback strategy in place

---

## Monitoring

### Error Tracking
- Client-side error logging
- Server-side error tracking
- Performance monitoring
- User session recording

### Analytics
- Feature usage tracking
- Performance metrics
- Error rates
- User flow analysis

---

## Future Improvements

### Technical Debt
- Migrate to TypeScript
- Implement GraphQL layer
- Add service workers for offline support
- Implement WebSockets for real-time updates

### Features
- Multi-currency support
- Bank integrations (UPI, NACH)
- AI-powered financial insights
- Mobile app (React Native)

---

## Versioning
- Semantic Versioning
  - **MAJOR**: Breaking changes
  - **MINOR**: New features
  - **PATCH**: Bug fixes

---

## Database Migrations
- Version-controlled migrations
- Rollback support
- Data migration scripts

---

## Contributing

### Workflow
1. Create a feature branch
2. Write tests
3. Implement changes
4. Update documentation
5. Create a pull request
6. Code review
7. Merge to `main`

### Code Review Rules
- At least one approval required
- No direct pushes to `main`
- All tests must pass
- Documentation updates required
