// Export types
export type { User, AuthState, AuthContextValue, AuthConfig } from "./types";

// Export hooks
export { createUseAuth } from "./hooks/useAuth";

// Export components
export { AuthProvider, useAuth } from "./components/AuthProvider";

// Export default hook factory for convenience
export { createUseAuth as default } from "./hooks/useAuth";
