import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserDepartments } from '@/hooks/useUserDepartments';
import { X, Plus, Star } from 'lucide-react';

interface MultiDepartmentSelectCellProps {
  userId: string;
  onSave: () => void;
  onMoveToNext: () => void;
}

export function MultiDepartmentSelectCell({
  userId,
  onSave,
  onMoveToNext
}: MultiDepartmentSelectCellProps) {
  const [selectedDepartmentId, setSelectedDepartmentId] = useState('');
  const { 
    userDepartments, 
    addDepartment, 
    removeDepartment, 
    setPrimaryDepartment,
    isAddingDepartment 
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

  // Get departments not yet assigned to user
  const availableDepartments = allDepartments.filter(
    dept => !userDepartments.some(ud => ud.department_id === dept.id)
  );

  const handleAddDepartment = () => {
    if (selectedDepartmentId) {
      const isPrimary = userDepartments.length === 0; // First department becomes primary
      addDepartment({ 
        userId, 
        departmentId: selectedDepartmentId, 
        isPrimary 
      });
      setSelectedDepartmentId('');
      onSave();
    }
  };

  const handleRemoveDepartment = (assignmentId: string) => {
    removeDepartment(assignmentId);
    onSave();
  };

  const handleSetPrimary = (departmentId: string) => {
    setPrimaryDepartment({ userId, departmentId });
    onSave();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      onMoveToNext();
    }
  };

  return (
    <div className="p-3 min-h-[60px] flex flex-col gap-2">
      {/* Display current departments */}
      <div className="flex flex-wrap gap-1">
        {userDepartments.map((userDept) => (
          <Badge 
            key={userDept.id} 
            variant="secondary" 
            className="flex items-center gap-1"
          >
            {userDept.is_primary && (
              <Star className="h-3 w-3 fill-current text-yellow-500" />
            )}
            <span>{userDept.department_name}</span>
            <Button
              size="sm"
              variant="ghost"
              className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
              onClick={() => handleRemoveDepartment(userDept.id)}
            >
              <X className="h-3 w-3" />
            </Button>
            {!userDept.is_primary && userDepartments.length > 1 && (
              <Button
                size="sm"
                variant="ghost"
                className="h-4 w-4 p-0 ml-1"
                onClick={() => handleSetPrimary(userDept.department_id)}
                title="Set as primary department"
              >
                <Star className="h-3 w-3" />
              </Button>
            )}
          </Badge>
        ))}
      </div>

      {/* Add new department */}
      {availableDepartments.length > 0 && (
        <div className="flex gap-2 items-center">
          <Select 
            value={selectedDepartmentId} 
            onValueChange={setSelectedDepartmentId}
            onOpenChange={(open) => {
              if (!open && !selectedDepartmentId) {
                setTimeout(() => onMoveToNext(), 0);
              }
            }}
          >
            <SelectTrigger 
              className="flex-1 h-8"
              onKeyDown={handleKeyDown}
            >
              <SelectValue placeholder="Add department..." />
            </SelectTrigger>
            <SelectContent>
              {availableDepartments.map((dept) => (
                <SelectItem key={dept.id} value={dept.id}>
                  {dept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            onClick={handleAddDepartment}
            disabled={!selectedDepartmentId || isAddingDepartment}
            className="h-8 px-2"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      )}

      {userDepartments.length === 0 && (
        <span className="text-sm text-muted-foreground">No departments assigned</span>
      )}
    </div>
  );
}