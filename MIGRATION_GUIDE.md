# Migration Guide: From Monolithic to Modular Architecture

This guide explains how to migrate from the current monolithic structure to the new modular architecture.

## Overview

The new modular architecture allows shared components to be consumed by multiple applications (LEARN, GOVERN, COMPLY) without duplication or modification.

## Migration Strategy

### Phase 1: Auth Module (Complete)

**Status**: ✅ Complete and tested

**What was migrated**:
- `AuthProvider` - Now accepts `supabaseClient` via config prop
- `LoginForm` - Standalone component with error handling
- `useAuth` - Context hook for authentication state
- Password reset flow - Complete with routing

**Benefits**:
- No more duplicated auth code across apps
- Consistent authentication experience
- Easy to maintain and update

### Phase 2: Database Module (In Progress)

**Status**: ⏳ In progress

**What needs to be migrated**:
- `useUserRole` - Convert to factory function with dependency injection
- Database utilities - Make them configurable
- Type definitions - Centralize and share

**Migration Steps**:
1. Extract database hooks from LEARN/GOVERN
2. Convert to factory functions with dependency injection
3. Test in staysecure-hub
4. Integrate into consuming apps

### Phase 3: Organisation Module (Planned)

**Status**: ⏳ Planned

**What needs to be migrated**:
- `OrganisationPanel` - Make it configurable
- `OrganisationWrapper` - Add dependency injection
- Organisation management components
- Related hooks and utilities

### Phase 4: Notifications Module (Planned)

**Status**: ⏳ Planned

**What needs to be migrated**:
- Notification components
- Notification hooks
- Notification utilities

## Integration Steps for Each App

### 1. Copy Module Files

```bash
# Copy the auth module
cp -r /path/to/staysecure-hub/src/modules/auth /path/to/your-app/src/modules/
```

### 2. Update App.tsx

```typescript
// Before (monolithic)
import { AuthProvider } from './components/AuthProvider';

// After (modular)
import { AuthProvider } from './modules/auth/src/components/AuthProvider';
```

### 3. Configure Dependencies

```typescript
// Pass your Supabase client to the module
<AuthProvider config={{ supabaseClient: yourSupabaseClient }}>
  <YourApp />
</AuthProvider>
```

### 4. Update Import Paths

The modules use relative imports, so they should work without modification. If you encounter path issues:

```typescript
// Check that your vite.config.ts has the right aliases
// Or use relative imports in your consuming app
```

## Testing Strategy

### 1. Test in staysecure-hub First

- Develop and test new modules in the test app
- Ensure all functionality works correctly
- Validate that modules are truly standalone

### 2. Test in One Production App

- Start with LEARN (most stable)
- Integrate the module
- Test all functionality
- Fix any integration issues

### 3. Roll Out to Other Apps

- Once validated in one app, roll out to others
- GOVERN, COMPLY, etc.

## Rollback Plan

If issues arise:

1. **Keep the old code** - Don't delete until new modules are proven
2. **Feature flags** - Use environment variables to switch between old/new
3. **Gradual migration** - Migrate one module at a time
4. **Quick rollback** - Revert to old imports if needed

## Benefits of Migration

### For Developers

- **No more duplication** - Write once, use everywhere
- **Easier maintenance** - Update in one place
- **Consistent behavior** - Same components across apps
- **Better testing** - Test modules in isolation

### For Users

- **Consistent experience** - Same UI/UX across apps
- **Fewer bugs** - Shared, tested components
- **Faster development** - New features available everywhere

## Common Issues and Solutions

### Import Path Issues

**Problem**: Module imports don't resolve correctly

**Solution**: 
- Use relative imports in modules
- Check vite.config.ts aliases
- Ensure module structure is correct

### Dependency Injection Issues

**Problem**: Module expects hardcoded dependencies

**Solution**:
- Convert to factory functions
- Accept dependencies via props/config
- Use dependency injection pattern

### Styling Issues

**Problem**: Components don't look the same across apps

**Solution**:
- Copy UI components to consuming app
- Use consistent CSS/Tailwind setup
- Test styling in each consuming app

## Next Steps

1. **Complete Database Module** - Finish the migration
2. **Test in GOVERN** - Validate the approach
3. **Plan Organisation Module** - Design the migration
4. **Documentation** - Keep this guide updated