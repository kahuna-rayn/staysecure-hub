import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface DatabaseSelectCellProps {
  value: string;
  table: string;
  valueField: string;
  displayField: string;
  filterBy?: string;
  filterValue?: string;
  onValueChange: (value: string) => void;
  onSave: (value?: string) => void;
  onMoveToNext: () => void;
}

export function DatabaseSelectCell({
  value,
  table,
  valueField,
  displayField,
  filterBy,
  filterValue,
  onValueChange,
  onSave,
  onMoveToNext
}: DatabaseSelectCellProps) {
  const { data: options, isLoading } = useQuery({
    queryKey: [`${table}-options-v3`, filterValue], // Updated cache key
    queryFn: async () => {
      // Create dynamic query based on table name
      if (table === 'departments') {
        const { data, error } = await supabase
          .from('departments')
          .select('id, name')
          .order('name');
        if (error) throw error;
        return data;
      }
      
      if (table === 'roles') {
        let query = supabase
          .from('roles')
          .select('role_id, name, department_id')
          .eq('is_active', true);

        // Handle filtering for roles by user's departments
        if (filterBy === 'user_departments' && filterValue && filterValue !== '') {
          // Get user's assigned department IDs
          const { data: userDepartments } = await supabase
            .from('user_departments')
            .select('department_id')
            .eq('user_id', filterValue);
          
          if (userDepartments && userDepartments.length > 0) {
            const departmentIds = userDepartments.map(ud => ud.department_id);
            // Show roles from user's departments OR roles without departments (designation roles)
            const departmentFilter = departmentIds.map(id => `department_id.eq.${id}`).join(',');
            query = query.or(`${departmentFilter},department_id.is.null`);
          } else {
            // If user has no departments, only show designation roles
            query = query.is('department_id', null);
          }
        } else if (filterBy === 'department' && filterValue && filterValue !== '') {
          // Legacy single department filtering
          const { data: department } = await supabase
            .from('departments')
            .select('id')
            .eq('name', filterValue)
            .maybeSingle();
          
          if (department) {
            // Show roles that either belong to the selected department OR have no department (designation roles)
            query = query.or(`department_id.eq.${department.id},department_id.is.null`);
          } else {
            // If department not found, only show designation roles
            query = query.is('department_id', null);
          }
        }
        // If no department filter, show all roles (default behavior)

        const { data, error } = await query.order('name');
        if (error) throw error;
        return data;
      }

      if (table === 'locations') {
        const { data, error } = await supabase
          .from('locations')
          .select('id, name')
          .eq('status', 'Active')
          .order('name');
        if (error) throw error;
        return data;
      }

      if (table === 'profiles') {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, username')
          .order('full_name');
        if (error) throw error;
        return data;
      }

      return [];
    },
  });

  const handleSelectKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      onMoveToNext();
    }
  };

  if (isLoading) {
    return (
      <div className="p-3 h-full flex items-center">
        <span className="text-sm text-muted-foreground">Loading...</span>
      </div>
    );
  }

  return (
    <div className="p-3 h-full flex items-center">
      <Select 
        value={value} 
        onValueChange={(val) => {
          onValueChange(val);
          onSave(val);
        }}
        onOpenChange={(open) => {
          if (!open) {
            setTimeout(() => onMoveToNext(), 0);
          }
        }}
      >
        <SelectTrigger 
          className="w-full h-8"
          onKeyDown={handleSelectKeyDown}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options?.map((option) => (
            <SelectItem key={option.role_id || option.id} value={option[valueField] || option.name}>
              {option[displayField] || option.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}