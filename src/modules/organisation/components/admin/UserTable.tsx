
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { EditableTable } from '@/components/ui/editable-table';
import type { UserProfile } from '@/hooks/useUserProfiles';

interface UserTableProps {
  profiles: UserProfile[];
  onEdit: (user: UserProfile) => void;
  onDelete: (userId: string) => void;
  onUpdate: (id: string, updates: Partial<UserProfile>) => Promise<{ success: boolean; error?: string }>;
  onCreate?: (data: Partial<UserProfile>) => Promise<{ success: boolean; error?: string }>;
}

const UserTable: React.FC<UserTableProps> = ({ 
  profiles, 
  onUpdate,
  onDelete,
  onCreate 
}) => {
  const navigate = useNavigate();

  const columns = [
    { 
      key: 'full_name', 
      header: 'Full Name', 
      type: 'text' as const, 
      editable: true, 
      required: true,
      sortable: true,
      width: '300px'
    },
    { 
      key: 'username', 
      header: 'Username', 
      type: 'text' as const, 
      editable: true,
      sortable: true,
      width: '200px'
    },
    { 
      key: 'phone', 
      header: 'Phone', 
      type: 'text' as const, 
      editable: true,
      sortable: false,
      width: '150px'
    },
    { 
      key: 'location', 
      header: 'Location', 
      type: 'text' as const, 
      editable: true,
      sortable: true,
      width: '150px'
    },
    { 
      key: 'status', 
      header: 'Status', 
      type: 'badge' as const, 
      editable: true,
      sortable: true,
      options: ['Active', 'Inactive', 'OnLeave'],
      width: '120px'
    }
  ];

  const handleDelete = async (id: string) => {
    return new Promise<{ success: boolean; error?: string }>((resolve) => {
      onDelete(id);
      resolve({ success: true });
    });
  };

  const handleViewUser = (user: UserProfile) => {
    navigate(`/admin/users/${user.id}`);
  };

  return (
    <div className="w-full">
      <EditableTable
        data={profiles}
        columns={columns}
        onUpdate={onUpdate}
        onDelete={handleDelete}
        onCreate={onCreate}
        onViewUser={handleViewUser}
        allowAdd={true}
        allowDelete={true}
        allowView={true}
        className="w-full"
      />
    </div>
  );
};

export default UserTable;
