import React, { useState, forwardRef, useImperativeHandle } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useUserDepartments } from '@/hooks/useUserDepartments';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Plus, X, Star, Users, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@staysecure/auth';

interface UserDepartmentsRolesTableProps {
  userId: string;
}

export interface UserDepartmentsRolesTableRef {
  handleAddNewRow: () => void;
}

interface DepartmentRolePair {
  id?: string;
  departmentId?: string;
  departmentName?: string;
  departmentAssignmentId?: string;
  roleName?: string;
  roleId?: string;
  isDepartmentPrimary?: boolean;
  isRolePrimary?: boolean;
  isNewRow?: boolean;
}

export const UserDepartmentsRolesTable = forwardRef<UserDepartmentsRolesTableRef, UserDepartmentsRolesTableProps>(({ userId }, ref) => {
  const [newRows, setNewRows] = useState<DepartmentRolePair[]>([]);
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const { 
    userDepartments, 
    addDepartment, 
    removeDepartment, 
    setPrimaryDepartment,
    isAddingDepartment,
    refetch: refetchUserDepartments
  } = useUserDepartments(userId);

  // Fetch all available departments
  const { data: allDepartments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('departments')
        .select('id, name')
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  // Fetch user's current roles
  const { data: userRoles = [] } = useQuery({
    queryKey: ['user-roles', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      console.log('UserDepartmentsRolesTable: Fetching roles for user:', userId);
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
      
      console.log('UserDepartmentsRolesTable: Raw roles data:', data);
      console.log('UserDepartmentsRolesTable: Roles query error:', error);
      
      if (error) throw error;
      
      // Transform the data to match expected interface
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
      
      // Sort by role name after transformation
      transformedData.sort((a, b) => {
        if (a.is_primary && !b.is_primary) return -1;
        if (!a.is_primary && b.is_primary) return 1;
        return (a.role_name || '').localeCompare(b.role_name || '');
      });
      
      console.log('UserDepartmentsRolesTable: Transformed roles data:', transformedData);
      return transformedData;
    },
    enabled: !!userId,
  });

  // Fetch all available roles
  const { data: allRoles = [] } = useQuery({
    queryKey: ['all-roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('roles')
        .select('role_id, name, department_id, departments(name)')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });

  // Add role mutation
  const addRoleMutation = useMutation({
    mutationFn: async ({ roleId, pairingId }: { roleId: string; pairingId?: string }) => {
      console.log('UserDepartmentsRolesTable: addRoleMutation called with roleId:', roleId, 'pairingId:', pairingId);
      const role = allRoles.find(r => r.role_id === roleId);
      console.log('UserDepartmentsRolesTable: Found role:', role);
      if (!role) throw new Error('Role not found');

      const isPrimary = userRoles.length === 0;
      console.log('UserDepartmentsRolesTable: isPrimary:', isPrimary, 'userRoles.length:', userRoles.length);
      
      const insertData = {
        user_id: userId,
        role_id: roleId,
        is_primary: isPrimary,
        assigned_by: user?.id,
        pairing_id: pairingId
      };
      console.log('UserDepartmentsRolesTable: Inserting role data:', insertData);
      
      const { data, error } = await supabase
        .from('user_profile_roles')
        .insert(insertData)
        .select();
      
      console.log('UserDepartmentsRolesTable: Insert result:', data);
      console.log('UserDepartmentsRolesTable: Insert error:', error);
      
      if (error) throw error;
      return role;
    },
    onSuccess: (data) => {
      console.log('UserDepartmentsRolesTable: Role assignment successful:', data);
      queryClient.invalidateQueries({ queryKey: ['user-roles', userId] });
      toast.success('Role assigned successfully');
    },
    onError: (error: any) => {
      console.error('UserDepartmentsRolesTable: Role assignment failed:', error);
      toast.error('Failed to assign role: ' + error.message);
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
      toast.success('Role removed successfully');
    },
    onError: (error: any) => {
      toast.error('Failed to remove role: ' + error.message);
    }
  });

  // Set primary role mutation
  const setPrimaryRoleMutation = useMutation({
    mutationFn: async (roleId: string) => {
      await supabase
        .from('user_profile_roles')
        .update({ is_primary: false })
        .eq('user_id', userId);

      const { error } = await supabase
        .from('user_profile_roles')
        .update({ is_primary: true })
        .eq('id', roleId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-roles', userId] });
      toast.success('Primary role updated');
    }
  });

  // Create the table data - show paired and unpaired assignments correctly
  const createTableData = (): DepartmentRolePair[] => {
    const pairs: DepartmentRolePair[] = [];
    const usedPairingIds = new Set<string>();
    
    // First, find paired assignments (departments and roles with matching pairing_id)
    userDepartments.forEach(dept => {
      if (dept.pairing_id) {
        const matchingRole = userRoles.find(role => role.pairing_id === dept.pairing_id);
        if (matchingRole) {
          pairs.push({
            id: `pair-${dept.pairing_id}`,
            departmentId: dept.department_id,
            departmentName: dept.department_name,
            departmentAssignmentId: dept.id,
            roleName: matchingRole.role_name,
            roleId: matchingRole.id,
            isDepartmentPrimary: dept.is_primary,
            isRolePrimary: matchingRole.is_primary,
          });
          usedPairingIds.add(dept.pairing_id);
        }
      }
    });
    
    // Add standalone departments (no pairing_id or no matching role)
    userDepartments.forEach(dept => {
      if (!dept.pairing_id || !usedPairingIds.has(dept.pairing_id)) {
        pairs.push({
          id: `dept-${dept.id}`,
          departmentId: dept.department_id,
          departmentName: dept.department_name,
          departmentAssignmentId: dept.id,
          isDepartmentPrimary: dept.is_primary,
        });
      }
    });
    
    // Add standalone roles (no pairing_id or no matching department)
    userRoles.forEach(role => {
      if (!role.pairing_id || !usedPairingIds.has(role.pairing_id)) {
        pairs.push({
          id: `role-${role.id}`,
          roleName: role.role_name,
          roleId: role.id,
          isRolePrimary: role.is_primary,
        });
      }
    });
    
    // Sort to show primary assignments first
    pairs.sort((a, b) => {
      const aPrimary = a.isDepartmentPrimary || a.isRolePrimary;
      const bPrimary = b.isDepartmentPrimary || b.isRolePrimary;
      if (aPrimary && !bPrimary) return -1;
      if (!aPrimary && bPrimary) return 1;
      return 0;
    });

    // Add new rows
    pairs.push(...newRows);
    
    return pairs;
  };

  const getAvailableRoles = (selectedDepartmentId?: string) => {
    console.log('getAvailableRoles called with:', selectedDepartmentId);
    console.log('allRoles:', allRoles);
    
    if (!selectedDepartmentId) {
      // Show only roles without departments (general roles)
      const generalRoles = allRoles.filter(role => !role.department_id);
      console.log('No department selected, showing general roles:', generalRoles);
      return generalRoles;
    }
    
    // Show ONLY roles from the selected department (not general roles)
    const departmentRoles = allRoles.filter(role => role.department_id === selectedDepartmentId);
    console.log(`Department ${selectedDepartmentId} selected, showing ONLY department roles:`, departmentRoles);
    
    return departmentRoles;
  };

  const handleAddNewRow = () => {
    setNewRows(prev => [...prev, { isNewRow: true }]);
  };

  // Expose the handleAddNewRow function to parent components
  useImperativeHandle(ref, () => ({
    handleAddNewRow
  }));

  const handleNewRowDepartmentChange = (index: number, departmentId: string) => {
    if (departmentId === 'none') {
      departmentId = '';
    }

    const department = allDepartments.find(d => d.id === departmentId);
    const currentRow = newRows[index];
    
    // Check if current role is still valid for the new department
    const availableRoles = getAvailableRoles(departmentId || undefined);
    const isCurrentRoleStillValid = currentRow.roleId && 
      availableRoles.some(role => role.role_id === currentRow.roleId);
    
    const updatedRow = { 
      ...currentRow, 
      departmentId: departmentId || undefined, 
      departmentName: department?.name,
      // Clear role if it's no longer valid for the selected department
      roleId: isCurrentRoleStillValid ? currentRow.roleId : undefined,
      roleName: isCurrentRoleStillValid ? currentRow.roleName : undefined
    };
    
    setNewRows(prev => prev.map((row, i) => i === index ? updatedRow : row));
  };

  const handleNewRowRoleChange = (index: number, roleId: string) => {
    if (roleId === 'none') {
      roleId = '';
    }

    const role = allRoles.find(r => r.role_id === roleId);
    const updatedRow = { 
      ...newRows[index], 
      roleId: roleId || undefined,
      roleName: role?.name 
    };
    
    setNewRows(prev => prev.map((row, i) => i === index ? updatedRow : row));
  };

  const handleSaveNewRow = async (index: number) => {
    const row = newRows[index];
    
    console.log('UserDepartmentsRolesTable: Saving new row:', row);
    console.log('UserDepartmentsRolesTable: Current userRoles:', userRoles);
    console.log('UserDepartmentsRolesTable: Current userDepartments:', userDepartments);
    
    // Ensure at least one field is selected
    if (!row.departmentId && !row.roleId) {
      toast.error('Please select at least a department or role');
      return;
    }

    try {
      // Generate pairing_id if both department and role are selected
      const pairingId = (row.departmentId && row.roleId) ? crypto.randomUUID() : undefined;
      console.log('UserDepartmentsRolesTable: Generated pairingId:', pairingId);
      
      // Add department if selected and not already assigned
      if (row.departmentId) {
        const isDepartmentAlreadyAssigned = userDepartments.some(dept => dept.department_id === row.departmentId);
        console.log('UserDepartmentsRolesTable: Department already assigned?', isDepartmentAlreadyAssigned);
        console.log('UserDepartmentsRolesTable: Current userDepartments:', userDepartments);
        console.log('UserDepartmentsRolesTable: Looking for departmentId:', row.departmentId);
        if (!isDepartmentAlreadyAssigned) {
          const isPrimary = userDepartments.length === 0;
          console.log('UserDepartmentsRolesTable: Adding department with isPrimary:', isPrimary);
          console.log('UserDepartmentsRolesTable: Department params:', { 
            userId, 
            departmentId: row.departmentId, 
            isPrimary,
            pairingId,
            assignedBy: user?.id
          });
          await addDepartment({ 
            userId, 
            departmentId: row.departmentId, 
            isPrimary,
            pairingId,
            assignedBy: user?.id
          });
          console.log('UserDepartmentsRolesTable: Department addition completed');
        } else {
          console.log('UserDepartmentsRolesTable: Department already assigned, skipping');
        }
      }
      
      // Add role if selected and not already assigned
      if (row.roleId) {
        const isRoleAlreadyAssigned = userRoles.some(role => role.role_id === row.roleId);
        console.log('UserDepartmentsRolesTable: Role already assigned?', isRoleAlreadyAssigned);
        console.log('UserDepartmentsRolesTable: Checking roleId', row.roleId, 'against userRoles:', userRoles.map(r => r.role_id));
        if (!isRoleAlreadyAssigned) {
          console.log('UserDepartmentsRolesTable: Adding role with roleId:', row.roleId);
          await addRoleMutation.mutateAsync({ 
            roleId: row.roleId,
            pairingId
          });
        }
      }
      
      // Remove the new row after successful save
      setNewRows(prev => prev.filter((_, i) => i !== index));
      toast.success('Assignment saved successfully');
    } catch (error) {
      console.error('Error saving assignment:', error);
      toast.error('Failed to save assignment');
    }
  };

  const handleDeletePair = async (pair: DepartmentRolePair) => {
    try {
      // Remove department if it exists
      if (pair.departmentAssignmentId) {
        removeDepartment(pair.departmentAssignmentId);
      }
      
      // Remove role if it exists
      if (pair.roleId) {
        await removeRoleMutation.mutateAsync(pair.roleId);
      }
    } catch (error) {
      toast.error('Failed to delete assignment');
    }
  };

  const handleCancelNewRow = (index: number) => {
    setNewRows(prev => prev.filter((_, i) => i !== index));
  };

  // Set primary pair mutation
  const setPrimaryPairMutation = useMutation({
    mutationFn: async (pair: DepartmentRolePair) => {
      // First, unset all primary assignments for this user
      await supabase
        .from('user_departments')
        .update({ is_primary: false })
        .eq('user_id', userId);

      await supabase
        .from('user_profile_roles')
        .update({ is_primary: false })
        .eq('user_id', userId);

      // Then set the selected pair as primary
      if (pair.departmentAssignmentId) {
        const { error: deptError } = await supabase
          .from('user_departments')
          .update({ is_primary: true })
          .eq('id', pair.departmentAssignmentId);

        if (deptError) throw deptError;
      }

      if (pair.roleId) {
        const { error: roleError } = await supabase
          .from('user_profile_roles')
          .update({ is_primary: true })
          .eq('id', pair.roleId);

        if (roleError) throw roleError;
      }
    },
    onSuccess: () => {
      refetchUserDepartments();
      queryClient.invalidateQueries({ queryKey: ['user-roles', userId] });
      toast.success('Primary assignment updated successfully');
    },
    onError: (error: any) => {
      toast.error('Failed to update primary assignment: ' + error.message);
    }
  });

  const tableData = createTableData();

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Department</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tableData.map((pair, index) => (
                <TableRow key={pair.id || `new-${index}`}>
                  <TableCell>
                    {pair.isNewRow ? (
                      <Select 
                        value={pair.departmentId || ''} 
                        onValueChange={(value) => handleNewRowDepartmentChange(index - (tableData.length - newRows.length), value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select department..." />
                        </SelectTrigger>
                        <SelectContent className="bg-background border z-50">
                          {allDepartments.map((dept) => (
                            <SelectItem key={dept.id} value={dept.id}>
                              {dept.name}
                            </SelectItem>
                          ))}
                          <SelectItem value="none">
                            <span className="text-muted-foreground italic">Skip department</span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    ) : pair.departmentName ? (
                      <div className="flex items-center gap-2">
                        <Badge variant={pair.isDepartmentPrimary ? "default" : "secondary"}>
                          {pair.departmentName}
                        </Badge>
                        {pair.isDepartmentPrimary && (
                          <Star className="h-3 w-3 fill-current text-yellow-500" />
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground italic">No department</span>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    {pair.isNewRow ? (
                      <Select 
                        value={pair.roleId || ''} 
                        onValueChange={(value) => handleNewRowRoleChange(index - (tableData.length - newRows.length), value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select role..." />
                        </SelectTrigger>
                        <SelectContent className="bg-background border z-50">
                          {getAvailableRoles(pair.departmentId).map((role) => (
                            <SelectItem key={role.role_id} value={role.role_id}>
                              {role.name}
                              {role.department_id && (
                                <span className="text-xs text-muted-foreground ml-1">
                                  (Dept. role)
                                </span>
                              )}
                            </SelectItem>
                          ))}
                          <SelectItem value="none">
                            <span className="text-muted-foreground italic">Skip role</span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    ) : pair.roleName ? (
                      <div className="flex items-center gap-2">
                        <Badge variant={pair.isRolePrimary ? "default" : "secondary"}>
                          {pair.roleName}
                        </Badge>
                        {pair.isRolePrimary && (
                          <Star className="h-3 w-3 fill-current text-yellow-500" />
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground italic">No role</span>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    {pair.isNewRow ? (
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleSaveNewRow(index - (tableData.length - newRows.length))}
                          className="h-6 w-6 p-0 hover:bg-primary hover:text-primary-foreground"
                          disabled={!pair.departmentId && !pair.roleId}
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleCancelNewRow(index - (tableData.length - newRows.length))}
                          className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (pair.departmentName || pair.roleName) ? (
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setPrimaryPairMutation.mutate(pair)}
                          disabled={setPrimaryPairMutation.isPending || (pair.isDepartmentPrimary && pair.isRolePrimary)}
                          className="h-6 w-6 p-0 hover:bg-yellow-500 hover:text-white"
                          title="Set as primary"
                        >
                          <Star 
                            className={`h-3 w-3 ${
                              pair.isDepartmentPrimary || pair.isRolePrimary 
                                ? 'fill-current text-yellow-500' 
                                : 'text-muted-foreground'
                            }`} 
                          />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
                          onClick={() => handleDeletePair(pair)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
              
              {tableData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">
                    No department or role assignments
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
});