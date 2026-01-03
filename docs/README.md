# StaySecure Platform Documentation

A comprehensive cybersecurity training and compliance platform built with React, TypeScript, and Supabase.

## Platform Overview

| Application | Description | Port |
|-------------|-------------|------|
| **Learn** | Cybersecurity training platform for end users | 80xx |
| **Govern** | Compliance and governance management | 51xx |

## Architecture

```
staysecure-projects/
├── learn/          # Main learning application
├── govern/         # Governance & compliance app
├── auth/           # Shared authentication module
├── organisation/   # Shared user/org management module
├── notifications/  # Shared notification module
├── deploy/         # Deployment scripts & client onboarding
└── docs/           # This directory - cross-cutting docs
```

## Quick Links

### Cross-Cutting Documentation (this directory)

| Document | Description |
|----------|-------------|
| [MODULE_ARCHITECTURE.md](./MODULE_ARCHITECTURE.md) | How shared modules work |
| [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) | Database migration guide |
| [AUTH_LAMBDA_SETUP.md](./AUTH_LAMBDA_SETUP.md) | AWS Lambda email setup |
| [EMAIL_LAYOUT_SYSTEM.md](./EMAIL_LAYOUT_SYSTEM.md) | Email template system |
| [GAMIFICATION_ROADMAP.md](./GAMIFICATION_ROADMAP.md) | Future gamification plans |

### Project-Specific Documentation

#### Learn (`learn/docs/`)

| Category | Documents |
|----------|-----------|
| **Deployment** | [DEPLOYMENT.md](../learn/docs/DEPLOYMENT.md), [VERCEL_ENV_SETUP.md](../learn/docs/VERCEL_ENV_SETUP.md), [VERCEL_STAGING_SETUP.md](../learn/docs/VERCEL_STAGING_SETUP.md) |
| **Authentication** | [ACTIVATION_LINK_PARSING.md](../learn/docs/ACTIVATION_LINK_PARSING.md), [CHANGE_PASSWORD_IMPLEMENTATION.md](../learn/docs/CHANGE_PASSWORD_IMPLEMENTATION.md), [TWO_FACTOR_AUTHENTICATION_IMPLEMENTATION.md](../learn/docs/TWO_FACTOR_AUTHENTICATION_IMPLEMENTATION.md), [JWT_CONFIGURATION.md](../learn/docs/JWT_CONFIGURATION.md) |
| **Lessons & Content** | [LESSON_IMPORT_TEMPLATE.md](../learn/docs/LESSON_IMPORT_TEMPLATE.md), [LESSON_CONTENT_SYNC_IMPLEMENTATION.md](../learn/docs/LESSON_CONTENT_SYNC_IMPLEMENTATION.md), [SYNC_LESSON_CONTENT_README.md](../learn/docs/SYNC_LESSON_CONTENT_README.md) |
| **Testing** | [LOCAL_TEST_SETUP.md](../learn/docs/LOCAL_TEST_SETUP.md), [LESSON_TESTING_SETUP.md](../learn/docs/LESSON_TESTING_SETUP.md), [TEST_PLAN.md](../learn/docs/TEST_PLAN.md) |
| **Progress & Metrics** | [LEARNING_HOURS_CALCULATION.md](../learn/docs/LEARNING_HOURS_CALCULATION.md), [USER_REPORT_SQL_QUERIES.md](../learn/docs/USER_REPORT_SQL_QUERIES.md) |
| **Troubleshooting** | [DEBUG_ACTIVATION.md](../learn/docs/DEBUG_ACTIVATION.md), [FIX_ACTIVATION_EXPIRY.md](../learn/docs/FIX_ACTIVATION_EXPIRY.md), [NETWORK_DEBUG_INSTRUCTIONS.md](../learn/docs/NETWORK_DEBUG_INSTRUCTIONS.md) |
| **Technical** | [TECHNICAL_DEBT.md](../learn/docs/TECHNICAL_DEBT.md), [SCHEMA_VERIFICATION.md](../learn/docs/SCHEMA_VERIFICATION.md), [MULTIPLE_CORRECT_ANSWERS_FIX.md](../learn/docs/MULTIPLE_CORRECT_ANSWERS_FIX.md) |

