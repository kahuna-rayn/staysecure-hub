import React from 'react';
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

interface CreateUserDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  newUser: NewUser;
  onUserChange: (user: NewUser) => void;
  onSubmit: (e: React.FormEvent) => void;
}

const CreateUserDialog: React.FC<CreateUserDialogProps> = ({
  isOpen,
  onOpenChange,
  newUser,
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

  const updateField = (field: keyof NewUser, value: string) => {
    const updatedUser = { ...newUser, [field]: value };
    
    // Auto-populate username with email when email changes
    if (field === 'email') {
      updatedUser.username = value;
    }
    
    onUserChange(updatedUser);
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
    const updatedUser = { ...newUser, [field]: value };
    
    // Auto-update full_name when first_name or last_name changes
    const firstName = field === 'first_name' ? value : newUser.first_name || '';
    const lastName = field === 'last_name' ? value : newUser.last_name || '';
    updatedUser.full_name = `${firstName} ${lastName}`.trim();
    
    onUserChange(updatedUser);
  };

  const handleFullNameChange = (value: string) => {
    // Allow manual override of full_name
    onUserChange({ ...newUser, full_name: value });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New User</DialogTitle>
          <DialogDescription>
            Add a new user to your organization
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name</Label>
              <Input
                id="first_name"
                value={newUser.first_name}
                onChange={(e) => handleNameChange('first_name', e.target.value)}
                placeholder="Enter first name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name</Label>
              <Input
                id="last_name"
                value={newUser.last_name}
                onChange={(e) => handleNameChange('last_name', e.target.value)}
                placeholder="Enter last name"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name (Auto-generated, editable)</Label>
            <Input
              id="full_name"
              value={newUser.full_name}
              onChange={(e) => handleFullNameChange(e.target.value)}
              placeholder="Full name will be auto-generated from first and last name"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={newUser.email}
                onChange={(e) => updateField('email', e.target.value)}
                placeholder="Enter email address"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={newUser.password}
                onChange={(e) => updateField('password', e.target.value)}
                placeholder="Enter password"
                required
              />
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={newUser.status} onValueChange={(value) => updateField('status', value)}>
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
              <Label htmlFor="access_level">Access Level</Label>
              <Select value={newUser.access_level} onValueChange={(value) => updateField('access_level', value)}>
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
            <Label htmlFor="location">Location</Label>
            <Select value={newUser.location_id || ''} onValueChange={handleLocationChange}>
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

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Create User</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}; 
export default CreateUserDialog;