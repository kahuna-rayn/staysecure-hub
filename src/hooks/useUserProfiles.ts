import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from 'staysecure-auth';
import type { User } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  full_name: string;
  first_name?: string;
  last_name?: string;
  username: string;
  email: string;
  role: string;
  department: string;
  manager: string;
  phone: string;
  location: string;
  location_id?: string;
  employee_id: string;
  status: string;
  start_date: string;
  last_login: string;
  password_last_changed: string;
  two_factor_enabled: boolean;
  avatar_url: string;
  bio: string;
  cyber_learner: boolean;
  dpe_learner: boolean;
  learn_complete: boolean;
  dpe_complete: boolean;
  enrolled_in_learn: boolean;
  language: string;
  created_at: string;
  updated_at: string;
}

export const useUserProfiles = () => {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      setError(null);

      // First fetch profiles (excluding deleted users)
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .neq('status', 'Deleted')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      const formattedProfiles: UserProfile[] = (profilesData || []).map((profile: any) => ({
        id: profile.id,
        full_name: profile.full_name || '',
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        username: profile.username || '',
        // Use username as email (username contains the email address)
        email: profile.username || 'Not available',
        role: '', // Role would need to be fetched from user_profile_roles
        department: '', // Department would need to be fetched from user_departments
        manager: profile.manager || '',
        phone: profile.phone || '',
        location: profile.location || '',
        location_id: profile.location_id || '',
        employee_id: profile.employee_id || '',
        status: profile.status || '',
        start_date: profile.start_date || '',
        last_login: profile.last_login || '',
        password_last_changed: profile.password_last_changed || '',
        two_factor_enabled: profile.two_factor_enabled || false,
        avatar_url: profile.avatar_url || '',
        bio: profile.bio || '',
        cyber_learner: profile.cyber_learner ?? false,
        dpe_learner: profile.dpe_learner ?? false,
        learn_complete: profile.learn_complete ?? false,
        dpe_complete: profile.dpe_complete ?? false,
        enrolled_in_learn: profile.enrolled_in_learn ?? false,
        language: profile.language || '',
        created_at: profile.created_at || '',
        updated_at: profile.updated_at || ''
      }));

      setProfiles(formattedProfiles);
    } catch (err) {
      console.error('Error fetching profiles:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch profiles');
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (profileId: string, updates: Partial<UserProfile>) => {
    console.log('🔍 updateProfile - called with profileId:', profileId);
    console.log('🔍 updateProfile - updates object:', updates);
    console.log('🔍 updateProfile - updates.location_id:', updates.location_id);
    console.log('🔍 updateProfile - updates.location:', updates.location);
    
    try {
      console.log('🔍 updateProfile - calling Supabase update...');
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', profileId)
        .select();

      console.log('🔍 updateProfile - Supabase response:', { data, error });
      
      if (error) {
        console.error('❌ updateProfile - Supabase error:', error);
        throw error;
      }

      console.log('🔍 updateProfile - Update successful, updating local state...');
      
      // Update local state
      setProfiles(prev => prev.map(profile => 
        profile.id === profileId ? { ...profile, ...updates } : profile
      ));
      
      console.log('🔍 updateProfile - Local state updated, returning success');
      return { success: true };
    } catch (err) {
      console.error('❌ updateProfile - Error:', err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to update profile' 
      };
    }
  };

  const createProfile = async (profileData: Partial<UserProfile>) => {
    try {
      // Ensure required id field is present
      const profileWithId = {
        id: profileData.id,
        ...profileData
      };

      const { data, error } = await supabase
        .from('profiles')
        .insert(profileWithId)
        .select()
        .single();

      if (error) throw error;

      const newProfile: UserProfile = {
        id: data.id,
        full_name: data.full_name || '',
        username: data.username || '',
        email: '',
        role: '', // Role would need to be fetched from user_profile_roles
        department: '', // Department would need to be fetched from user_departments
        manager: data.manager || '',
        phone: data.phone || '',
        location: data.location || '',
        location_id: (data as any).location_id || '',
        employee_id: data.employee_id || '',
        status: data.status || '',
        start_date: data.start_date || '',
        last_login: data.last_login || '',
        password_last_changed: data.password_last_changed || '',
        two_factor_enabled: data.two_factor_enabled || false,
        avatar_url: data.avatar_url || '',
        bio: data.bio || '',
        cyber_learner: (data as any).cyber_learner ?? false,
        dpe_learner: (data as any).dpe_learner ?? false,
        learn_complete: (data as any).learn_complete ?? false,
        dpe_complete: (data as any).dpe_complete ?? false,
        enrolled_in_learn: (data as any).enrolled_in_learn ?? false,
        language: (data as any).language || '',
        created_at: data.created_at || '',
        updated_at: data.updated_at || ''
      };

      setProfiles(prev => [newProfile, ...prev]);
      return { success: true, data: newProfile };
    } catch (err) {
      console.error('Error creating profile:', err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to create profile' 
      };
    }
  };

  const deleteProfile = async (profileId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', profileId);

      if (error) throw error;

      // Update local state
      setProfiles(prev => prev.filter(profile => profile.id !== profileId));
      return { success: true };
    } catch (err) {
      console.error('Error deleting profile:', err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to delete profile' 
      };
    }
  };

  useEffect(() => {
    if (user) {
      fetchProfiles();
    }
  }, [user]);

  return {
    profiles,
    loading,
    error,
    refetch: fetchProfiles,
    updateProfile,
    createProfile,
    deleteProfile
  };
};