#### Govern (`govern/docs/`)

| Document | Description |
|----------|-------------|
| [KEY_DATES_DUE_DATE_CALCULATION.md](../govern/docs/KEY_DATES_DUE_DATE_CALCULATION.md) | Due date calculation logic |

#### Notifications (`notifications/docs/`)

| Category | Documents |
|----------|-----------|
| **Getting Started** | [START_HERE_NOTIFICATIONS.md](../notifications/docs/START_HERE_NOTIFICATIONS.md), [README.md](../notifications/docs/README.md) |
| **Architecture** | [NOTIFICATION_SYSTEM_OVERVIEW.md](../notifications/docs/NOTIFICATION_SYSTEM_OVERVIEW.md), [NOTIFICATION_STANDALONE_MODULE.md](../notifications/docs/NOTIFICATION_STANDALONE_MODULE.md), [NOTIFICATION_DATABASE_SCHEMA.md](../notifications/docs/NOTIFICATION_DATABASE_SCHEMA.md) |
| **Implementation** | [IMPLEMENTATION_STRATEGY.md](../notifications/docs/IMPLEMENTATION_STRATEGY.md), [NOTIFICATION_IMPLEMENTATION_STATUS.md](../notifications/docs/NOTIFICATION_IMPLEMENTATION_STATUS.md), [LEARNING_PROGRESS_NOTIFICATIONS.md](../notifications/docs/LEARNING_PROGRESS_NOTIFICATIONS.md) |
| **Templates & Types** | [NOTIFICATION_TEMPLATE_EXAMPLES.md](../notifications/docs/NOTIFICATION_TEMPLATE_EXAMPLES.md), [NOTIFICATION_TYPES_REFERENCE.md](../notifications/docs/NOTIFICATION_TYPES_REFERENCE.md) |
| **Admin** | [NOTIFICATION_ADMIN_GUIDE.md](../notifications/docs/NOTIFICATION_ADMIN_GUIDE.md), [LESSON_REMINDERS_SECURITY.md](../notifications/docs/LESSON_REMINDERS_SECURITY.md) |
| **Certificates** | [CERTIFICATE_GENERATION_PLAN.md](../notifications/docs/CERTIFICATE_GENERATION_PLAN.md) |

#### Deploy (`deploy/scripts/`)

| Document | Description |
|----------|-------------|
| [CLIENT_ONBOARDING.md](../deploy/CLIENT_ONBOARDING.md) | New client setup process |
| [SCHEMA_RESTORATION_BEST_PRACTICES.md](../deploy/SCHEMA_RESTORATION_BEST_PRACTICES.md) | Database restoration guide |

#### Organisation (`organisation/docs/`)

| Document | Description |
|----------|-------------|
| [USAGE.md](../organisation/docs/USAGE.md) | How to use the organisation module |

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **UI**: shadcn/ui + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Auth**: Supabase Auth with custom flows
- **Email**: AWS SES integration
- **Hosting**: Vercel

## Shared Modules

| Module | Package | Description |
|--------|---------|-------------|
| `auth` | `staysecure-auth` | Authentication components & hooks |
| `organisation` | `staysecure-organisation` | User management, profiles, departments |
| `notifications` | `staysecure-notifications` | Email notifications & templates |

All modules are installed via git:
```bash
npm install github:kahuna-rayn/staysecure-auth
npm install github:kahuna-rayn/staysecure-organisation
npm install github:kahuna-rayn/staysecure-notifications
```

## Development Workflow

1. Work on `dev` branch
2. Test locally
3. Merge to `staging` for staging deployment
4. Merge `staging` → `dev` → `main` for production
