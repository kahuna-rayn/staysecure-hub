import React from 'react';
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useOrganisationContext } from '../../context/OrganisationContext';
import type { NewUser } from '../../types';
import EditableField from '@/modules/organisation/components/profile/EditableField';
import { useAuth } from 'staysecure-auth';

interface CreateUserDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  newUser: NewUser;
  onUserChange: (user: NewUser) => void;
  onSubmit: (e: React.FormEvent) => void;
  loading?: boolean;
}


const CreateUserDialog: React.FC<CreateUserDialogProps> = ({
  isOpen,
  onOpenChange,
  newUser,
  onUserChange,
  onSubmit,
  loading = false
}) => {
const [editingField, setEditingField] = useState<string | null>(null);
const [saving, setSaving] = useState(false);
const { supabaseClient } = useOrganisationContext();
const [isFullNameManuallyEdited, setIsFullNameManuallyEdited] = useState(false);
const { user } = useAuth();

// Check if current user is super_admin
const { data: currentUserRole } = useQuery({
  queryKey: ['user-role', user?.id],
  queryFn: async () => {
    if (!user?.id) return null;
    const { data } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();
    return data?.role;
  },
  enabled: !!user?.id
});

const isSuperAdmin = currentUserRole === 'super_admin';

  // Form validation
  const isFormValid = () => {
    const requiredFields = [
      newUser.first_name?.trim(),
      newUser.last_name?.trim(),
      newUser.email?.trim(),
      newUser.access_level,
      newUser.location_id
    ];
    
    // Check if all required fields have values
    const allFieldsFilled = requiredFields.every(field => field && field.length > 0);
    
    // Check email format
    const emailValid = newUser.email?.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newUser.email.trim());
    
    return allFieldsFilled && emailValid;
  };

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

  // Phone validation function
  const validatePhoneInput = (input: string): string => {
    return input.replace(/[^0-9+\s\-\(\)]/g, '');
  };

  const updateField = (field: string, value: string) => {
    // Apply phone validation for phone field
    if (field === 'phone') {
      const validatedValue = validatePhoneInput(value);
      onUserChange({ ...newUser, [field]: validatedValue });
    } else {
      onUserChange({ ...newUser, [field]: value });
    }
  };

  const handleLocationChange = (locationId: string) => {
    const selectedLocation = locations?.find(loc => loc.id === locationId);
    if (selectedLocation) {
      onUserChange({ 
        ...newUser, 
        location_id: locationId,
        location: selectedLocation.name 
      });
    }
  };

  const handleNameChange = (field: 'first_name' | 'last_name', value: string) => {
  //console.log('handleNameChange called:', { field, value, currentFullName: newUser.full_name, isManuallyEdited: isFullNameManuallyEdited });
  const updatedUser = { ...newUser, [field]: value };
  
  // Only auto-update full_name if it has NOT been manually edited by the user
  if (!isFullNameManuallyEdited) {
    const firstName = field === 'first_name' ? value : updatedUser.first_name || '';
    const lastName = field === 'last_name' ? value : updatedUser.last_name || '';
    updatedUser.full_name = `${firstName} ${lastName}`.trim();
    //console.log('Auto-generating full_name:', { firstName, lastName, fullName: updatedUser.full_name });
  }
  
  onUserChange(updatedUser);
};

const handleFullNameChange = (value: string) => {
  // Mark that user has manually edited the full name
  setIsFullNameManuallyEdited(true);
  onUserChange({ ...newUser, full_name: value });
};

  const handleFieldEdit = (field: string) => {
    setEditingField(field);
  };
  const handleFieldCancel = () => {
    setEditingField(null);
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      const resetUser: NewUser = {
        first_name: '',
        last_name: '',
        full_name: '',
        email: '',
        password: '',
        username: '',
        phone: '',
        employee_id: '',
        status: 'Active',
        access_level: 'User',
        location_id: '',
        location: '',
        bio: ''
      };
      onUserChange(resetUser);
      setIsFullNameManuallyEdited(false); 
      setEditingField(null);
      setSaving(false);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New User</DialogTitle>
          <DialogDescription>
            Add a new user to your organization. The user will receive an activation email to set their password.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name <span className="text-red-500">*</span></Label>
              <Input
                id="first_name"
                value={newUser.first_name}
                onChange={(e) => handleNameChange('first_name', e.target.value)}
                placeholder="Enter first name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name <span className="text-red-500">*</span></Label>
              <Input
                id="last_name"
                value={newUser.last_name}
                onChange={(e) => handleNameChange('last_name', e.target.value)}
                placeholder="Enter last name"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name (Auto-generated, editable)</Label>
              <Input
                id="full_name"
                value={newUser.full_name || `${newUser.first_name} ${newUser.last_name}`.trim()}
                onChange={(e) => handleFullNameChange(e.target.value)}
                placeholder="Enter full name"
                className="flex-1"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address <span className="text-red-500">*</span></Label>
              <Input
                id="email"
                type="email"
                value={newUser.email}
                onChange={(e) => updateField('email', e.target.value)}
                placeholder="Enter email address"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="access_level">Access Level <span className="text-red-500">*</span></Label>
              <Select 
                value={newUser.access_level} 
                onValueChange={(value) => {
                  // Map display values to backend values
                  const backendValue = value === 'Admin' ? 'client_admin' : value.toLowerCase();
                  updateField('access_level', backendValue);
                }}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select access level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="client_admin">Admin</SelectItem>
                  {isSuperAdmin && <SelectItem value="author">Author</SelectItem>}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location <span className="text-red-500">*</span></Label>
              <Select value={newUser.location_id || ''} onValueChange={handleLocationChange} required>
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
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={newUser.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                placeholder="Enter phone number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="employee_id">Employee ID</Label>
              <Input
                id="employee_id"
                value={newUser.employee_id}
                onChange={(e) => updateField('employee_id', e.target.value)}
                placeholder="Enter employee ID"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={newUser.bio}
              onChange={(e) => updateField('bio', e.target.value)}
              placeholder="Enter bio (optional)"
              rows={3}
            />
          </div>

          <div className="text-sm text-muted-foreground">
            <span className="text-red-500">*</span> Required fields
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleDialogClose(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !isFormValid()}>
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                "Create User"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}; 
export default CreateUserDialog;