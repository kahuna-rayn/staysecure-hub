# Changelog

All notable changes to the Organisation Management Module will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-01-08

### Added
- Initial release of Organisation Management Module
- User Management component with create, edit, delete functionality
- Role Management with department associations
- Department Management with manager assignments
- Location Management for physical facilities
- Certificate Management for organizational compliance
- Organisation Profile management
- Permission-based access control system
- Configurable tab visibility
- Full TypeScript support
- Git submodule support
- NPM package distribution ready

### Features
- **User Management**
  - Card and table view modes
  - Create new users with email/password
  - Edit user profiles and permissions
  - Delete users with confirmation
  - Role and department assignments

- **Role Management**
  - Create roles with descriptions
  - Associate roles with departments
  - Active/inactive role status
  - Role editing and deletion

- **Department Management**
  - Department creation and editing
  - Manager assignment functionality
  - Department descriptions

- **Location Management**
  - Building, floor, and room tracking
  - Location status management
  - Location descriptions

- **Certificate Management**
  - Track organizational certificates
  - Expiry date monitoring
  - Certificate assignment to users
  - File attachment support

- **Organisation Profile**
  - Company information management
  - Logo and contact details
  - Address and website information

### Technical
- Built with React 18 and TypeScript
- Supabase integration for data persistence
- TanStack Query for data fetching
- Radix UI components for accessibility
- Tailwind CSS for styling
- Vite for building and bundling
- ESLint for code quality