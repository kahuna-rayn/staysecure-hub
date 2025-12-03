import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUserProfiles } from '@/hooks/useUserProfiles';
import { useUserManagement } from '@/hooks/useUserManagement';
import { useViewPreference } from '@/hooks/useViewPreference';
import { handleSaveUser, handleCreateUser, handleDeleteUser } from '../../utils/userManagementActions';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { LayoutGrid, List } from 'lucide-react';
import { useOrganisationContext } from '../../context/OrganisationContext';
import { DeleteUserDialog } from '@/components/ui/delete-user-dialog';
import { useToast } from '@/hooks/use-toast';
import UserList from './UserList';
import UserTable from './UserTable';
import CreateUserDialog from './CreateUserDialog';
import EditUserDialog from './EditUserDialog';
import ImportUsersDialog from './ImportUsersDialog';
import { ImportErrorReport, ImportError } from '@/components/import/ImportErrorReport';


const UserManagement: React.FC = () => {
  const { hasPermission, onUserAction } = useOrganisationContext();
  const { profiles, loading, updateProfile, refetch } = useUserProfiles();
  const { toast } = useToast();
  const [viewMode, setViewMode] = useViewPreference('userManagement', 'cards');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showImportErrorReport, setShowImportErrorReport] = useState(false);
  const [importErrors, setImportErrors] = useState<ImportError[]>([]);
  const [importWarnings, setImportWarnings] = useState<ImportError[]>([]);
  const [importStats, setImportStats] = useState({ success: 0, total: 0 });
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  
  const {
    editingUser,
    setEditingUser,
    isEditDialogOpen,
    setIsEditDialogOpen,
    isCreateDialogOpen,
    setIsCreateDialogOpen,
    newUser,
    setNewUser,
    openEditDialog,
    closeEditDialog,
    resetNewUser
  } = useUserManagement();

  const onSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    await handleSaveUser(editingUser, async (id, updates) => {
      await updateProfile(id, updates);
    }, closeEditDialog);
  };

  const onCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsCreatingUser(true);
    
    try {
      await handleCreateUser(newUser, async (id, updates) => {
        await updateProfile(id, updates);
      }, async () => {
        // Refresh the user list after successful creation
        await refetch();
      });
      
      // Close dialog and reset form only after successful creation
      setIsCreateDialogOpen(false);
      resetNewUser();
    } catch (error) {
      // Keep dialog open on error so user can see the error and retry
      console.error('Error creating user:', error);
    } finally {
      setIsCreatingUser(false);
    }
  };

  const onDeleteUser = (userId: string) => {
    const user = profiles.find(p => p.id === userId);
    setUserToDelete({ id: userId, name: user?.full_name || 'Unknown User' });
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async (reason: string) => {
    if (!userToDelete) return;
    setIsDeleting(true);
    try {
      const result = await handleDeleteUser(userToDelete.id, userToDelete.name, reason);
      if (result.success) {
        // Close dialog first
        setIsDeleteDialogOpen(false);
        setUserToDelete(null);
        
        // Show success toast after dialog is closed
        toast({
          title: "Success",
          description: `User ${result.deletedUser?.name || userToDelete.name} has been successfully deleted`,
        });
        
        // Refresh the user list after successful deletion
        await refetch();
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const onUpdateProfile = async (id: string, updates: any) => {
    const result = await updateProfile(id, updates);
    return { success: result.success, error: result.error };
  };

  if (loading) {
    return <div>Loading users...</div>;
  }

  return (
    <>
      <ImportErrorReport
        errors={importErrors}
        warnings={importWarnings}
        successCount={importStats.success}
        totalCount={importStats.total}
        isOpen={showImportErrorReport}
        onClose={() => setShowImportErrorReport(false)}
        importType="Users"
      />
      
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">User Management</h2>
          <div className="flex items-center gap-4">
            <ToggleGroup 
              type="single" 
              value={viewMode} 
              onValueChange={(value) => value && setViewMode(value as 'cards' | 'list')}
            >
              <ToggleGroupItem value="cards" aria-label="Card view">
                <LayoutGrid className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="list" aria-label="List view">
                <List className="h-4 w-4" />
              </ToggleGroupItem>
            </ToggleGroup>
            <ImportUsersDialog 
              onImportComplete={refetch}
              onImportError={(errors, warnings, stats) => {
                setImportErrors(errors);
                setImportWarnings(warnings);
                setImportStats(stats);
                setShowImportErrorReport(true);
              }}
            />
            <CreateUserDialog
              isOpen={isCreateDialogOpen}
              onOpenChange={setIsCreateDialogOpen}
              newUser={newUser}
              onUserChange={setNewUser}
              onSubmit={onCreateUser}
              loading={isCreatingUser}
            />
          </div>
        </div>

      {viewMode === 'cards' ? (
        <UserList
          profiles={profiles}
          onEdit={openEditDialog}
          onDelete={onDeleteUser}
        />
      ) : (
        <UserTable
          profiles={profiles}
          onEdit={openEditDialog}
          onDelete={onDeleteUser}
          onUpdate={onUpdateProfile}
        />
      )}

      <EditUserDialog
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        editingUser={editingUser}
        onUserChange={setEditingUser}
        onSubmit={onSaveUser}
      />

        <DeleteUserDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          userName={userToDelete?.name || ''}
          onConfirm={handleDeleteConfirm}
          loading={isDeleting}
        />
      </div>
    </>
  );
};
export default UserManagement;