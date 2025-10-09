# StaySecure Hub

A comprehensive cybersecurity training and compliance platform built with React, TypeScript, and Supabase.

## Features

- 🔐 **Authentication & User Management** - Secure authentication with email activation
- 📚 **Learning Tracks** - Structured learning paths with flexible scheduling
- 🔔 **Smart Notifications** - Automated lesson reminders and email notifications
- 👥 **User Management** - Role-based access control (super_admin, client_admin, user, etc.)
- 📊 **Progress Tracking** - Monitor user progress and compliance status
- 🎯 **Interactive Lessons** - Engaging cybersecurity training content with quizzes
- ⚡ **Real-time Updates** - Live notifications and progress updates
- 📜 **Certificates** - Track training certificates and compliance

## Notification System

### Current Release: Automated Lesson Reminders ✅

The platform includes automatic lesson reminders that notify users when lessons become available based on their learning track schedule.

**Quick Start**: [LESSON_REMINDERS_QUICKSTART.md](./LESSON_REMINDERS_QUICKSTART.md)  
**Full Documentation**: [LESSON_REMINDERS_SETUP.md](./LESSON_REMINDERS_SETUP.md)

### Next Release: Template-Based Notification System 📋

A comprehensive, template-based notification system is fully documented and ready for implementation. Client admins will be able to:
- ✅ Edit notification templates (customize messaging and branding)
- ✅ Configure notification rules (control when notifications are sent)
- ✅ Create custom notification types
- ✅ View notification analytics

**Documentation** (⭐ START HERE):
- 🚀 [**SIMPLIFIED Summary**](./NOTIFICATION_SIMPLIFIED_SUMMARY.md) - **Read this first!** (Uses existing email_templates)
- 📦 [Standalone Module](./NOTIFICATION_STANDALONE_MODULE.md) - Works in LEARN, GOVERN, Lovable!
- 📖 [System Overview](./NOTIFICATION_SYSTEM_OVERVIEW.md) - Architecture
- 📋 [Learning Progress Notifications](./LEARNING_PROGRESS_NOTIFICATIONS.md) - 17 notification types
- 🗄️ [Database Schema](./NOTIFICATION_DATABASE_SCHEMA.md) - Only 2 new tables!
- 🔨 [Implementation Guide](./NOTIFICATION_IMPLEMENTATION_GUIDE.md) - 3 days (database) + 2-4 weeks (UI)
- 📧 [Template Examples](./NOTIFICATION_TEMPLATE_EXAMPLES.md) - Ready-to-use HTML
- 👨‍💼 [Admin Guide](./NOTIFICATION_ADMIN_GUIDE.md) - For client administrators

**Future** (Gamification):
- 🚀 [Gamification Roadmap](./GAMIFICATION_ROADMAP.md) - Badges, streaks, leaderboards (2026-2027)

**Index**: [Complete Documentation Index](./NOTIFICATION_DOCUMENTATION_INDEX.md)

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **UI**: shadcn/ui + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Auth**: Supabase Auth with custom flows
- **Email**: AWS SES integration
- **Modules**: Monorepo with dedicated modules (auth, notifications, organisation, database)

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      ...tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      ...tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      ...tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
