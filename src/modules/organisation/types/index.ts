import { SupabaseClient } from '@supabase/supabase-js';

export interface OrganisationConfig {
  supabaseClient: SupabaseClient;
  enabledTabs?: string[];
  theme?: Partial<ThemeConfig>;
  permissions?: PermissionConfig;
  onNavigate?: (tab: string) => void;
  onUserAction?: (action: string, data?: any) => void;
}

export interface ThemeConfig {
  primaryColor?: string;
  secondaryColor?: string;
  borderRadius?: string;
}

export interface PermissionConfig {
  canCreateUsers?: boolean;
  canEditUsers?: boolean;
  canDeleteUsers?: boolean;
  canManageRoles?: boolean;
  canManageDepartments?: boolean;
  canManageLocations?: boolean;
  canManageCertificates?: boolean;
  canManageProfile?: boolean;
}

export interface UserProfile {
  id: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  username?: string;
  email?: string;
  role?: string;
  department?: string;
  phone?: string;
  location?: string;
  location_id?: string;
  status?: string;
  access_level?: string;
  bio?: string;
  employee_id?: string;
  avatar_url?: string;
  total_learning_hours?: number;
  courses_completed?: number;
  certifications_earned?: number;
  compliance_score?: number;
  learning_streak?: number;
  last_login?: string;
  created_at?: string;
  updated_at?: string;
}

export interface NewUser {
  email: string;
  password: string;
  full_name: string;
  first_name: string;
  last_name: string;
  username: string;
  phone: string;
  location: string;
  location_id?: string;
  status: string;
  access_level: string;
  bio: string;
  employee_id: string;
}

export interface Role {
  role_id: string;
  name: string;
  description?: string;
  department_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Department {
  id: string;
  name: string;
  description?: string;
  manager_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Location {
  id: string;
  name: string;
  description?: string;
  building?: string;
  floor?: string;
  room?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface OrgCertificate {
  id: string;
  name: string;
  issued_by: string;
  date_acquired: string;
  expiry_date?: string;
  status: string;
  assigned_to?: string;
  file_url?: string;
  created_at: string;
  updated_at: string;
}