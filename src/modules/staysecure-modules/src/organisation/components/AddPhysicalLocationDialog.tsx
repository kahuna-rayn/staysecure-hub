
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfiles } from '@/hooks/useUserProfiles';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

interface AddPhysicalLocationDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  prefilledUser?: {
    full_name: string;
    email: string;
    department: string;
    role: string;
  };
  onSuccess?: () => void;
}

const AddPhysicalLocationDialog: React.FC<AddPhysicalLocationDialogProps> = ({
  isOpen,
  onOpenChange,
  prefilledUser,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const { profiles } = useUserProfiles();
  
  const [formData, setFormData] = useState({
    full_name: prefilledUser?.full_name || '',
    email: prefilledUser?.email || '',
    department: prefilledUser?.department || '',
    role_account_type: prefilledUser?.role || '',
    location: '',
    access_purpose: '',
    date_access_created: new Date().toISOString().split('T')[0],
    date_access_revoked: '',
    status: 'Active',
  });

  const handleUserSelection = (userId: string) => {
    setSelectedUserId(userId);
    if (userId === 'none') {
      // Clear user data when "Create without user" is selected
      setFormData(prev => ({
        ...prev,
        full_name: '',
        email: '',
        department: '',
        role_account_type: '',
      }));
    } else {
      const selectedUser = profiles.find(profile => profile.id === userId);
      if (selectedUser) {
        setFormData(prev => ({
          ...prev,
          full_name: selectedUser.full_name || '',
          email: selectedUser.email || '',
          department: selectedUser.department || '',
          role_account_type: selectedUser.role || '',
        }));
      }
    }
  };

  const resetForm = () => {
    setSelectedUserId('');
    setFormData({
      full_name: prefilledUser?.full_name || '',
      email: prefilledUser?.email || '',
      department: prefilledUser?.department || '',
      role_account_type: prefilledUser?.role || '',
      location: '',
      access_purpose: '',
      date_access_created: new Date().toISOString().split('T')[0],
      date_access_revoked: '',
      status: 'Active',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Only insert if we have at least a location and access purpose
      if (!formData.location || !formData.access_purpose) {
        throw new Error('Location and Access Purpose are required');
      }

      const insertData = {
        full_name: formData.full_name || 'Unassigned',
        user_id: 'ae5c8c73-e0c3-4a86-9c0d-123456789abc', // Placeholder user ID - should be dynamic
        location_id: formData.location, // Assuming this is already a UUID
        access_purpose: formData.access_purpose,
        date_access_created: formData.date_access_created,
        date_access_revoked: formData.date_access_revoked || null,
        status: formData.status,
      };

      const { error } = await supabase
        .from('physical_location_access')
        .insert([insertData]);

      if (error) throw error;

      toast({
        title: "Physical location access added",
        description: formData.full_name === 'Unassigned' 
          ? "Location access record created without user assignment."
          : "Physical location access has been successfully added.",
      });
      
      onOpenChange(false);
      resetForm();
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Physical Location Access</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {!prefilledUser && (
              <div className="col-span-2">
                <Label htmlFor="user_select">Assign to User (Optional)</Label>
                <Select value={selectedUserId} onValueChange={handleUserSelection}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a user or create without assignment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Create without user assignment</SelectItem>
                    {profiles.map((profile) => (
                      <SelectItem key={profile.id} value={profile.id}>
                        {profile.full_name || 'No name'} ({profile.email || profile.username || 'No email'})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {(selectedUserId && selectedUserId !== 'none') && (
              <div className="col-span-2 p-3 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">Selected User Details:</h4>
                <p><strong>Name:</strong> {formData.full_name}</p>
                <p><strong>Email:</strong> {formData.email}</p>
                <p><strong>Department:</strong> {formData.department || 'Not specified'}</p>
                <p><strong>Role:</strong> {formData.role_account_type || 'Not specified'}</p>
              </div>
            )}

            <div>
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="Leave empty for unassigned"
                disabled={!!prefilledUser || (selectedUserId && selectedUserId !== 'none')}
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Leave empty for unassigned"
                disabled={!!prefilledUser || (selectedUserId && selectedUserId !== 'none')}
              />
            </div>
            <div>
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                disabled={!!prefilledUser || (selectedUserId && selectedUserId !== 'none')}
              />
            </div>
            <div>
              <Label htmlFor="role_account_type">Role/Account Type</Label>
              <Input
                id="role_account_type"
                value={formData.role_account_type}
                onChange={(e) => setFormData({ ...formData, role_account_type: e.target.value })}
                disabled={!!prefilledUser || (selectedUserId && selectedUserId !== 'none')}
              />
            </div>
            <div>
              <Label htmlFor="location">Location *</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g., Building A - Floor 3, Server Room"
                required
              />
            </div>
            <div>
              <Label htmlFor="access_purpose">Access Purpose *</Label>
              <Input
                id="access_purpose"
                value={formData.access_purpose}
                onChange={(e) => setFormData({ ...formData, access_purpose: e.target.value })}
                placeholder="e.g., Maintenance, Security, Operations"
                required
              />
            </div>
            <div>
              <Label htmlFor="date_access_created">Date Access Created *</Label>
              <Input
                id="date_access_created"
                type="date"
                value={formData.date_access_created}
                onChange={(e) => setFormData({ ...formData, date_access_created: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="date_access_revoked">Date Access Revoked</Label>
              <Input
                id="date_access_revoked"
                type="date"
                value={formData.date_access_revoked}
                onChange={(e) => setFormData({ ...formData, date_access_revoked: e.target.value })}
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                  <SelectItem value="Revoked">Revoked</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add Location Access"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddPhysicalLocationDialog;
