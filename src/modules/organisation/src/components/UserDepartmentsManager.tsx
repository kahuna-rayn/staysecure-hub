import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUserDepartments } from '@/hooks/useUserDepartments';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Plus, X, Star } from 'lucide-react';

interface UserDepartmentsManagerProps {
  userId: string;
}

export const UserDepartmentsManager: React.FC<UserDepartmentsManagerProps> = ({ userId }) => {
  const [selectedDepartmentId, setSelectedDepartmentId] = React.useState('');
  const { 
    userDepartments, 
    addDepartment, 
    removeDepartment, 
    setPrimaryDepartment,
    isLoading,
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
    }
  };

  const handleRemoveDepartment = (assignmentId: string) => {
    if (confirm('Are you sure you want to remove this department assignment?')) {
      removeDepartment(assignmentId);
    }
  };

  const handleSetPrimary = (departmentId: string) => {
    setPrimaryDepartment({ userId, departmentId });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Department Assignments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Department Assignments</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Display current departments */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Current Departments:</h4>
          {userDepartments.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {userDepartments.map((userDept) => (
                <Badge 
                  key={userDept.id} 
                  variant="secondary" 
                  className="flex items-center gap-2 px-3 py-1"
                >
                  {userDept.is_primary && (
                    <Star className="h-3 w-3 fill-current text-yellow-500" />
                  )}
                  <span>{userDept.department_name}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground ml-1"
                    onClick={() => handleRemoveDepartment(userDept.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                  {!userDept.is_primary && userDepartments.length > 1 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-4 w-4 p-0 ml-1 hover:bg-accent"
                      onClick={() => handleSetPrimary(userDept.department_id)}
                      title="Set as primary department"
                    >
                      <Star className="h-3 w-3" />
                    </Button>
                  )}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No departments assigned</p>
          )}
        </div>

        {/* Add new department */}
        {availableDepartments.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Add Department:</h4>
            <div className="flex gap-2 items-center">
              <Select 
                value={selectedDepartmentId} 
                onValueChange={setSelectedDepartmentId}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select department to add..." />
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
                onClick={handleAddDepartment}
                disabled={!selectedDepartmentId || isAddingDepartment}
                size="sm"
              >
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </div>
          </div>
        )}

        {/* Note about roles */}
        {userDepartments.length > 0 && (
          <div className="text-xs text-muted-foreground mt-4 p-2 bg-muted/50 rounded">
            <strong>Note:</strong> The user can see roles from all assigned departments plus roles without specific departments (designations).
          </div>
        )}
      </CardContent>
    </Card>
  );
};