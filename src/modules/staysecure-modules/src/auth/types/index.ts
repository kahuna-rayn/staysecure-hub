export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export interface AuthContextValue {
  user: User | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  sendActivationEmail: (email: string) => Promise<void>;
  activateUser: (email: string, password: string, confirmPassword: string) => Promise<void>;
}

export interface AuthConfig {
  supabaseClient: any;
  redirectTo?: string;
  onAuthStateChange?: (user: User | null) => void;
}
