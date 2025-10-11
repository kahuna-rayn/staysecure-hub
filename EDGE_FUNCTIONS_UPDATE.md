# Edge Functions Multi-Client Support

## Changes Made

We've updated all Edge Functions in the Hub project to support multi-client deployments by extracting the base URL from request headers instead of using hardcoded environment variables.

## Updated Functions

### 1. `send-email/index.ts`
- **Change**: Extract origin from request headers
- **Fallback**: `http://localhost:5173`
- **Usage**: Used for notification preference links in email footer

### 2. `create-user/index.ts`
- **Change**: Extract origin from request headers for activation links
- **Fallback**: `http://localhost:5173`
- **Usage**: Generates activation links sent to new users

### 3. `send-lesson-reminders/index.ts`
- **Change**: Extract origin from request headers for lesson links
- **Fallback**: `http://localhost:5173`
- **Usage**: Generates links in automated lesson reminder emails

## How It Works

Each Edge Function now extracts the base URL using this pattern:

```typescript
const origin = req.headers.get('origin') || 
               req.headers.get('referer')?.replace(/\/.*$/, '') || 
               'http://localhost:5173';
```

This means:
1. First tries to get the `origin` header (e.g., `http://localhost:5173`, `https://learn.raynsecure.com`)
2. Falls back to extracting domain from `referer` header
3. Uses `http://localhost:5173` as final fallback for local development

## Benefits

- **Multi-Client Support**: Same Edge Functions work for Hub, LEARN, and GOVERN
- **No Configuration Needed**: Each client automatically gets correct URLs based on where requests originate
- **Production Ready**: Works in cloud deployments where different clients have different domains
- **Developer Friendly**: Falls back to standard Vite port for local development

## Testing

To test the Edge Functions:

1. **Start Hub**: `cd /Users/naresh/staysecure-hub/hub && npm run dev`
2. **Visit Login Page**: Navigate to `http://localhost:5173/login` (or 5174 if 5173 is in use)
3. **Test Activation Email**: Use the ActivationTest component visible on the login page
4. **Check Email Links**: Verify that generated links point to the correct origin

## Next Steps

1. ✅ Test in Hub (current)
2. Apply same changes to LEARN project
3. Test in LEARN
4. Document for GOVERN project

