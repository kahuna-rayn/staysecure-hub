# Organisation Management Module

A reusable React component library for organisation management, including user management, roles, departments, locations, and certificates.

## Features

- **User Management**: Create, edit, and manage user profiles with role-based permissions
- **Role Management**: Define and manage organizational roles with department associations
- **Department Management**: Organize users into departments with manager assignments
- **Location Management**: Track physical locations and facilities
- **Certificate Management**: Manage organizational certificates and compliance documents
- **Organisation Profile**: Maintain organization details and contact information

## Installation

### As Git Submodule

```bash
# Add as submodule to your project
git submodule add https://github.com/yourorg/organisation-management-module.git src/modules/organisation
git submodule update --init --recursive
```

### As NPM Package

```bash
npm install @yourorg/organisation-management
```

## Usage

### Basic Setup

```tsx
import React from 'react';
import { OrganisationPanel, OrganisationProvider } from '@yourorg/organisation-management';
import { supabase } from './supabase-client';

function App() {
  const organisationConfig = {
    supabaseClient: supabase,
    enabledTabs: ['users', 'roles', 'departments', 'locations', 'certificates', 'profile'],
    permissions: {
      canCreateUsers: true,
      canEditUsers: true,
      canDeleteUsers: true,
      canManageRoles: true,
      canManageDepartments: true,
      canManageLocations: true,
      canManageCertificates: true,
      canManageProfile: true,
    },
    onNavigate: (tab: string) => console.log(`Navigated to ${tab}`),
    onUserAction: (action: string, data?: any) => console.log(`User action: ${action}`, data),
  };

  return (
    <OrganisationProvider config={organisationConfig}>
      <OrganisationPanel 
        title="Organisation"
        description="Manage users, roles, departments, and locations"
        showAdminBadge={true}
      />
    </OrganisationProvider>
  );
}
```

### Configuration Options

#### OrganisationConfig Interface

```tsx
interface OrganisationConfig {
  supabaseClient: SupabaseClient;
  enabledTabs?: string[];           // Which tabs to show
  theme?: Partial<ThemeConfig>;     // Custom theme configuration
  permissions?: PermissionConfig;   // Permission settings
  onNavigate?: (tab: string) => void;
  onUserAction?: (action: string, data?: any) => void;
}
```

#### Permissions Configuration

```tsx
interface PermissionConfig {
  canCreateUsers?: boolean;
  canEditUsers?: boolean;
  canDeleteUsers?: boolean;
  canManageRoles?: boolean;
  canManageDepartments?: boolean;
  canManageLocations?: boolean;
  canManageCertificates?: boolean;
  canManageProfile?: boolean;
}
```

#### Enabled Tabs

Control which tabs are visible:

```tsx
const config = {
  // Only show user and role management
  enabledTabs: ['users', 'roles'],
  
  // Or show all tabs (default)
  enabledTabs: ['users', 'roles', 'departments', 'locations', 'certificates', 'profile']
};
```

### Individual Component Usage

You can also use individual components if you don't need the full panel:

```tsx
import { UserManagement, RoleManagement } from '@yourorg/organisation-management';

// Use individual components
<OrganisationProvider config={config}>
  <UserManagement />
  <RoleManagement />
</OrganisationProvider>
```

## Database Requirements

This module requires specific Supabase database tables. Ensure your database has the following tables:

- `profiles` - User profile information
- `roles` - Organization roles
- `departments` - Organization departments  
- `locations` - Physical locations
- `organisation_certificates` - Certificate management
- `organisation_profile` - Organization details
- `user_roles` - User role assignments

## Dependencies

### Peer Dependencies (Required)

- `react` ^18.0.0
- `react-dom` ^18.0.0
- `@supabase/supabase-js` ^2.0.0
- `@tanstack/react-query` ^5.0.0

### UI Dependencies (Included)

- Radix UI components
- Lucide React icons
- Tailwind CSS utilities

## Development

### Building the Module

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Build and watch for changes
npm run dev

# Type checking
npm run type-check
```

### Git Submodule Workflow

When working with this as a Git submodule:

```bash
# Working on the submodule
cd src/modules/organisation
git checkout main
# make changes, commit, push

# Update parent project to latest submodule version
cd ../../..  # back to parent project
git submodule update --remote
git add src/modules/organisation
git commit -m "Update organisation module"
```

### Directory Structure

```
src/modules/organisation/
├── components/
│   ├── admin/              # User management components
│   ├── knowledge/          # Role, department, location management
│   ├── OrganisationPanel.tsx
│   ├── OrganisationProfile.tsx
│   └── OrganisationCertificates.tsx
├── context/
│   └── OrganisationContext.tsx
├── hooks/
│   ├── useUserManagement.ts
│   └── useUserProfiles.ts
├── types/
│   └── index.ts
├── utils/
│   └── userManagementActions.ts
└── index.ts              # Main exports
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details