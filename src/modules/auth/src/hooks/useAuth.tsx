import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User, AuthError } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  sendActivationEmail: (email: string) => Promise<void>;
  activateUser: (email: string, password: string, confirmPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
  config: {
    supabaseClient: any; // SupabaseClient type
  };
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children, config }) => {
  const { supabaseClient } = config;
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Get initial session
    supabaseClient.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabaseClient]);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const { error: signInError } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      });
      
      if (signInError) throw signInError;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { error: signOutError } = await supabaseClient.auth.signOut();
      if (signOutError) throw signOutError;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const sendActivationEmail = async (email: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const { error: resetError } = await supabaseClient.auth.resetPasswordForEmail(email);
      if (resetError) throw resetError;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const activateUser = async (email: string, password: string, confirmPassword: string) => {
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Check if user has an active session (from email verification)
      const { data: { session } } = await supabaseClient.auth.getSession();
      
      if (session) {
        // User is authenticated via email verification, update their password
        const { error: updateError } = await supabaseClient.auth.updateUser({
          password: password
        });
        
        if (updateError) throw updateError;
      } else {
        // Fallback to signup if no session exists
        const { error: signUpError } = await supabaseClient.auth.signUp({
          email,
          password,
        });
        
        if (signUpError) throw signUpError;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    error,
    signIn,
    signOut,
    sendActivationEmail,
    activateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};