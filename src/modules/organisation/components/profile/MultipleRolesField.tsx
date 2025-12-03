import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, X } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

interface MultipleRolesFieldProps {
  userId: string;
  departmentValue?: string;
  isEditing: boolean;
  onEdit: () => void;
  onCancel: () => void;
}

const MultipleRolesField: React.FC<MultipleRolesFieldProps> = ({
  userId,
  departmentValue,
  isEditing,
  onEdit,
  onCancel
}) => {
  const [isAddingRole, setIsAddingRole] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');
  const queryClient = useQueryClient();

  // Fetch user's current roles
  const { data: userRoles, isLoading: rolesLoading } = useQuery({
    queryKey: ['user-roles', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_profile_roles')
        .select(`
          *,
          roles (
            name
          )
        `)
        .eq('user_id', userId)
        .order('is_primary', { ascending: false })
        .order('roles.name');
      
      if (error) throw error;
      
      // Transform data to match expected interface
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

  // Fetch available roles
  const { data: availableRoles } = useQuery({
    queryKey: ['available-roles', departmentValue],
    queryFn: async () => {
      let query = supabase
        .from('roles')
        .select('role_id, name, department_id, departments(name)')
        .eq('is_active', true);

      if (departmentValue && departmentValue !== '') {
        const { data: department } = await supabase
          .from('departments')
          .select('id')
          .eq('name', departmentValue)
          .maybeSingle();
        
        if (department) {
          // Show roles that either belong to the selected department OR have no department (designation roles)
          query = query.or(`department_id.eq.${department.id},department_id.is.null`);
        } else {
          // If department not found, only show designation roles
          query = query.is('department_id', null);
        }
      }
      // If no department filter, show all roles

      const { data, error } = await query.order('name');
      if (error) throw error;
      return data;
    },
  });

  // Add role mutation
  const addRoleMutation = useMutation({
    mutationFn: async ({ roleId, isPrimary }: { roleId: string; isPrimary: boolean }) => {
      const { error } = await supabase
        .from('user_profile_roles')
        .insert({
          user_id: userId,
          role_id: roleId,
          is_primary: isPrimary,
          assigned_by: userId // In a real app, this would be the current admin user
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-roles', userId] });
      setSelectedRole('');
      setIsAddingRole(false);
      toast({
        title: "Role added",
        description: "The role has been successfully added.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add role",
        variant: "destructive",
      });
    }
  });

  // Remove role mutation
  const removeRoleMutation = useMutation({
    mutationFn: async (roleId: string) => {
      const { error } = await supabase
        .from('user_profile_roles')
        .delete()
        .eq('id', roleId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-roles', userId] });
      toast({
        title: "Role removed",
        description: "The role has been successfully removed.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove role",
        variant: "destructive",
      });
    }
  });

  // Set primary role mutation
  const setPrimaryRoleMutation = useMutation({
    mutationFn: async (roleId: string) => {
      // First, unset all primary roles for this user
      await supabase
        .from('user_profile_roles')
        .update({ is_primary: false })
        .eq('user_id', userId);

      // Then set the selected role as primary
      const { error } = await supabase
        .from('user_profile_roles')
        .update({ is_primary: true })
        .eq('id', roleId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-roles', userId] });
      toast({
        title: "Primary role updated",
        description: "The primary role has been updated.",
      });
    }
  });

  const handleAddRole = () => {
    if (!selectedRole) return;
    
    const isPrimary = !userRoles || userRoles.length === 0;
    addRoleMutation.mutate({ roleId: selectedRole, isPrimary });
  };

  const handleRemoveRole = (roleId: string) => {
    removeRoleMutation.mutate(roleId);
  };

  const handleSetPrimary = (roleId: string) => {
    setPrimaryRoleMutation.mutate(roleId);
  };

  if (rolesLoading) {
    return <div className="text-sm text-muted-foreground">Loading roles...</div>;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        {userRoles?.map((userRole) => (
          <div key={userRole.id} className="flex items-center gap-1">
            <Badge 
              variant={userRole.is_primary ? "default" : "secondary"}
              className="flex items-center gap-1"
            >
              {userRole.role_name}
              {userRole.is_primary && (
                <span className="text-xs font-normal">(Primary)</span>
              )}
              {isEditing && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleRemoveRole(userRole.id)}
                  className="h-4 w-4 p-0 ml-1 hover:bg-destructive hover:text-destructive-foreground"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </Badge>
            {isEditing && !userRole.is_primary && userRoles.length > 1 && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleSetPrimary(userRole.id)}
                className="h-6 px-2 text-xs"
              >
                Set Primary
              </Button>
            )}
          </div>
        ))}
        
        {isEditing && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsAddingRole(true)}
            className="h-6 w-6 p-0"
          >
            <Plus className="h-3 w-3" />
          </Button>
        )}
      </div>

      <Dialog open={isAddingRole} onOpenChange={setIsAddingRole}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Role</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {availableRoles?.filter(role => 
                  !userRoles?.some(userRole => userRole.role_id === role.role_id)
                ).map((role) => (
                  <SelectItem key={role.role_id} value={role.role_id}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAddingRole(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleAddRole} 
                disabled={!selectedRole || addRoleMutation.isPending}
              >
                Add Role
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MultipleRolesField;