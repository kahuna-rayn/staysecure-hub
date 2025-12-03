import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface UserProfileRole {
  id: string;
  user_id: string;
  role_id: string;
  role_name: string; // This will come from the joined roles table
  is_primary: boolean;
  assigned_at: string;
  assigned_by?: string;
  pairing_id?: string;
}

export const useUserProfileRoles = (userId?: string) => {
  // Fetch user profile roles
  const { data: userRoles = [], isLoading } = useQuery({
    queryKey: ['user-roles', userId], // Use the same key as UserDepartmentsRolesTable
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('user_profile_roles')
        .select(`
          *,
          roles (
            name
          )
        `)
        .eq('user_id', userId)
        .order('is_primary', { ascending: false });

      if (error) throw error;
      
      // Transform the data to match the expected interface
      const transformedData = (data || []).map(item => ({
        id: item.id,
        user_id: item.user_id,
        role_id: item.role_id,
        role_name: item.roles?.name || '',
        is_primary: item.is_primary,
        assigned_at: item.assigned_at,
        assigned_by: item.assigned_by,
        pairing_id: item.pairing_id,
      }));
      
      return transformedData;
    },
    enabled: !!userId,
  });

  // Get primary role
  const primaryRole = userRoles.find(role => role.is_primary);

  return {
    userRoles,
    primaryRole,
    isLoading,
  };
};