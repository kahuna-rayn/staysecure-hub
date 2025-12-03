
import React from 'react';
import UserCard from './UserCard';
import type { UserProfile } from '@/hooks/useUserProfiles';

interface UserListProps {
  profiles: UserProfile[];
  onEdit: (user: UserProfile) => void;
  onDelete: (userId: string) => void;
}

const UserList: React.FC<UserListProps> = ({ profiles, onEdit, onDelete }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {profiles.map((user) => (
        <UserCard
          key={user.id}
          user={user}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};

export default UserList;
