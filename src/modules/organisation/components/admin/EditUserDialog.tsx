import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useQuery } from '@tanstack/react-query';
import { useOrganisationContext } from '../../context/OrganisationContext';
import type { UserProfile } from '../../types';

interface EditUserDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingUser: UserProfile | null;
  onUserChange: (user: UserProfile | null) => void;
  onSubmit: (e: React.FormEvent) => void;
}

const EditUserDialog: React.FC<EditUserDialogProps> = ({
  isOpen,
  onOpenChange,
  editingUser,
  onUserChange,
  onSubmit
}) => {
  const { supabaseClient } = useOrganisationContext();

  // Fetch locations for dropdown
  const { data: locations } = useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      const { data } = await supabaseClient
        .from('locations')
        .select('id, name')
        .eq('status', 'Active')
        .order('name');
      return data || [];
    },
  });

  if (!editingUser) return null;

  const updateField = (field: keyof UserProfile, value: string) => {
    onUserChange({ ...editingUser, [field]: value });
  };

  const handleLocationChange = (locationId: string) => {
    const selectedLocation = locations?.find(loc => loc.id === locationId);
    if (selectedLocation) {
      onUserChange({ 
        ...editingUser, 
        location_id: locationId,
        location: selectedLocation.name 
      });
    }
  };

  // Find the correct location_id if it's missing but location name exists
  const getLocationId = () => {
    if (editingUser.location_id) {
      return editingUser.location_id;
    }
    if (editingUser.location && locations) {
      const foundLocation = locations.find(loc => loc.name === editingUser.location);
      return foundLocation?.id || '';
    }
    return '';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Update user information
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit_full_name">Full Name</Label>
              <Input
                id="edit_full_name"
                value={editingUser.full_name || ''}
                onChange={(e) => updateField('full_name', e.target.value)}
                placeholder="Enter full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_username">Username</Label>
              <Input
                id="edit_username"
                value={editingUser.username || ''}
                onChange={(e) => updateField('username', e.target.value)}
                placeholder="Enter username"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit_email">Email</Label>
              <Input
                id="edit_email"
                type="email"
                value={editingUser.email || ''}
                onChange={(e) => updateField('email', e.target.value)}
                placeholder="Enter email address"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_phone">Phone</Label>
              <Input
                id="edit_phone"
                value={editingUser.phone || ''}
                onChange={(e) => updateField('phone', e.target.value)}
                placeholder="Enter phone number"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit_role">Role</Label>
              <Input
                id="edit_role"
                value={editingUser.role || ''}
                onChange={(e) => updateField('role', e.target.value)}
                placeholder="Enter user role"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_department">Department</Label>
              <Input
                id="edit_department"
                value={editingUser.department || ''}
                onChange={(e) => updateField('department', e.target.value)}
                placeholder="Enter department"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit_employee_id">Employee ID</Label>
              <Input
                id="edit_employee_id"
                value={editingUser.employee_id || ''}
                onChange={(e) => updateField('employee_id', e.target.value)}
                placeholder="Enter employee ID"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_location">Location</Label>
              <Select value={getLocationId()} onValueChange={handleLocationChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a location" />
                </SelectTrigger>
                <SelectContent>
                  {locations?.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit_status">Status</Label>
              <Select 
                value={editingUser.status || 'Active'} 
                onValueChange={(value) => updateField('status', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_access_level">Access Level</Label>
              <Select 
                value={editingUser.access_level || 'User'} 
                onValueChange={(value) => updateField('access_level', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="User">User</SelectItem>
                  <SelectItem value="Manager">Manager</SelectItem>
                  <SelectItem value="Admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit_bio">Bio</Label>
            <Textarea
              id="edit_bio"
              value={editingUser.bio || ''}
              onChange={(e) => updateField('bio', e.target.value)}
              placeholder="Enter bio (optional)"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Update User</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
export default EditUserDialog;