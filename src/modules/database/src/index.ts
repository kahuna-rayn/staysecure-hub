// Export types
export type { 
  UserProfile, 
  UserRole, 
  Role, 
  Department, 
  Location, 
  DatabaseConfig,
  UseUserRoleReturn,
  UseUserProfilesReturn,
  UseUserManagementReturn
} from "./types";

// Export hooks
export { createUseUserRole } from "./hooks/useUserRole";

// Export default hook factory for convenience
export { createUseUserRole as default } from "./hooks/useUserRole";
