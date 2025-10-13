import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type AppRole = 'super_admin' | 'client_admin' | 'manager' | 'author' | 'user';

export const useUserRoleById = (userId?: string) => {
  const queryClient = useQueryClient();
  
  console.log('useUserRoleById called with userId:', userId);

  const { data: role, isLoading, error } = useQuery({
    queryKey: ['user-role', userId],
    queryFn: async () => {
      console.log('useUserRoleById query executing for userId:', userId);
      if (!userId) return 'user';
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();
  
      if (error) {
        console.error('Error fetching user role:', error);
        throw error;
      }
      
      console.log('Fetched role data:', data);
      const roleValue = (data?.role as AppRole) || 'user';
      console.log('Returning role:', roleValue);
      return roleValue;
    },
    enabled: !!userId,
  });

  const updateRoleMutation = useMutation({
    mutationFn: async (newRole: AppRole) => {
      if (!userId) throw new Error('User ID is required');
      
      // Use upsert to insert if doesn't exist, update if exists
      const { error } = await supabase
        .from('user_roles')
        .update({ role: newRole })
        .eq('user_id', userId);
  
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-role', userId] });
      toast.success('User role updated successfully');
    },
    onError: (error) => {
      console.error('Error updating user role:', error);
      toast.error('Failed to update user role');
    },
  });

  const getRoleDisplayName = (role: AppRole | null) => {
    switch (role) {
      case 'super_admin':
        return 'Super Administrator';
      case 'client_admin':
        return 'Client Administrator';
      case 'manager':
        return 'Manager';
      case 'author':
        return 'Author';
      case 'user':
        return 'User';
      default:
        return 'User';
    }
  };

  const getRoleBadgeVariant = (role: AppRole | null) => {
    switch (role) {
      case 'super_admin':
      case 'client_admin':
        return 'destructive' as const; // Red
      case 'user':
        return 'default' as const; // Green (you may need to add a 'success' variant)
      case 'manager':
        return 'secondary' as const; // Blue
      case 'author':
        return 'outline' as const; // Orange (you may need to add a 'warning' variant)
      default:
        return 'outline' as const;
    }
  };

  return {
    role,
    isLoading,
    error,
    updateRole: updateRoleMutation.mutate,
    isUpdating: updateRoleMutation.isPending,
    getRoleDisplayName,
    getRoleBadgeVariant,
  };
};
