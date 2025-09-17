import React, { useState } from 'react';
import { useUserProfiles } from '@/hooks/useUserProfiles';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, MapPin } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { useQuery } from '@tanstack/react-query';

interface PhysicalLocationAccess {
  id: string;
  full_name: string;
  email: string;
  department: string | null;
  role_account_type: string | null;
  location: string; // Keep for backward compatibility during migration
  location_id?: string; // New foreign key field
  access_purpose: string;
  date_access_created: string;
  date_access_revoked: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  locations?: {
    id: string;
    name: string;
  };
}

const PhysicalLocationAccess: React.FC = () => {
  const { profiles } = useUserProfiles();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    department: '',
    role_account_type: '',
    location: '',
    access_purpose: '',
    date_access_created: new Date().toISOString().split('T')[0],
    date_access_revoked: '',
    status: 'Active',
  });

  const { data: locationAccess = [], refetch } = useQuery({
    queryKey: ['physical-location-access'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('physical_location_access')
        .select(`
          *,
          locations (
            id,
            name
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as any[];
    },
  });

  const handleUserSelection = (userId: string) => {
    setSelectedUserId(userId);
    const selectedUser = profiles.find(profile => profile.id === userId);
    if (selectedUser) {
      setFormData(prev => ({
        ...prev,
        full_name: selectedUser.full_name || '',
        email: selectedUser.email || selectedUser.username || '',
        department: selectedUser.department || '',
        role_account_type: selectedUser.role || '',
      }));
    }
  };

  const resetForm = () => {
    setSelectedUserId('');
    setFormData({
      full_name: '',
      email: '',
      department: '',
      role_account_type: '',
      location: '',
      access_purpose: '',
      date_access_created: new Date().toISOString().split('T')[0],
      date_access_revoked: '',
      status: 'Active',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const insertData = {
        full_name: formData.full_name,
        user_id: 'ae5c8c73-e0c3-4a86-9c0d-123456789abc', // Placeholder user ID
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
        description: "Physical location access has been successfully added.",
      });
      
      setIsDialogOpen(false);
      resetForm();
      refetch();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-500';
      case 'Inactive': return 'bg-red-500';
      case 'Revoked': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Physical Location Access</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Physical Location Access</DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="user_select">Select User *</Label>
                  <Select value={selectedUserId} onValueChange={handleUserSelection}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a user from User Management" />
                    </SelectTrigger>
                    <SelectContent>
                      {profiles.map((profile) => (
                        <SelectItem key={profile.id} value={profile.id}>
                          {profile.full_name || 'No name'} ({profile.email || profile.username || 'No email'})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedUserId && (
                  <div className="col-span-2 p-3 bg-gray-50 rounded-lg">
                    <h4 className="font-medium mb-2">Selected User Details:</h4>
                    <p><strong>Name:</strong> {formData.full_name}</p>
                    <p><strong>Email:</strong> {formData.email}</p>
                    <p><strong>Department:</strong> {formData.department || 'Not specified'}</p>
                    <p><strong>Role:</strong> {formData.role_account_type || 'Not specified'}</p>
                  </div>
                )}

                <div>
                  <Label htmlFor="full_name">Full Name *</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    placeholder="Auto-filled when user is selected"
                    required
                    disabled={!!selectedUserId}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Auto-filled when user is selected"
                    required
                    disabled={!!selectedUserId}
                  />
                </div>
                <div>
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    disabled={!!selectedUserId}
                  />
                </div>
                <div>
                  <Label htmlFor="role_account_type">Role/Account Type</Label>
                  <Input
                    id="role_account_type"
                    value={formData.role_account_type}
                    onChange={(e) => setFormData({ ...formData, role_account_type: e.target.value })}
                    disabled={!!selectedUserId}
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
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={!selectedUserId}>
                  Add Location Access
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {locationAccess.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No physical location access records found</p>
          <p className="text-sm">Add your first location access record to get started.</p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Full Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Role/Account Type</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Access Purpose</TableHead>
                <TableHead>Date Created</TableHead>
                <TableHead>Date Revoked</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {locationAccess.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.full_name}</TableCell>
                  <TableCell>{item.email}</TableCell>
                  <TableCell>{item.department || 'Not specified'}</TableCell>
                  <TableCell>{item.role_account_type || 'Not specified'}</TableCell>
                  <TableCell>{item.locations?.name || item.location}</TableCell>
                  <TableCell>{item.access_purpose}</TableCell>
                  <TableCell>{new Date(item.date_access_created).toLocaleDateString()}</TableCell>
                  <TableCell>{item.date_access_revoked ? new Date(item.date_access_revoked).toLocaleDateString() : 'N/A'}</TableCell>
                  <TableCell>
                    <Badge className={`${getStatusColor(item.status)} text-white`}>
                      {item.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default PhysicalLocationAccess;
