import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface UserDepartment {
  id: string;
  user_id: string;
  department_id: string;
  department_name: string;
  is_primary: boolean;
  assigned_at: string;
  assigned_by: string;
  pairing_id: string;
}

export const useUserDepartments = (userId?: string) => {
  const [userDepartments, setUserDepartments] = useState<UserDepartment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAddingDepartment, setIsAddingDepartment] = useState(false);
  const [isRemovingDepartment, setIsRemovingDepartment] = useState(false);
  const [isUpdatingPrimary, setIsUpdatingPrimary] = useState(false);

  const fetchUserDepartments = async () => {
    if (!userId) return;
    
    try {
      setIsLoading(true);
      console.log('useUserDepartments: Fetching departments for user:', userId);
      
      const { data, error } = await supabase
        .from('user_departments')
        .select(`
          id,
          user_id,
          department_id,
          is_primary,
          assigned_at,
          assigned_by,
          pairing_id,
          department:departments(name)
        `)
        .eq('user_id', userId);

      console.log('useUserDepartments: Raw departments data:', data);
      console.log('useUserDepartments: Departments query error:', error);

      if (error) throw error;

      const formattedData = data?.map(item => ({
        id: item.id,
        user_id: item.user_id,
        department_id: item.department_id,
        department_name: (item as any).department?.name || '',
        is_primary: item.is_primary || false,
        assigned_at: item.assigned_at,
        assigned_by: item.assigned_by || '',
        pairing_id: item.pairing_id || ''
      })) || [];

      console.log('useUserDepartments: Formatted departments data:', formattedData);
      setUserDepartments(formattedData);
    } catch (err) {
      console.error('useUserDepartments: Error fetching departments:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Accept object with userId, departmentId, isPrimary, assignedBy
  const addDepartment = async (params: { userId: string; departmentId: string; isPrimary: boolean; pairingId?: string; assignedBy?: string }) => {
    try {
      setIsAddingDepartment(true);
      console.log('useUserDepartments: addDepartment called with params:', params);
      
      const { error } = await supabase
        .from('user_departments')
        .insert([{
          user_id: params.userId,
          department_id: params.departmentId,
          is_primary: params.isPrimary,
          pairing_id: params.pairingId,
          assigned_by: params.assignedBy
        }]);

      console.log('useUserDepartments: addDepartment insert error:', error);
      if (error) throw error;
      
      console.log('useUserDepartments: Department added successfully, refetching...');
      await fetchUserDepartments();
    } catch (err) {
      console.error('useUserDepartments: addDepartment error:', err);
      setError(err instanceof Error ? err.message : 'Failed to add department');
    } finally {
      setIsAddingDepartment(false);
    }
  };

  // Accept assignmentId string (the department assignment record ID)
  const removeDepartment = async (assignmentId: string) => {
    try {
      setIsRemovingDepartment(true);
      const { error } = await supabase
        .from('user_departments')
        .delete()
        .eq('id', assignmentId);

      if (error) throw error;
      await fetchUserDepartments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove department');
    } finally {
      setIsRemovingDepartment(false);
    }
  };

  // Accept object with userId and departmentId
  const setPrimaryDepartment = async (params: { userId: string; departmentId: string }) => {
    try {
      setIsUpdatingPrimary(true);
      
      // First, set all departments to non-primary for this user
      await supabase
        .from('user_departments')
        .update({ is_primary: false })
        .eq('user_id', params.userId);

      // Then set the selected department as primary
      const { error } = await supabase
        .from('user_departments')
        .update({ is_primary: true })
        .eq('user_id', params.userId)
        .eq('department_id', params.departmentId);

      if (error) throw error;
      await fetchUserDepartments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set primary department');
    } finally {
      setIsUpdatingPrimary(false);
    }
  };

  useEffect(() => {
    fetchUserDepartments();
  }, [userId]);

  return {
    userDepartments,
    isLoading,
    error,
    addDepartment,
    removeDepartment,
    setPrimaryDepartment,
    isAddingDepartment,
    isRemovingDepartment,
    isUpdatingPrimary,
    refetch: fetchUserDepartments
  };
};