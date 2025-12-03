import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUserRoleById, AppRole } from '@/hooks/useUserRoleById';
import { useUserRole } from '@/hooks/useUserRole';
import { Loader2, Key } from 'lucide-react';

interface UserRoleFieldProps {
  userId: string;
}

export const UserRoleField: React.FC<UserRoleFieldProps> = ({ userId }) => {
  const [isEditing, setIsEditing] = useState(false);
  const { role, isLoading, updateRole, isUpdating, getRoleDisplayName, getRoleBadgeVariant } = useUserRoleById(userId);
  const { hasAdminAccess } = useUserRole();

  const roleOptions: { value: AppRole; label: string }[] = [
    { value: 'user', label: 'User' },
    { value: 'author', label: 'Author' },
    { value: 'manager', label: 'Manager' },
    { value: 'client_admin', label: 'Client Administrator' },
    { value: 'super_admin', label: 'Super Administrator' },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm text-muted-foreground">Loading role...</span>
      </div>
    );
  }

  const handleRoleChange = async (newRole: AppRole) => {
    await updateRole(newRole);
    setIsEditing(false);
  };

  // Display mode - show as text with icon
  if (!isEditing) {
    return (
      <div className="flex items-center gap-2">
        <Key className="h-4 w-4 text-muted-foreground" />
        <Badge 
          variant={getRoleBadgeVariant(role)}
          className={`text-sm ${hasAdminAccess ? 'cursor-pointer hover:bg-muted/50 px-2 py-1 rounded transition-colors' : ''}`}
          onClick={() => hasAdminAccess && setIsEditing(true)}
        >
          {getRoleDisplayName(role)}
        </Badge>
      </div>
    );
  }

  // Edit mode - show dropdown
  return (
    <div className="flex items-center gap-2">
      <Key className="h-4 w-4 text-muted-foreground" />
      <Select
        value={role || 'user'}
        onValueChange={(value) => handleRoleChange(value as AppRole)}
        disabled={isUpdating}
        open={isEditing}
        onOpenChange={setIsEditing}
      >
        <SelectTrigger className="w-48 h-8 text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="z-50">
          {roleOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {isUpdating && <Loader2 className="h-4 w-4 animate-spin" />}
    </div>
  );
};
