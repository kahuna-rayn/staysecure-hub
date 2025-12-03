cat > MODULE_ARCHITECTURE.md << 'EOF'
# Module Architecture Design

This document outlines the architectural principles and patterns used in the StaySecure modular system.

## Core Principles

### 1. Dependency Injection

**Problem**: Hardcoded dependencies make modules non-portable

**Solution**: Accept dependencies via configuration

```typescript
// ❌ Bad - hardcoded dependency
const AuthProvider = () => {
  const supabase = createClient(url, key);
  // ...
};

// ✅ Good - dependency injection
const AuthProvider = ({ config }) => {
  const { supabaseClient } = config;
  // ...
};
```

### 2. Relative Imports

**Problem**: Absolute imports break when modules are moved

**Solution**: Use relative imports for portability

```typescript
// ❌ Bad - absolute import
import { Button } from '@/components/ui/button';

// ✅ Good - relative import
import { Button } from '../../../components/ui/button';
```

### 3. Factory Functions

**Problem**: Hooks can't be easily configured

**Solution**: Use factory functions that return configured hooks

```typescript
// ❌ Bad - hardcoded hook
export const useUserRole = () => {
  const supabase = createClient(url, key);
  // ...
};

// ✅ Good - factory function
export const createUseUserRole = (config) => {
  return () => {
    const { supabaseClient } = config;
    // ...
  };
};
```

## Module Structure

### Standard Module Layout
src/modules/[module-name]/
├── src/
│ ├── components/ # React components
│ ├── hooks/ # Custom hooks
│ ├── utils/ # Utility functions
│ ├── types/ # TypeScript types
│ └── index.ts # Public API
├── package.json # Module dependencies
└── README.md # Module documentation

### Example: Auth Module
src/modules/auth/
├── src/
│ ├── components/
│ │ ├── AuthProvider.tsx
│ │ ├── LoginForm.tsx
│ │ └── index.ts
│ ├── hooks/
│ │ ├── useAuth.ts
│ │ └── index.ts
│ ├── types/
│ │ ├── auth.ts
│ │ └── index.ts
│ └── index.ts
├── package.json
└── README.md


## Integration Patterns

### 1. Context Provider Pattern

```typescript
// Module provides context
export const AuthProvider = ({ config, children }) => {
  const value = useAuthLogic(config);
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Consuming app uses context
const App = () => (
  <AuthProvider config={{ supabaseClient }}>
    <YourApp />
  </AuthProvider>
);
```

### 2. Hook Factory Pattern

```typescript
// Module provides factory
export const createUseUserRole = (config) => {
  return () => {
    const { supabaseClient, useAuth } = config;
    // Hook logic here
  };
};

// Consuming app creates hook
const useUserRole = createUseUserRole({
  supabaseClient,
  useAuth: () => ({ user })
});
```

### 3. Component Composition Pattern

```typescript
// Module provides composable components
export const LoginForm = ({ onSuccess, onError }) => {
  // Component logic
};

// Consuming app composes components
const LoginPage = () => (
  <LoginForm 
    onSuccess={() => navigate('/dashboard')}
    onError={(error) => showToast(error)}
  />
);
```

## Configuration Management

### Module Configuration

```typescript
interface AuthConfig {
  supabaseClient: SupabaseClient;
  redirectTo?: string;
  onAuthStateChange?: (user: User | null) => void;
}

interface DatabaseConfig {
  supabaseClient: SupabaseClient;
  useAuth: () => { user: User | null };
}
```

### App Configuration

```typescript
// In consuming app
const authConfig: AuthConfig = {
  supabaseClient: createClient(url, key),
  redirectTo: '/dashboard',
  onAuthStateChange: (user) => {
    analytics.track('auth_state_change', { user: user?.id });
  }
};
```

## Error Handling

### Module-Level Errors

```typescript
// Modules should handle their own errors
const AuthProvider = ({ config }) => {
  const [error, setError] = useState(null);
  
  const signIn = async (email, password) => {
    try {
      // Auth logic
    } catch (err) {
      setError(err.message);
    }
  };
  
  return (
    <AuthContext.Provider value={{ error, signIn }}>
      {children}
    </AuthContext.Provider>
  );
};
```

### App-Level Error Handling

```typescript
// Apps can provide additional error handling
const App = () => {
  const { error } = useAuth();
  
  useEffect(() => {
    if (error) {
      // Log to analytics
      analytics.error('auth_error', { error });
    }
  }, [error]);
  
  return <YourApp />;
};
```

## Testing Strategy

### Module Testing

```typescript
// Test modules in isolation
describe('AuthProvider', () => {
  it('should handle login', async () => {
    const mockSupabase = createMockSupabase();
    render(
      <AuthProvider config={{ supabaseClient: mockSupabase }}>
        <LoginForm />
      </AuthProvider>
    );
    // Test logic
  });
});
```

### Integration Testing

```typescript
// Test modules in consuming app
describe('Auth Integration', () => {
  it('should work with real Supabase', async () => {
    render(
      <AuthProvider config={{ supabaseClient: realSupabase }}>
        <App />
      </AuthProvider>
    );
    // Test integration
  });
});
```

## Performance Considerations

### Lazy Loading

```typescript
// Load modules on demand
const AuthModule = lazy(() => import('./modules/auth'));

const App = () => (
  <Suspense fallback={<Loading />}>
    <AuthModule />
  </Suspense>
);
```

### Bundle Splitting

```typescript
// Each module can be its own bundle
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          auth: ['./src/modules/auth'],
          database: ['./src/modules/database'],
        }
      }
    }
  }
});
```

## Future Considerations

### Versioning

- Use semantic versioning for modules
- Maintain backward compatibility
- Provide migration guides for breaking changes

### Documentation

- Each module should have its own README
- Provide usage examples
- Document configuration options

### Monitoring

- Track module usage across apps
- Monitor performance impact
- Log errors and issues

## Conclusion

This modular architecture provides:

- **Reusability** - Write once, use everywhere
- **Maintainability** - Update in one place
- **Testability** - Test modules in isolation
- **Flexibility** - Easy to customize and extend
- **Portability** - Works across different app structures

The key is following the established patterns and principles to ensure modules remain truly modular and consumable.
EOF