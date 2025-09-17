export interface DatabaseConfig {
  supabaseClient: any;
  useAuth: () => { user: any | null };
}

export interface UseUserRoleReturn {
  role: string | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isClientAdmin: boolean;
  isModerator: boolean;
  hasAdminAccess: boolean;
  canAccessLessons: boolean;
  canAccessLearningTracks: boolean;
  canAccessTranslation: boolean;
  canAccessAssignments: boolean;
  canAccessAnalytics: boolean;
  canAccessReports: boolean;
  canAccessOrganisation: boolean;
  canAccessNotifications: boolean;
  canAccessTemplates: boolean;
  canAccessAnyAdminFeature: boolean;
  loading: boolean;
  refetch: () => void;
  getRoleDisplayName: () => string;
  getRoleBadgeVariant: () => "destructive" | "outline" | "secondary";
}
