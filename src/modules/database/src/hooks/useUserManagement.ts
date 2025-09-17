import { useState } from 'react';

interface UserProfile {
  id: string;
  full_name?: string;
  email?: string;
  role?: string;
  department?: string;
  status?: string;
  first_name?: string;
  last_name?: string;
  username?: string;
  phone?: string;
  location?: string;
  location_id?: string;
  access_level?: string;
  bio?: string;
  employee_id?: string;
  manager?: string;
  avatar_url?: string;
  cyber_learner?: boolean;
  dpe_learner?: boolean;
  learn_complete?: boolean;
  dpe_complete?: boolean;
  enrolled_in_learn?: boolean;
  language?: string;
  start_date?: string;
  last_login?: string;
  password_last_changed?: string;
  two_factor_enabled?: boolean;
  created_at?: string;
  updated_at?: string;
}

interface NewUser {
  email: string;
  password: string;
  full_name: string;
  first_name: string;
  last_name: string;
  username: string;
  phone: string;
  location: string;
  location_id?: string;
  status: string;
  access_level: string;
  bio: string;
  employee_id: string;
}

export const useUserManagement = () => {
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');
  const [newUser, setNewUser] = useState<NewUser>({
    email: '',
    password: '',
    full_name: '',
    first_name: '',
    last_name: '',
    username: '',
    phone: '',
    location: '',
    location_id: '',
    status: 'Active',
    access_level: 'User',
    bio: '',
    employee_id: ''
  });

  const openEditDialog = (user: UserProfile) => {
    setEditingUser(user);
    setIsEditDialogOpen(true);
  };

  const closeEditDialog = () => {
    setIsEditDialogOpen(false);
    setEditingUser(null);
  };

  const resetNewUser = () => {
    setNewUser({
      email: '',
      password: '',
      full_name: '',
      first_name: '',
      last_name: '',
      username: '',
      phone: '',
      location: '',
      location_id: '',
      status: 'Active',
      access_level: 'User',
      bio: '',
      employee_id: ''
    });
  };

  return {
    editingUser,
    setEditingUser,
    isEditDialogOpen,
    setIsEditDialogOpen,
    isCreateDialogOpen,
    setIsCreateDialogOpen,
    viewMode,
    setViewMode,
    newUser,
    setNewUser,
    openEditDialog,
    closeEditDialog,
    resetNewUser
  };
};