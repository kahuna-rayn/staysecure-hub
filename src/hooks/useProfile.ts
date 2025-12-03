
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from 'staysecure-auth';

export interface Profile {
  id: string;
  username?: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  bio?: string;
  role?: string;
  department?: string;
  manager?: string;
  phone?: string;
  location?: string;
  start_date?: string;
  employee_id?: string;
  access_level?: string;
  last_login?: string;
  password_last_changed?: string;
  two_factor_enabled?: boolean;
  status?: string;
  language?: string;
  email?: string;
  created_at: string;
  updated_at: string;
}

export const useProfile = (profileId?: string) => {
  const { user } = useAuth();
  console.log('useProfile hook: profileId:', profileId, 'user:', user);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const idToFetch = profileId || user?.id;
    if (idToFetch) {
      fetchProfile(idToFetch);
    } else {
      setProfile(null);
      setLoading(false);
    }
  }, [profileId, user]);

  const fetchProfile = async (id: string) => {
    console.log('fetchProfile called with id:', id);
    try {
      setLoading(true);
      
      // Fetch profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, first_name, last_name, username, avatar_url, bio, manager, phone, location, start_date, employee_id, last_login, password_last_changed, two_factor_enabled, status, language, created_at, updated_at')
        .eq('id', id)
        .single();

      if (profileError) throw profileError;

      // Fetch role from user_roles
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', id)
        .maybeSingle();

      if (roleError) {
        console.warn('Error fetching user role:', roleError);
      }

      // Get email from auth user
      const userEmail = user?.email || null;

      // Combine profile data with role and email
      const combinedData = {
        ...profileData,
        role: roleData?.role || null,
        email: userEmail
      };

      console.log('Fresh profile data from Supabase:', combinedData);
      setProfile(combinedData);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    try {
      const idToUpdate = profileId || user?.id;
      if (!idToUpdate) throw new Error('No profile ID to update');
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', idToUpdate);

      if (error) throw error;
      // Refetch the profile to get updated data
      await fetchProfile(idToUpdate);
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  };

  return {
    profile,
    loading,
    error,
    updateProfile,
    refetch: () => {
      const idToFetch = profileId || user?.id;
      if (idToFetch) {
        return fetchProfile(idToFetch);
      }
      return Promise.resolve();
    },
  };
};
